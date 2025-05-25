import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';

export const supplierController = {
  list: async (req: Request, res: Response) => {
    const { search } = req.query;
    const where = search
      ? {
          OR: [
            { name: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
            { email: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
            { phone: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
            { document: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
            { address: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};
    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    res.json(suppliers);
  },
  create: async (req: Request, res: Response) => {
    const { name, email, phone, document, address } = req.body;
    try {
      const supplier = await prisma.supplier.create({
        data: { name, email, phone, document, address },
      });
      res.json(supplier);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && (error.meta as any)?.target?.includes('email')) {
        return res.status(400).json({ error: 'Já existe um fornecedor cadastrado com este e-mail.' });
      }
      throw error;
    }
  },
  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, phone, document, address, active } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, email, phone, document, address, active },
    });
    res.json(supplier);
  },
  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.supplier.delete({ where: { id } });
    res.json({ success: true });
  },
  get: async (req: Request, res: Response) => {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    res.json(supplier);
  },
}; 