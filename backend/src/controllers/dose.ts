import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const doseController = {
  list: async (req: Request, res: Response) => {
    try {
      const doses = await prisma.dose.findMany({
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
      res.json(doses);
    } catch (error) {
      console.error('Erro ao listar doses:', error);
      res.status(500).json({ error: 'Erro ao listar doses' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { name, description, price, image, items } = req.body;

      const dose = await prisma.dose.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          image,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: parseFloat(item.quantity),
              isChoosable: item.isChoosable || false,
              maxChoices: item.maxChoices || 1,
              categoryId: item.categoryId
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      res.json(dose);
    } catch (error) {
      console.error('Erro ao criar dose:', error);
      res.status(500).json({ error: 'Erro ao criar dose' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, price, image, items, active } = req.body;

      // Primeiro, removemos todos os itens existentes
      await prisma.doseItem.deleteMany({
        where: { doseId: id }
      });

      // Depois atualizamos a dose e criamos os novos itens
      const dose = await prisma.dose.update({
        where: { id },
        data: {
          name,
          description,
          price: parseFloat(price),
          image,
          active: typeof active === 'boolean' ? active : active === 'true' || active === '1',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: parseFloat(item.quantity),
              isChoosable: item.isChoosable || false,
              maxChoices: item.maxChoices || 1,
              categoryId: item.categoryId
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      res.json(dose);
    } catch (error) {
      console.error('Erro ao atualizar dose:', error);
      res.status(500).json({ error: 'Erro ao atualizar dose' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Primeiro removemos os itens da dose
      await prisma.doseItem.deleteMany({
        where: { doseId: id }
      });

      // Depois removemos a dose
      await prisma.dose.delete({
        where: { id }
      });

      res.json({ message: 'Dose removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover dose:', error);
      res.status(500).json({ error: 'Erro ao remover dose' });
    }
  }
}; 