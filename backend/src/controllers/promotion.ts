import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const promotionController = {
  list: async (req: Request, res: Response) => {
    try {
      const promotions = await prisma.promotion.findMany({
        include: {
          products: {
            include: {
              category: true
            }
          }
        }
      });
      res.json(promotions);
    } catch (error) {
      console.error('Erro ao listar promoções:', error);
      res.status(500).json({ error: 'Erro ao listar promoções' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { name, description, price, originalPrice, productIds } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const promotion = await prisma.promotion.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          originalPrice: parseFloat(originalPrice),
          image: imageUrl,
          products: {
            connect: JSON.parse(productIds).map((id: string) => ({ id }))
          }
        },
        include: {
          products: {
            include: {
              category: true
            }
          }
        }
      });

      res.json(promotion);
    } catch (error) {
      console.error('Erro ao criar promoção:', error);
      res.status(500).json({ error: 'Erro ao criar promoção' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, price, originalPrice, productIds, active } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      const promotion = await prisma.promotion.update({
        where: { id },
        data: {
          name,
          description,
          price: parseFloat(price),
          originalPrice: parseFloat(originalPrice),
          active: active === 'true',
          ...(imageUrl && { image: imageUrl }),
          products: {
            set: JSON.parse(productIds).map((id: string) => ({ id }))
          }
        },
        include: {
          products: {
            include: {
              category: true
            }
          }
        }
      });

      res.json(promotion);
    } catch (error) {
      console.error('Erro ao atualizar promoção:', error);
      res.status(500).json({ error: 'Erro ao atualizar promoção' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.promotion.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar promoção:', error);
      res.status(500).json({ error: 'Erro ao deletar promoção' });
    }
  }
}; 