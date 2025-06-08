import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SaleItem {
  productId?: string;
  doseId?: string;
  quantity: number;
  price: number;
  choosableItems?: {
    productId: string;
    quantity: number;
  }[];
}

interface CreateSaleRequest {
  items: SaleItem[];
  paymentMethodId: string;
  cpfCnpj?: string;
}

export const createSale = async (req: Request<{}, {}, CreateSaleRequest>, res: Response) => {
  try {
    const { items, paymentMethodId, cpfCnpj } = req.body;

    // Validar itens
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'É necessário pelo menos um item para realizar a venda' });
    }

    // Validar método de pagamento
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'É necessário informar o método de pagamento' });
    }

    // Criar a venda
    const sale = await prisma.sale.create({
      data: {
        paymentMethodId,
        cpfCnpj,
        total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        items: {
          create: items.map(item => ({
            productId: item.productId,
            doseId: item.doseId,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
          }))
        }
      },
      include: {
        items: true
      }
    });

    // Atualizar estoque dos produtos
    for (const item of items) {
      if (item.productId) {
        // Se for um produto normal
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      } else if (item.doseId) {
        // Se for uma dose, atualizar o estoque dos produtos escolhidos
        const dose = await prisma.dose.findUnique({
          where: { id: item.doseId },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });

        if (!dose) {
          throw new Error(`Dose não encontrada: ${item.doseId}`);
        }

        // Atualizar estoque dos produtos fixos
        for (const doseItem of dose.items) {
          if (!doseItem.isChoosable) {
            await prisma.product.update({
              where: { id: doseItem.productId },
              data: {
                stock: {
                  decrement: doseItem.quantity * item.quantity
                }
              }
            });
          }
        }

        // Atualizar estoque dos produtos escolhidos
        if (item.choosableItems) {
          for (const choosableItem of item.choosableItems) {
            await prisma.product.update({
              where: { id: choosableItem.productId },
              data: {
                stock: {
                  decrement: choosableItem.quantity * item.quantity
                }
              }
            });
          }
        }
      }
    }

    return res.status(201).json(sale);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    return res.status(500).json({ error: 'Erro ao criar venda' });
  }
}; 