import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadToCloudinary } from '../utils/cloudinary';

const prisma = new PrismaClient();

export const doseController = {
  async create(req: Request, res: Response) {
    try {
      const { name, description, price, items } = req.body;
      let image = '';

      if (req.file) {
        image = await uploadToCloudinary(req.file);
      }

      const dose = await prisma.dose.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          image,
          items: {
            create: JSON.parse(items).map((item: any) => ({
              productId: item.productId,
              quantity: parseFloat(item.quantity),
              allowFlavorSelection: !!item.allowFlavorSelection,
              categoryId: item.categoryId || null,
              discountBy: item.discountBy || 'unit'
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

      return res.json(dose);
    } catch (error) {
      console.error('Erro ao criar dose:', error);
      return res.status(500).json({ error: 'Erro ao criar dose' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, price, items, active } = req.body;
      let image = '';

      const dose = await prisma.dose.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!dose) {
        return res.status(404).json({ error: 'Dose não encontrada' });
      }

      if (req.file) {
        image = await uploadToCloudinary(req.file);
      }

      // Atualizar dose
      const updatedDose = await prisma.dose.update({
        where: { id },
        data: {
          name,
          description,
          price: parseFloat(price),
          image: image || dose.image,
          active: active === 'true',
          items: {
            deleteMany: {},
            create: JSON.parse(items).map((item: any) => ({
              productId: item.productId,
              quantity: parseFloat(item.quantity),
              allowFlavorSelection: !!item.allowFlavorSelection,
              categoryId: item.categoryId || null,
              discountBy: item.discountBy || 'unit'
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

      return res.json(updatedDose);
    } catch (error) {
      console.error('Erro ao atualizar dose:', error);
      return res.status(500).json({ error: 'Erro ao atualizar dose' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const dose = await prisma.dose.findUnique({
        where: { id }
      });

      if (!dose) {
        return res.status(404).json({ error: 'Dose não encontrada' });
      }

      // Deletar todos os DoseItem relacionados
      await prisma.doseItem.deleteMany({ where: { doseId: id } });
      await prisma.dose.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir dose:', error);
      return res.status(500).json({ error: 'Erro ao excluir dose' });
    }
  },

  async list(req: Request, res: Response) {
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

      return res.json(doses);
    } catch (error) {
      console.error('Erro ao listar doses:', error);
      return res.status(500).json({ error: 'Erro ao listar doses' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const dose = await prisma.dose.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!dose) {
        return res.status(404).json({ error: 'Dose não encontrada' });
      }

      return res.json(dose);
    } catch (error) {
      console.error('Erro ao buscar dose:', error);
      return res.status(500).json({ error: 'Erro ao buscar dose' });
    }
  }
}; 