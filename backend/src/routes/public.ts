import express, { Request, Response } from 'express';
import prisma from '../config/prisma';

const router = express.Router();

router.get('/payment-methods', async (req: Request, res: Response) => {
  const methods = await prisma.paymentMethod.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  res.json(methods);
});

router.get('/products', async (req: Request, res: Response) => {
  try {
    const { categoryId, search } = req.query;
    const where: any = { active: true, stock: { gt: 0 } };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
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
    console.error('Erro ao listar produtos públicos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// Listar categorias de produtos
router.get('/products/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Listar promoções
router.get('/promotions', async (req: Request, res: Response) => {
  try {
    const promotions = await prisma.promotion.findMany({
      where: { active: true },
      include: {
        products: {
          include: {
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(promotions);
  } catch (error) {
    console.error('Erro ao listar promoções:', error);
    res.status(500).json({ error: 'Erro ao listar promoções' });
  }
});

// Listar combos
router.get('/combos', async (req: Request, res: Response) => {
  try {
    const combos = await prisma.combo.findMany({
      where: { active: true },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(combos);
  } catch (error) {
    console.error('Erro ao listar combos:', error);
    res.status(500).json({ error: 'Erro ao listar combos' });
  }
});

// Listar ofertas
router.get('/offers', async (req: Request, res: Response) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { active: true },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(offers);
  } catch (error) {
    console.error('Erro ao listar ofertas:', error);
    res.status(500).json({ error: 'Erro ao listar ofertas' });
  }
});

export default router; 