import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SaleItem {
  productId?: string;
  doseId?: string;
  quantity: number;
  price: number;
  choosableItems?: { productId: string; quantity: number }[];
}

interface CreateSaleRequest {
  items: SaleItem[];
  paymentMethodId: string;
  cpfCnpj?: string;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

export const createSale = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, paymentMethodId, cpfCnpj } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'É necessário pelo menos um item para a venda' });
    }

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'É necessário informar o método de pagamento' });
    }

    // Calcula o total da venda
    const total = items.reduce((acc: number, item: SaleItem) => acc + (item.price * item.quantity), 0);

    // Cria a venda
    const sale = await prisma.sale.create({
      data: {
        total,
        paymentMethodId,
        userId: req.user.id,
        items: {
          create: items.map((item: SaleItem) => ({
            quantity: item.quantity,
            price: item.price,
            productId: item.productId,
            doseId: item.doseId
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true,
            dose: true
          }
        }
      }
    });

    // Atualiza o estoque dos produtos
    for (const item of items) {
      if (item.productId) {
        // Atualiza o estoque do produto
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      } else if (item.doseId) {
        // Busca a dose e seus itens
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
          continue;
        }

        // Atualiza o estoque dos produtos da dose
        for (const doseItem of dose.items) {
          if (doseItem.isChoosable && item.choosableItems) {
            // Se o item é escolhível, atualiza apenas os produtos escolhidos
            const chosenItem = item.choosableItems.find((ci: { productId: string; quantity: number }) => ci.productId === doseItem.productId);
            if (chosenItem) {
              await prisma.product.update({
                where: { id: doseItem.productId },
                data: {
                  stock: {
                    decrement: chosenItem.quantity
                  }
                }
              });
            }
          } else {
            // Se não é escolhível, atualiza normalmente
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
      }
    }

    return res.status(201).json(sale);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    return res.status(500).json({ error: 'Erro ao criar venda' });
  }
}; 