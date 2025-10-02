import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../config/errorHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const vendedorController = {
  // Dashboard do vendedor
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }

      // Buscar estatísticas básicas para o vendedor
      const [
        totalProducts,
        lowStockProducts,
        totalCategories,
        recentSales
      ] = await Promise.all([
        prisma.product.count({
          where: { active: true }
        }),
        prisma.product.count({
          where: { 
            active: true,
            stockStatus: 'LOW_STOCK'
          }
        }),
        prisma.category.count({
          where: { active: true }
        }),
        prisma.sale.count({
          where: {
            userId: userId,
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7))
            }
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalProducts,
          lowStockProducts,
          totalCategories,
          recentSales,
          user: {
            id: req.user?.id,
            email: req.user?.email,
            role: req.user?.role
          }
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dashboard do vendedor:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Listar produtos para o vendedor
  async getProducts(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, search = '', category = '' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        active: true
      };

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
          { barcode: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (category) {
        where.categoryId = category;
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            supplier: true
          },
          orderBy: { name: 'asc' },
          skip,
          take: Number(limit)
        }),
        prisma.product.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Buscar categorias
  async getCategories(req: AuthRequest, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }
      });

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Buscar estoque
  async getStock(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, search = '', status = '' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        active: true
      };

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { barcode: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.stockStatus = status;
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            supplier: true
          },
          orderBy: { name: 'asc' },
          skip,
          take: Number(limit)
        }),
        prisma.product.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Buscar vendas do vendedor
  async getSales(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, status = '' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const where: any = {
        userId: userId
      };

      if (status) {
        where.status = status;
      }

      const [sales, total] = await Promise.all([
        prisma.sale.findMany({
          where,
          include: {
            client: true,
            paymentMethod: true,
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.sale.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          sales,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Criar nova venda (PDV)
  async createSale(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { items, clientId, paymentMethodId, total, discount = 0 } = req.body;

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('Itens da venda são obrigatórios', 400);
      }

      // Verificar se os produtos existem e têm estoque suficiente
      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new AppError(`Produto ${item.productId} não encontrado`, 400);
        }

        if (product.stock < item.quantity) {
          throw new AppError(`Estoque insuficiente para o produto ${product.name}`, 400);
        }
      }

      // Criar a venda
      const sale = await prisma.sale.create({
        data: {
          userId,
          clientId: clientId || null,
          paymentMethodId: paymentMethodId || null,
          total,
          discount,
          status: 'COMPLETED',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              costPrice: item.costPrice || 0,
              discount: item.discount || 0
            }))
          }
        },
        include: {
          client: true,
          paymentMethod: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // Atualizar estoque dos produtos
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });

        // Registrar movimento de estoque
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'out',
            quantity: item.quantity,
            unitCost: item.costPrice || 0,
            totalCost: (item.costPrice || 0) * item.quantity,
            origin: 'venda_pdv',
            notes: `Venda realizada por vendedor ${userId}`
          }
        });
      }

      res.status(201).json({
        success: true,
        data: sale
      });
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ 
          success: false, 
          error: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  }
};
