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
      
      // Buscar produto atual para calcular o custo médio ponderado
      const produto = await prisma.product.findUnique({ 
        where: { id: productId },
        select: { 
          stock: true, 
          costPrice: true, 
          isFractioned: true, 
          unitVolume: true 
        } 
      });

      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Calcular o novo custo médio ponderado
      const estoqueAtual = produto.stock;
      const custoAtual = produto.costPrice;
      const quantidadeNova = Number(quantity);
      const custoNovo = Number(unitCost);

      let novoCustoMedio: number;

      if (estoqueAtual === 0) {
        // Se não há estoque, o novo custo é simplesmente o custo da nova compra
        novoCustoMedio = custoNovo;
      } else {
        // Cálculo do custo médio ponderado:
        // (Estoque atual × Custo atual + Quantidade nova × Custo novo) ÷ (Estoque atual + Quantidade nova)
        const valorTotalAtual = estoqueAtual * custoAtual;
        const valorTotalNovo = quantidadeNova * custoNovo;
        const estoqueTotal = estoqueAtual + quantidadeNova;
        
        novoCustoMedio = (valorTotalAtual + valorTotalNovo) / estoqueTotal;
      }

      // Criar a entrada de estoque
      const entry = await prisma.stockEntry.create({
        data: {
          productId,
          quantity: quantidadeNova,
          unitCost: custoNovo,
          totalCost,
          supplierId: supplierId || null,
          notes: notes || null
        },
        include: { product: true, supplier: true }
      });

      // Atualizar o produto com o novo custo médio e estoque
      await prisma.product.update({
        where: { id: productId },
        data: {
          costPrice: novoCustoMedio,
          stock: { increment: quantidadeNova },
          ...(produto.isFractioned && produto.unitVolume ? {
            totalVolume: { increment: quantidadeNova * Number(produto.unitVolume) }
          } : {})
        }
      });

      res.status(201).json({
        ...entry,
        novoCustoMedio: novoCustoMedio.toFixed(2),
        estoqueAnterior: estoqueAtual,
        estoqueNovo: estoqueAtual + quantidadeNova
      });
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