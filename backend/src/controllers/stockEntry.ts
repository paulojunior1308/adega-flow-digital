import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const stockEntryController = {
  // Registrar nova entrada de estoque
  create: async (req: Request, res: Response) => {
    try {
      const { productId, quantity, unitCost, supplierId, notes } = req.body;
      if (!productId || !quantity || !unitCost) {
        return res.status(400).json({ error: 'Campos obrigatórios: produto, quantidade, custo unitário.' });
      }
      const totalCost = Number(quantity) * Number(unitCost);
      const entry = await prisma.stockEntry.create({
        data: {
          productId,
          quantity: Number(quantity),
          unitCost: Number(unitCost),
          totalCost,
          supplierId: supplierId || null,
          notes: notes || null
        },
        include: { product: true, supplier: true }
      });
      // Buscar produto para saber se é fracionado
      const produto = await prisma.product.findUnique({ where: { id: productId } });
      // Atualizar estoque do produto
      await prisma.product.update({
        where: { id: productId },
        data: {
          stock: { increment: Number(quantity) },
          ...(produto?.isFractioned && produto.unitVolume ? {
            totalVolume: { increment: Number(quantity) * Number(produto.unitVolume) }
          } : {})
        }
      });
      res.status(201).json(entry);
    } catch (error) {
      console.error('Erro ao registrar entrada de estoque:', error);
      res.status(500).json({ error: 'Erro ao registrar entrada de estoque' });
    }
  },

  // Listar entradas de estoque
  list: async (req: Request, res: Response) => {
    try {
      const entries = await prisma.stockEntry.findMany({
        include: { product: true, supplier: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(entries);
    } catch (error) {
      console.error('Erro ao listar entradas de estoque:', error);
      res.status(500).json({ error: 'Erro ao listar entradas de estoque' });
    }
  }
}; 