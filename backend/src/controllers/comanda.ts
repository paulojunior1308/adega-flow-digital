import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../config/errorHandler';
import { getSocketInstance } from '../config/socketInstance';

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

    // Processar produto normal, combo ou dose (lógica existente)
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