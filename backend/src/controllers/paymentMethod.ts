import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const paymentMethodController = {
  list: async (req: Request, res: Response) => {
    const methods = await prisma.paymentMethod.findMany({ orderBy: { name: 'asc' } });
    res.json(methods);
  },
  create: async (req: Request, res: Response) => {
    const { name, active } = req.body;
    const method = await prisma.paymentMethod.create({ data: { name, active } });
    res.json(method);
  },
  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, active } = req.body;
    const method = await prisma.paymentMethod.update({ where: { id }, data: { name, active } });
    res.json(method);
  },
  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.paymentMethod.delete({ where: { id } });
    res.json({ success: true });
  },
  get: async (req: Request, res: Response) => {
    const { id } = req.params;
    const method = await prisma.paymentMethod.findUnique({ where: { id } });
    res.json(method);
  },
}; 