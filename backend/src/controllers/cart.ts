import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../config/errorHandler';

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
      // Buscar dose
      const dose = await prisma.dose.findUnique({
        where: { id: doseId },
        include: { items: { include: { product: true } } }
      });
      if (!dose) {
        throw new AppError('Dose não encontrada', 404);
      }
      // Verificar se já existe essa dose no carrinho (mesmo doseId e mesmas escolhas, se houver)
      // Para simplificar, não agrupa doses com escolhas diferentes
      const existing = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, doseId },
      });
      if (existing) {
        // Atualiza quantidade
        const updated = await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
          include: { product: true, dose: { include: { items: { include: { product: true } } } } },
        });
        return res.status(201).json(updated);
      } else {
        // Cria item de dose no carrinho
        const item = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: dose.items[0]?.productId || '', // Só para não ser nulo, mas não é usado
            quantity,
            doseId,
            // Salvar escolhas do cliente se houver (pode ser serializado em um campo extra futuramente)
            // choosableSelections: JSON.stringify(choosableSelections) // se quiser persistir
            ...(price !== undefined ? { price } : {}),
          },
          include: { product: true, dose: { include: { items: { include: { product: true } } } } },
        });
        return res.status(201).json(item);
      }
    }
    if (comboId) {
      // Adiciona todos os produtos do combo ao carrinho
      const combo = await prisma.combo.findUnique({
        where: { id: comboId },
        include: { items: true }
      });
      if (!combo) {
        throw new AppError('Combo não encontrado', 404);
      }
      const createdItems = [];
      const choosableSelections = req.body.choosableSelections || {};
      console.log('Recebido choosableSelections:', JSON.stringify(choosableSelections));
      for (const comboItem of combo.items) {
        if (comboItem.allowFlavorSelection && comboItem.categoryId) {
          // Adicionar os escolhidos pelo cliente para esta categoria
          const selections = choosableSelections[comboItem.categoryId] || {};
          for (const [productId, qty] of Object.entries(selections)) {
            const quantityNumber = Number(qty);
            if (quantityNumber > 0) {
              console.log('Buscando produto', productId);
              // Busca por produto + comboId
              const existing = await prisma.cartItem.findFirst({
                where: { cartId: cart.id, productId, comboId },
              });
              const customPrice = req.body.priceByProduct && req.body.priceByProduct[productId];
              if (existing) {
                const updated = await prisma.cartItem.update({
                  where: { id: existing.id },
                  data: {
                    quantity: existing.quantity + quantityNumber * quantity,
                    ...(customPrice !== undefined ? { price: customPrice } : {}),
                  },
                });
                createdItems.push(updated);
              } else {
                const item = await prisma.cartItem.create({
                  data: {
                    cartId: cart.id,
                    productId,
                    quantity: quantityNumber * quantity,
                    comboId,
                    ...(customPrice !== undefined ? { price: customPrice } : {}),
                  },
                  include: { product: true },
                });
                createdItems.push(item);
              }
            }
          }
        } else {
          // Item fixo: adicionar normalmente
          const existing = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, productId: comboItem.productId, comboId },
          });
          const customPrice = req.body.priceByProduct && req.body.priceByProduct[comboItem.productId];
          if (existing) {
            const updated = await prisma.cartItem.update({
              where: { id: existing.id },
              data: {
                quantity: existing.quantity + comboItem.quantity * quantity,
                ...(customPrice !== undefined ? { price: customPrice } : {}),
              },
            });
            createdItems.push(updated);
          } else {
            const item = await prisma.cartItem.create({
              data: {
                cartId: cart.id,
                productId: comboItem.productId,
                quantity: comboItem.quantity * quantity,
                comboId,
                ...(customPrice !== undefined ? { price: customPrice } : {}),
              },
              include: { product: true },
            });
            createdItems.push(item);
          }
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