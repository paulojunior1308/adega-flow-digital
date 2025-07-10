import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../config/errorHandler';
import { getSocketInstance } from '../config/socketInstance';
import { v4 as uuidv4 } from 'uuid';

export const comandaController = {
  // Criar nova comanda
  create: async (req: Request, res: Response) => {
    const { customerName, tableNumber } = req.body;
    const userId = (req as any).user.id;

    if (!customerName?.trim()) {
      throw new AppError('Nome do cliente é obrigatório', 400);
    }

    // Encontrar o próximo número de comanda
    const lastComanda = await prisma.comanda.findFirst({
      orderBy: { number: 'desc' }
    });
    const nextNumber = (lastComanda?.number || 0) + 1;

    const comanda = await prisma.comanda.create({
      data: {
        number: nextNumber,
        customerName: customerName.trim(),
        tableNumber: tableNumber?.trim() || null,
        createdBy: userId,
        total: 0
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Emitir evento para todos os admins
    const io = getSocketInstance();
    if (io) {
      io.emit('comanda-created', { comanda });
    }

    res.status(201).json(comanda);
  },

  // Listar todas as comandas
  list: async (req: Request, res: Response) => {
    const comandas = await prisma.comanda.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(comandas);
  },

  // Buscar comanda por ID
  getById: async (req: Request, res: Response) => {
    const { id } = req.params;

    const comanda = await prisma.comanda.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!comanda) {
      throw new AppError('Comanda não encontrada', 404);
    }

    // Log dos itens da comanda (GET)
    console.log('[DEBUG] Itens da comanda (GET):', comanda.items.map(i => ({
      id: i.id,
      name: i.name,
      productId: i.productId,
      comboInstanceId: i.comboInstanceId
    })));

    res.json(comanda);
  },

  // Adicionar item à comanda
  addItem: async (req: Request, res: Response) => {
    const { comandaId } = req.params;
    const { productId, comboId, doseId, offerId, quantity, price, name, code, isDoseItem, isFractioned, discountBy, choosableSelections } = req.body;

    // Verificar se a comanda existe e está aberta
    const comanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: { items: true }
    });

    if (!comanda) {
      throw new AppError('Comanda não encontrada', 404);
    }

    if (!comanda.isOpen) {
      throw new AppError('Comanda está fechada', 400);
    }

    // Processar oferta
    if (offerId) {
      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: { items: { include: { product: true } } }
      });

      if (!offer) {
        throw new AppError('Oferta não encontrada', 404);
      }

      // Adicionar cada item da oferta à comanda
      const createdItems = [];
      for (const offerItem of offer.items) {
        const item = await prisma.comandaItem.create({
          data: {
            comandaId,
            productId: offerItem.productId,
            code: offerItem.product.sku || offerItem.product.barcode || offerItem.product.id.substring(0, 6),
            name: `${offerItem.product.name} (Oferta: ${offer.name})`,
            quantity: offerItem.quantity * (quantity || 1),
            price: offer.price / offer.items.reduce((sum, item) => sum + item.quantity, 0), // Preço proporcional
            total: (offer.price / offer.items.reduce((sum, item) => sum + item.quantity, 0)) * offerItem.quantity * (quantity || 1),
            offerInstanceId: offerId
          },
          include: {
            product: true
          }
        });
        createdItems.push(item);
      }

      // Atualizar total da comanda
      const newTotal = comanda.items.reduce((sum, item) => sum + item.total, 0) + 
                      createdItems.reduce((sum, item) => sum + item.total, 0);
      await prisma.comanda.update({
        where: { id: comandaId },
        data: { total: newTotal }
      });

      // Buscar comanda atualizada
      const updatedComanda = await prisma.comanda.findUnique({
        where: { id: comandaId },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              name: true
            }
          }
        }
      });

      // Emitir evento para todos os admins
      const io = getSocketInstance();
      if (io) {
        io.emit('comanda-updated', { comanda: updatedComanda });
      }

      return res.json(updatedComanda);
    }

    // Processar dose
    if (doseId) {
      console.log('[COMANDA][LOG] Adicionando dose à comanda. Payload:', req.body);
      const dose = await prisma.dose.findUnique({
        where: { id: doseId },
        include: { items: { include: { product: true } } }
      });
      console.log('[COMANDA][LOG] Dose encontrada:', JSON.stringify(dose, null, 2));
      if (!dose) {
        throw new AppError('Dose não encontrada', 404);
      }

      // Gerar um id único para esta instância da dose
      const doseInstanceId = uuidv4();
      const createdItems = [];

      // Adicionar todos os produtos da dose como comandaItems com o mesmo doseInstanceId
      for (const doseItem of dose.items) {
        const item = await prisma.comandaItem.create({
                     data: {
             comandaId,
             productId: doseItem.productId,
             code: doseItem.product.sku || doseItem.product.barcode || doseItem.product.id.substring(0, 6),
             name: `Dose ${dose.name} - ${doseItem.product.name}`,
             quantity: doseItem.quantity * (quantity || 1),
             price: dose.price / dose.items.reduce((sum, item) => sum + item.quantity, 0), // Preço proporcional
             total: (dose.price / dose.items.reduce((sum, item) => sum + item.quantity, 0)) * doseItem.quantity * (quantity || 1),
             isDoseItem: true,
             isFractioned: doseItem.product.isFractioned,
             discountBy: doseItem.product.isFractioned ? 'volume' : 'unit',
             choosableSelections: choosableSelections || null
           },
          include: {
            product: true
          }
        });
        createdItems.push(item);
      }

      // Atualizar total da comanda
      const newTotal = comanda.items.reduce((sum, item) => sum + item.total, 0) + 
                      createdItems.reduce((sum, item) => sum + item.total, 0);
      await prisma.comanda.update({
        where: { id: comandaId },
        data: { total: newTotal }
      });

      // Buscar comanda atualizada
      const updatedComanda = await prisma.comanda.findUnique({
        where: { id: comandaId },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              name: true
            }
          }
        }
      });

      // Emitir evento para todos os admins
      const io = getSocketInstance();
      if (io) {
        io.emit('comanda-updated', { comanda: updatedComanda });
      }

      return res.json(updatedComanda);
    }

    // Processar combo
    if (comboId) {
      console.log('[COMANDA][LOG] Adicionando combo à comanda. Payload:', req.body);
      const combo = await prisma.combo.findUnique({ 
        where: { id: comboId }, 
        include: { items: { include: { product: true } } } 
      });
      console.log('[COMANDA][LOG] Combo encontrado:', JSON.stringify(combo, null, 2));
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
              const customPrice = req.body.priceByProduct && req.body.priceByProduct[productId];
                             const item = await prisma.comandaItem.create({
                 data: {
                   comandaId,
                   productId,
                   code: comboItem.product.sku || comboItem.product.barcode || comboItem.product.id.substring(0, 6),
                   name: `Combo ${combo.name} - ${comboItem.product.name}`,
                   quantity: quantityNumber * (quantity || 1),
                   price: customPrice !== undefined ? customPrice : (combo.price / combo.items.reduce((sum, item) => sum + item.quantity, 0)),
                   total: (customPrice !== undefined ? customPrice : (combo.price / combo.items.reduce((sum, item) => sum + item.quantity, 0))) * quantityNumber * (quantity || 1),
                   isDoseItem: false,
                   isFractioned: comboItem.product.isFractioned,
                   discountBy: comboItem.product.isFractioned ? 'volume' : 'unit',
                   choosableSelections: choosableSelections || null
                 },
                include: { product: true },
              });
              createdItems.push(item);
            }
          }
        } else {
          // Item fixo: adicionar normalmente
          const customPrice = req.body.priceByProduct && req.body.priceByProduct[comboItem.productId];
                     const item = await prisma.comandaItem.create({
             data: {
               comandaId,
               productId: comboItem.productId,
               code: comboItem.product.sku || comboItem.product.barcode || comboItem.product.id.substring(0, 6),
               name: `Combo ${combo.name} - ${comboItem.product.name}`,
               quantity: comboItem.quantity * (quantity || 1),
               price: customPrice !== undefined ? customPrice : (combo.price / combo.items.reduce((sum, item) => sum + item.quantity, 0)),
               total: (customPrice !== undefined ? customPrice : (combo.price / combo.items.reduce((sum, item) => sum + item.quantity, 0))) * comboItem.quantity * (quantity || 1),
               isDoseItem: false,
               isFractioned: comboItem.product.isFractioned,
               discountBy: comboItem.product.isFractioned ? 'volume' : 'unit',
               choosableSelections: choosableSelections || null
             },
            include: { product: true },
          });
          createdItems.push(item);
        }
      }

      // Atualizar total da comanda
      const newTotal = comanda.items.reduce((sum, item) => sum + item.total, 0) + 
                      createdItems.reduce((sum, item) => sum + item.total, 0);
      await prisma.comanda.update({
        where: { id: comandaId },
        data: { total: newTotal }
      });

      // Buscar comanda atualizada
      const updatedComanda = await prisma.comanda.findUnique({
        where: { id: comandaId },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              name: true
            }
          }
        }
      });

      // Emitir evento para todos os admins
      const io = getSocketInstance();
      if (io) {
        io.emit('comanda-updated', { comanda: updatedComanda });
      }

      return res.json(updatedComanda);
    }

    // Processar produto normal (lógica existente)
    if (!productId || !quantity || !price || !name || !code) {
      throw new AppError('Dados do item são obrigatórios', 400);
    }

    // Criar o item
    const item = await prisma.comandaItem.create({
      data: {
        comandaId,
        productId,
        code,
        name,
        quantity,
        price,
        total: price * quantity,
        isDoseItem: isDoseItem || false,
        isFractioned: isFractioned || false,
        discountBy: discountBy || null,
        choosableSelections: choosableSelections || null
      },
      include: {
        product: true
      }
    });

    // Atualizar total da comanda
    const newTotal = comanda.items.reduce((sum, item) => sum + item.total, 0) + item.total;
    await prisma.comanda.update({
      where: { id: comandaId },
      data: { total: newTotal }
    });

    // Buscar comanda atualizada
    const updatedComanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Emitir evento para todos os admins
    const io = getSocketInstance();
    if (io) {
      io.emit('comanda-updated', { comanda: updatedComanda });
    }

    res.json(updatedComanda);
  },

  // Adicionar todos os itens de um combo de uma vez
  addComboItems: async (req: Request, res: Response) => {
    const { comandaId } = req.params;
    const { comboId, comboInstanceId, items } = req.body;
    console.log('[DEBUG] addComboItems chamado', { comboId, comboInstanceId, itemsLength: items.length });

    // Verificar se a comanda existe e está aberta
    const comanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: { items: true }
    });

    if (!comanda) {
      throw new AppError('Comanda não encontrada', 404);
    }
    if (!comanda.isOpen) {
      throw new AppError('Comanda está fechada', 400);
    }

    // Adicionar todos os itens do combo
    const createdItems = [];
    for (const item of items) {
      const created = await prisma.comandaItem.create({
        data: {
          comandaId,
          productId: item.productId,
          code: item.code,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          isDoseItem: false,
          isFractioned: item.isFractioned,
          discountBy: item.discountBy,
          choosableSelections: item.choosableSelections || null,
          comboInstanceId,
        },
        include: { product: true }
      });
      createdItems.push(created);
    }

    // Atualizar total da comanda
    const newTotal = comanda.items.reduce((sum, item) => sum + item.total, 0) + createdItems.reduce((sum, item) => sum + item.total, 0);
    await prisma.comanda.update({
      where: { id: comandaId },
      data: { total: newTotal }
    });

    // Buscar comanda atualizada
    const updatedComanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: {
        items: { include: { product: true } },
        user: { select: { name: true } }
      }
    });

    // Log dos itens da comanda após adição
    console.log('[DEBUG] Itens da comanda após adição:', updatedComanda.items.map(i => ({
      id: i.id,
      name: i.name,
      productId: i.productId,
      comboInstanceId: i.comboInstanceId
    })));

    // Emitir evento para todos os admins
    const io = getSocketInstance();
    if (io) {
      io.emit('comanda-updated', { comanda: updatedComanda });
    }

    res.json(updatedComanda);
  },

  // Atualizar quantidade de um item
  updateItemQuantity: async (req: Request, res: Response) => {
    const { comandaId, itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      throw new AppError('Quantidade deve ser maior que zero', 400);
    }

    // Verificar se a comanda existe e está aberta
    const comanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: { items: true }
    });

    if (!comanda) {
      throw new AppError('Comanda não encontrada', 404);
    }

    if (!comanda.isOpen) {
      throw new AppError('Comanda está fechada', 400);
    }

    // Encontrar o item
    const item = comanda.items.find(i => i.id === itemId);
    if (!item) {
      throw new AppError('Item não encontrado', 404);
    }

    if (quantity === 0) {
      // Remover item se quantidade for zero
      await prisma.comandaItem.delete({
        where: { id: itemId }
      });
    } else {
      // Atualizar quantidade
      await prisma.comandaItem.update({
        where: { id: itemId },
        data: {
          quantity,
          total: item.price * quantity
        }
      });
    }

    // Recalcular total da comanda
    const updatedItems = await prisma.comandaItem.findMany({
      where: { comandaId }
    });
    const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);

    await prisma.comanda.update({
      where: { id: comandaId },
      data: { total: newTotal }
    });

    // Buscar comanda atualizada
    const updatedComanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Emitir evento para todos os admins
    const io = getSocketInstance();
    if (io) {
      io.emit('comanda-updated', { comanda: updatedComanda });
    }

    res.json(updatedComanda);
  },

  // Remover item da comanda
  removeItem: async (req: Request, res: Response) => {
    const { comandaId, itemId } = req.params;

    // Verificar se a comanda existe e está aberta
    const comanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: { items: true }
    });

    if (!comanda) {
      throw new AppError('Comanda não encontrada', 404);
    }

    if (!comanda.isOpen) {
      throw new AppError('Comanda está fechada', 400);
    }

    // Encontrar o item
    const item = comanda.items.find(i => i.id === itemId);
    if (!item) {
      throw new AppError('Item não encontrado', 404);
    }

    // Remover item
    await prisma.comandaItem.delete({
      where: { id: itemId }
    });

    // Recalcular total da comanda
    const updatedItems = await prisma.comandaItem.findMany({
      where: { comandaId }
    });
    const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);

    await prisma.comanda.update({
      where: { id: comandaId },
      data: { total: newTotal }
    });

    // Buscar comanda atualizada
    const updatedComanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Emitir evento para todos os admins
    const io = getSocketInstance();
    if (io) {
      io.emit('comanda-updated', { comanda: updatedComanda });
    }

    res.json(updatedComanda);
  },

  // Fechar comanda
  close: async (req: Request, res: Response) => {
    const { id } = req.params;

    const comanda = await prisma.comanda.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!comanda) {
      throw new AppError('Comanda não encontrada', 404);
    }

    if (!comanda.isOpen) {
      throw new AppError('Comanda já está fechada', 400);
    }

    const updatedComanda = await prisma.comanda.update({
      where: { id },
      data: { isOpen: false },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Emitir evento para todos os admins
    const io = getSocketInstance();
    if (io) {
      io.emit('comanda-closed', { comanda: updatedComanda });
    }

    res.json(updatedComanda);
  },

  // Reabrir comanda
  reopen: async (req: Request, res: Response) => {
    const { id } = req.params;

    const comanda = await prisma.comanda.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!comanda) {
      throw new AppError('Comanda não encontrada', 404);
    }

    if (comanda.isOpen) {
      throw new AppError('Comanda já está aberta', 400);
    }

    const updatedComanda = await prisma.comanda.update({
      where: { id },
      data: { isOpen: true },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Emitir evento para todos os admins
    const io = getSocketInstance();
    if (io) {
      io.emit('comanda-reopened', { comanda: updatedComanda });
    }

    res.json(updatedComanda);
  },

  // Deletar comanda
  delete: async (req: Request, res: Response) => {
    const { id } = req.params;

    const comanda = await prisma.comanda.findUnique({
      where: { id }
    });

    if (!comanda) {
      throw new AppError('Comanda não encontrada', 404);
    }

    await prisma.comanda.delete({
      where: { id }
    });

    // Emitir evento para todos os admins
    const io = getSocketInstance();
    if (io) {
      io.emit('comanda-deleted', { comandaId: id });
    }

    res.json({ message: 'Comanda deletada com sucesso' });
  }
}; 