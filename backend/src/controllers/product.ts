import { Request, Response } from 'express';
import prisma from '../config/prisma';

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
      
      const pCost = (costPrice !== undefined && costPrice !== null && costPrice !== '') ? parseFloat(costPrice) : null;
      const pMargin = (margin !== undefined && margin !== null && margin !== '') ? parseFloat(margin) : null;
      let pPrice = (price !== undefined && price !== null && price !== '') ? parseFloat(price) : null;
      
      // Se a margem e o custo forem fornecidos, o preço é (re)calculado.
      if (pCost !== null && pMargin !== null && !isNaN(pCost) && !isNaN(pMargin)) {
        pPrice = pCost * (1 + (pMargin / 100));
      }
      
      const product = await prisma.product.create({
        data: {
          name,
          description,
          price: (pPrice !== null && !isNaN(pPrice)) ? pPrice : 0,
          costPrice: (pCost !== null && !isNaN(pCost)) ? pCost : 0,
          margin: (pMargin !== null && !isNaN(pMargin)) ? pMargin : null,
          categoryId,
          supplierId: supplierId || null,
          stock: stock ? parseInt(stock) : 0,
          minStock: minStock ? parseInt(minStock) : 0,
          barcode: barcode || null,
          image: image || null,
          isFractioned: isFractioned === true || isFractioned === 'true',
          totalVolume: totalVolume ? parseFloat(totalVolume) : null,
          unitVolume: unitVolume ? parseFloat(unitVolume) : null
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
      
      const pCost = (costPrice !== undefined && costPrice !== null && costPrice !== '') ? parseFloat(costPrice) : null;
      const pMargin = (margin !== undefined && margin !== null && margin !== '') ? parseFloat(margin) : null;
      let pPrice = (price !== undefined && price !== null && price !== '') ? parseFloat(price) : null;

      if (pCost !== null && pMargin !== null && !isNaN(pCost) && !isNaN(pMargin)) {
        pPrice = pCost * (1 + (pMargin / 100));
      }

      const dataToUpdate: any = {};

      if (name !== undefined) dataToUpdate.name = name;
      if (description !== undefined) dataToUpdate.description = description;
      if (active !== undefined) dataToUpdate.active = typeof active === 'boolean' ? active : active === 'true' || active === '1';
      if (image !== undefined) dataToUpdate.image = image;
      if (isFractioned !== undefined) dataToUpdate.isFractioned = isFractioned === true || isFractioned === 'true';
      if (barcode !== undefined) dataToUpdate.barcode = barcode;
      if (stock !== undefined && stock !== null) dataToUpdate.stock = parseInt(stock);
      if (minStock !== undefined && minStock !== null) dataToUpdate.minStock = parseInt(minStock);
      
      if (totalVolume !== undefined) dataToUpdate.totalVolume = totalVolume === null ? null : parseFloat(totalVolume);
      if (unitVolume !== undefined) dataToUpdate.unitVolume = unitVolume === null ? null : parseFloat(unitVolume);
      
      if (pPrice !== null && !isNaN(pPrice)) {
        dataToUpdate.price = pPrice;
      }

      if (costPrice !== undefined) {
        dataToUpdate.costPrice = (pCost !== null && !isNaN(pCost)) ? pCost : null;
      }

      if (margin !== undefined) {
        dataToUpdate.margin = (pMargin !== null && !isNaN(pMargin)) ? pMargin : null;
      }
      
      if (categoryId !== undefined) dataToUpdate.category = { connect: { id: categoryId } };
      
      if (supplierId !== undefined) {
        if (supplierId === null) {
          dataToUpdate.supplier = { disconnect: true };
        } else {
          dataToUpdate.supplier = { connect: { id: supplierId } };
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: dataToUpdate,
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

      const product = await prisma.product.update({
        where: { id },
        data: { stock: parseInt(stock) },
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