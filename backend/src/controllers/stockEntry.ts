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

      // Registrar movimentação de entrada
      await prisma.stockMovement.create({
        data: {
          productId,
          type: 'in',
          quantity: quantidadeNova,
          unitCost: custoNovo,
          totalCost,
          notes: notes || null,
          origin: 'manual'
        }
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
  },

  // Registrar baixa manual de estoque
  stockOut: async (req: Request, res: Response) => {
    try {
      const { productId, quantity, notes } = req.body;
      if (!productId || !quantity) {
        return res.status(400).json({ error: 'Campos obrigatórios: produto e quantidade.' });
      }

      const quantidade = Number(quantity);
      
      // Buscar produto atual
      const produto = await prisma.product.findUnique({ 
        where: { id: productId },
        select: { 
          id: true,
          name: true,
          stock: true, 
          costPrice: true, 
          isFractioned: true, 
          unitVolume: true,
          totalVolume: true
        } 
      });

      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Verificar se há estoque suficiente
      if (produto.isFractioned) {
        // Para produtos fracionados, verificar volume
        if ((produto.totalVolume || 0) < quantidade) {
          return res.status(400).json({ 
            error: `Estoque insuficiente. Produto: ${produto.name}. Volume disponível: ${produto.totalVolume}ml, solicitado: ${quantidade}ml` 
          });
        }
      } else {
        // Para produtos não fracionados, verificar unidades
        if ((produto.stock || 0) < quantidade) {
          return res.status(400).json({ 
            error: `Estoque insuficiente. Produto: ${produto.name}. Unidades disponíveis: ${produto.stock}, solicitadas: ${quantidade}` 
          });
        }
      }

      const totalCost = (produto.costPrice || 0) * quantidade;

      // Registrar movimentação de saída
      await prisma.stockMovement.create({
        data: {
          productId,
          type: 'out',
          quantity: quantidade,
          unitCost: produto.costPrice || 0,
          totalCost,
          notes: notes || 'Baixa Manual',
          origin: 'baixa_manual'
        }
      });

      // Atualizar o produto com o novo estoque
      if (produto.isFractioned) {
        // Produto fracionado: desconta volume e recalcula estoque
        const unitVolume = produto.unitVolume || 1;
        const novoTotalVolume = (produto.totalVolume || 0) - quantidade;
        const novoStock = Math.floor(novoTotalVolume / unitVolume);
        
        await prisma.product.update({
          where: { id: productId },
          data: {
            totalVolume: novoTotalVolume,
            stock: novoStock
          }
        });
      } else {
        // Produto não fracionado: desconta unidades
        await prisma.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantidade } }
        });
      }

      res.status(201).json({
        message: 'Baixa de estoque registrada com sucesso',
        produto: produto.name,
        quantidadeBaixada: quantidade,
        estoqueAnterior: produto.isFractioned ? produto.totalVolume : produto.stock,
        estoqueNovo: produto.isFractioned ? 
          (produto.totalVolume || 0) - quantidade : 
          (produto.stock || 0) - quantidade
      });
    } catch (error) {
      console.error('Erro ao registrar baixa de estoque:', error);
      res.status(500).json({ error: 'Erro ao registrar baixa de estoque' });
    }
  },

  // Listar movimentações de estoque (entradas e saídas)
  listMovements: async (req: Request, res: Response) => {
    try {
      const movements = await prisma.stockMovement.findMany({
        include: { 
          product: {
            select: {
              id: true,
              name: true,
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      // Filtrar movimentações com produto nulo
      const safeMovements = movements.filter(mov => mov.product !== null);
      res.json(safeMovements);
    } catch (error) {
      console.error('Erro ao listar movimentações de estoque:', error);
      res.status(500).json({ error: 'Erro ao listar movimentações de estoque' });
    }
  }
}; 