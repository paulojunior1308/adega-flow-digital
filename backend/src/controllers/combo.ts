import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const comboController = {
  list: async (req: Request, res: Response) => {
    try {
      const combos = await prisma.combo.findMany({
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          },
          category: true
        }
      });
      res.json(combos);
    } catch (error) {
      console.error('Erro ao listar combos:', error);
      res.status(500).json({ error: 'Erro ao listar combos' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { name, description, price, items, image, categoryId } = req.body;
      const parsedItems = JSON.parse(items);
      const combo = await prisma.combo.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          image: image || undefined,
          categoryId: categoryId || null,
          items: {
            create: parsedItems.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              allowFlavorSelection: item.allowFlavorSelection,
              maxFlavors: item.maxFlavors || 1,
              categoryId: item.categoryId || null,
              nameFilter: item.nameFilter || null
            }))
          }
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          },
          category: true
        }
      });
      res.json(combo);
    } catch (error) {
      console.error('Erro ao criar combo:', error);
      res.status(500).json({ error: 'Erro ao criar combo' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, price, items, active, image, categoryId } = req.body;
      const parsedItems = JSON.parse(items);
      await prisma.comboItem.deleteMany({
        where: { comboId: id }
      });
      const combo = await prisma.combo.update({
        where: { id },
        data: {
          name,
          description,
          price: parseFloat(price),
          active: active === 'true',
          image: image || undefined,
          categoryId: categoryId || null,
          items: {
            create: parsedItems.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              allowFlavorSelection: item.allowFlavorSelection,
              maxFlavors: item.maxFlavors || 1,
              categoryId: item.categoryId || null,
              nameFilter: item.nameFilter || null
            }))
          }
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          },
          category: true
        }
      });
      res.json(combo);
    } catch (error) {
      console.error('Erro ao atualizar combo:', error);
      res.status(500).json({ error: 'Erro ao atualizar combo' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Primeiro deletamos os items do combo
      await prisma.comboItem.deleteMany({
        where: { comboId: id }
      });

      // Depois deletamos o combo
      await prisma.combo.delete({ where: { id } });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar combo:', error);
      res.status(500).json({ error: 'Erro ao deletar combo' });
    }
  },

  updateActive: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { active } = req.body;
      const combo = await prisma.combo.update({
        where: { id },
        data: { active: Boolean(active) },
      });
      res.json(combo);
    } catch (error) {
      console.error('Erro ao atualizar status do combo:', error);
      res.status(500).json({ error: 'Erro ao atualizar status do combo' });
    }
  }
}; 