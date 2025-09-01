import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { calculateStockStatus } from '../utils/stockStatus';

export const productController = {
  list: async (req: Request, res: Response) => {
    try {
      const { categoryId, pinned, search } = req.query;
      const where: any = {};
      if (categoryId) where.categoryId = categoryId;
      if (typeof pinned !== 'undefined') where.pinned = pinned === 'true';
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ];
      }
      const products = await prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          supplier: true
        }
      });
      res.json(products);
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      res.status(500).json({ error: 'Erro ao listar produtos' });
    }
  },

  listCategories: async (req: Request, res: Response) => {
    try {
      const categories = await prisma.category.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          description: true
        }
      });

      res.json(categories);
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      res.status(500).json({ error: 'Erro ao listar categorias' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { name, description, price, categoryId, supplierId, stock, minStock, barcode, costPrice, margin, image, isFractioned, totalVolume, unitVolume } = req.body;
      
      let finalPrice = parseFloat(price);
      
      // Se margin for fornecido E não houver preço definido, calcular o preço baseado no custo e margem
      if (margin && costPrice && !price) {
        const marginPercent = parseFloat(margin);
        finalPrice = parseFloat(costPrice) / (1 - (marginPercent / 100));
      }

      const stockValue = parseInt(stock);
      const isFractionedValue = isFractioned === true || isFractioned === 'true';
      const totalVolumeValue = totalVolume ? parseFloat(totalVolume) : null;
      
      // Calcular o status do estoque
      const stockStatus = calculateStockStatus(stockValue, isFractionedValue, totalVolumeValue);
      
      const product = await prisma.product.create({
        data: {
          name,
          description,
          price: finalPrice,
          costPrice: costPrice ? parseFloat(costPrice) : 0,
          margin: margin ? parseFloat(margin) : null,
          categoryId,
          supplierId: supplierId || null,
          stock: stockValue,
          minStock: minStock ? parseInt(minStock) : 0,
          barcode: barcode || null,
          image: image || null,
          isFractioned: isFractionedValue,
          totalVolume: totalVolumeValue,
          unitVolume: unitVolume ? parseFloat(unitVolume) : null,
          stockStatus
        },
        include: {
          category: true,
          supplier: true
        }
      });
      console.log('Produto criado:', product);
      res.json(product);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(500).json({ error: 'Erro ao criar produto' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, price, categoryId, supplierId, stock, minStock, barcode, costPrice, margin, active, image, isFractioned, totalVolume, unitVolume } = req.body;
      
      let finalPrice = parseFloat(price);
      
      // Se margin for fornecido, calcular o preço baseado no custo e margem
      if (margin && costPrice) {
        const marginPercent = parseFloat(margin);
        finalPrice = parseFloat(costPrice) / (1 - (marginPercent / 100));
      }

      const stockValue = parseInt(stock);
      const isFractionedValue = isFractioned === true || isFractioned === 'true';
      const totalVolumeValue = totalVolume ? parseFloat(totalVolume) : null;
      
      // Calcular o status do estoque
      const stockStatus = calculateStockStatus(stockValue, isFractionedValue, totalVolumeValue);
      
      const product = await prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          price: finalPrice,
          costPrice: costPrice ? parseFloat(costPrice) : undefined,
          margin: margin ? parseFloat(margin) : undefined,
          stock: stockValue,
          minStock: minStock ? parseInt(minStock) : undefined,
          barcode,
          active: typeof active === 'boolean' ? active : active === 'true' || active === '1',
          image: image || undefined,
          isFractioned: isFractionedValue,
          totalVolume: totalVolumeValue,
          unitVolume: unitVolume ? parseFloat(unitVolume) : null,
          stockStatus,
          category: {
            connect: { id: categoryId }
          },
          supplier: supplierId ? {
            connect: { id: supplierId }
          } : undefined
        },
        include: {
          category: true,
          supplier: true
        }
      });
      console.log('Produto atualizado:', product);
      res.json(product);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      res.status(500).json({ error: 'Erro ao atualizar produto.' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Verificar se o produto está vinculado a vendas
      const sales = await prisma.saleItem.findFirst({ where: { productId: id } });
      if (sales) {
        return res.status(400).json({ error: 'Não é possível excluir, pois o produto está vinculado a vendas.' });
      }
      // Verificar se o produto está vinculado a combos
      const combos = await prisma.comboItem.findFirst({ where: { productId: id } });
      if (combos) {
        return res.status(400).json({ error: 'Não é possível excluir, pois o produto está vinculado a combos.' });
      }
      await prisma.product.delete({ where: { id } });
      res.json({ message: 'Produto excluído com sucesso.' });
    } catch (error: any) {
      console.error('Erro ao deletar produto:', error);
      if (error.code === 'P2003') {
        return res.status(400).json({ error: 'Não é possível excluir este produto pois ele está sendo usado em outras partes do sistema.' });
      }
      res.status(500).json({ error: 'Erro ao deletar produto.' });
    }
  },

  // Listar todos os produtos com campos de promoção e combo
  listPromosCombos: async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        isPromotion: true,
        isCombo: true,
        active: true,
        category: true,
      },
    });
    res.json(products);
  },

  // Atualizar os campos de promoção e combo de um produto
  updatePromosCombos: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isPromotion, isCombo } = req.body;
    const product = await prisma.product.update({
      where: { id },
      data: {
        isPromotion: typeof isPromotion === 'boolean' ? isPromotion : undefined,
        isCombo: typeof isCombo === 'boolean' ? isCombo : undefined,
      },
      select: {
        id: true,
        name: true,
        isPromotion: true,
        isCombo: true,
      },
    });
    res.json(product);
  },

  updatePinned: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { pinned } = req.body;
      const product = await prisma.product.update({
        where: { id },
        data: { pinned: Boolean(pinned) },
      });
      res.json(product);
    } catch (error) {
      console.error('Erro ao atualizar pinned do produto:', error);
      res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  },

  updateStock: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { stock } = req.body;

      const stockValue = parseInt(stock);
      
      // Buscar informações do produto para calcular o status
      const productInfo = await prisma.product.findUnique({
        where: { id },
        select: {
          isFractioned: true,
          totalVolume: true
        }
      });

      if (!productInfo) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Calcular o novo status do estoque
      const stockStatus = calculateStockStatus(
        stockValue, 
        productInfo.isFractioned, 
        productInfo.totalVolume
      );

      const product = await prisma.product.update({
        where: { id },
        data: { 
          stock: stockValue,
          stockStatus
        },
        include: {
          category: true,
          supplier: true
        }
      });

      res.json(product);
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      res.status(500).json({ error: 'Erro ao atualizar estoque.' });
    }
  },
}; 