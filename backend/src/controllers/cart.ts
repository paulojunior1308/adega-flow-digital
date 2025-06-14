import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../config/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export const cartController = {
  // Listar itens do carrinho do usuário logado
  getCart: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            combo: true,
            dose: {
              include: {
                items: {
                  include: {
                    product: true
                  }
                }
              }
            }
          },
        },
      },
    });
    if (!cart) {
      const createdCart = await prisma.cart.create({ data: { userId } });
      cart = { ...createdCart, items: [] };
    }
    res.json(cart);
  },

  // Adicionar item ao carrinho
  addItem: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    let { productId, comboId, doseId, quantity, price, choosableSelections } = req.body;
    quantity = quantity || 1;
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }
    // NOVO: Adicionar dose ao carrinho
    if (doseId) {
      console.log('[CART][LOG] Adicionando dose ao carrinho. Payload:', req.body);
      // Buscar dose
      const dose = await prisma.dose.findUnique({
        where: { id: doseId },
        include: { items: { include: { product: true } } }
      });
      console.log('[CART][LOG] Dose encontrada:', JSON.stringify(dose, null, 2));
      if (!dose) {
        throw new AppError('Dose não encontrada', 404);
      }
      // Verificar se já existe essa dose no carrinho (mesmo doseId e mesmas escolhas, se houver)
      const existing = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, doseId },
      });
      if (existing) {
        const updated = await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
          include: { product: true, dose: { include: { items: { include: { product: true } } } } },
        });
        console.log('[CART][LOG] CartItem de dose atualizado:', JSON.stringify(updated, null, 2));
        const cartAfter = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true, dose: true, combo: true } } } });
        console.log('[CART][LOG] Carrinho após adicionar dose:', JSON.stringify(cartAfter, null, 2));
        return res.status(201).json(updated);
      } else {
        const item = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: dose.items[0]?.productId || '',
            quantity,
            doseId,
            price: dose.price,
          },
          include: { product: true, dose: { include: { items: { include: { product: true } } } } },
        });
        console.log('[CART][LOG] CartItem de dose criado:', JSON.stringify(item, null, 2));
        const cartAfter = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true, dose: true, combo: true } } } });
        console.log('[CART][LOG] Carrinho após adicionar dose:', JSON.stringify(cartAfter, null, 2));
        return res.status(201).json(item);
      }
    }
    if (comboId) {
      console.log('[CART][LOG] Adicionando combo ao carrinho. Payload:', req.body);
      const combo = await prisma.combo.findUnique({ where: { id: comboId }, include: { items: { include: { product: true } } } });
      console.log('[CART][LOG] Combo encontrado:', JSON.stringify(combo, null, 2));
      if (!combo) {
        throw new AppError('Combo não encontrado', 404);
      }
      const createdItems = [];
      const choosableSelections = req.body.choosableSelections || {};
      console.log('Recebido choosableSelections:', JSON.stringify(choosableSelections));
      // Gerar um id único para esta instância do combo
      const comboInstanceId = uuidv4();
      for (const comboItem of combo.items) {
        if (comboItem.allowFlavorSelection && comboItem.categoryId) {
          // Adicionar os escolhidos pelo cliente para esta categoria
          const selections = choosableSelections[comboItem.categoryId] || {};
          for (const [productId, qty] of Object.entries(selections)) {
            const quantityNumber = Number(qty);
            if (quantityNumber > 0) {
              console.log('Buscando produto', productId);
              // Não agrupar combos iguais, sempre criar novo cartItem com comboInstanceId
              const customPrice = req.body.priceByProduct && req.body.priceByProduct[productId];
              const item = await prisma.cartItem.create({
                data: {
                  cartId: cart.id,
                  productId,
                  quantity: quantityNumber * quantity,
                  comboId,
                  comboInstanceId,
                  ...(customPrice !== undefined ? { price: customPrice } : {}),
                },
                include: { product: true },
              });
              createdItems.push(item);
            }
          }
        } else {
          // Item fixo: adicionar normalmente, sempre com novo comboInstanceId
          const customPrice = req.body.priceByProduct && req.body.priceByProduct[comboItem.productId];
          const item = await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: comboItem.productId,
              quantity: comboItem.quantity * quantity,
              comboId,
              comboInstanceId,
              ...(customPrice !== undefined ? { price: customPrice } : {}),
            },
            include: { product: true },
          });
          createdItems.push(item);
        }
      }
      return res.status(201).json(createdItems);
    }
    // Produto normal
    productId = String(productId);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      console.error('Produto não encontrado no banco:', productId);
      throw new AppError('Produto não encontrado', 404);
    }
    // Verificar se já existe esse produto no carrinho
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, comboId: null },
    });
    const totalQuantity = (existing?.quantity || 0) + quantity;
    // Ajuste para produtos fracionáveis: comparar/descontar em ml
    if (product.isFractioned) {
      if (totalQuantity > (product.totalVolume || 0)) {
        throw new AppError(`Estoque insuficiente. Só temos ${product.totalVolume} ml de ${product.name}.`, 400);
      }
    } else {
      if (totalQuantity > product.stock) {
        throw new AppError(`Estoque insuficiente. Só temos ${product.stock} unidade(s) de ${product.name}.`, 400);
      }
    }
    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: totalQuantity },
        include: { product: true },
      });
      return res.status(201).json(updated);
    } else {
      const item = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          comboId: null,
          ...(price !== undefined ? { price } : {}),
        },
        include: { product: true },
      });
      return res.status(201).json(item);
    }
  },

  // Atualizar quantidade de um item
  updateItem: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;
    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
    if (!item || item.cart.userId !== userId) {
      throw new AppError('Item não encontrado', 404);
    }
    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true },
    });
    res.json(updated);
  },

  // Remover item do carrinho
  removeItem: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { itemId } = req.params;
    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
    if (!item || item.cart.userId !== userId) {
      throw new AppError('Item não encontrado', 404);
    }
    console.log('Removendo item do carrinho:', { id: item.id, productId: item.productId, comboId: item.comboId });
    // Se for item de combo, remover todos os itens do combo
    if (item.comboId) {
      await prisma.cartItem.deleteMany({ where: { cartId: item.cartId, comboId: item.comboId } });
      return res.json({ message: 'Combo removido do carrinho.' });
    }
    // Produto avulso: remover normalmente
    await prisma.cartItem.delete({ where: { id: itemId } });
    res.json({ message: 'Item removido do carrinho' });
  },
}; 