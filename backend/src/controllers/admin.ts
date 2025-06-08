import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { generateToken } from '../config/jwt';
import { comparePassword, hashPassword } from '../config/bcrypt';
import { AppError } from '../config/errorHandler';

export const adminController = {
  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Credenciais inválidas', 401);
    }

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      throw new AppError('Credenciais inválidas', 401);
    }

    if (user.role !== 'ADMIN') {
      throw new AppError('Acesso negado. Apenas administradores podem acessar esta área.', 403);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  },

  dashboard: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const totalProdutos = await prisma.product.count();
    const totalPedidos = await prisma.order.count();
    const totalClientes = await prisma.user.count({
      where: { role: 'USER' },
    });

    res.json({
      user,
      stats: {
        totalProdutos,
        totalPedidos,
        totalClientes,
      },
      message: 'Bem-vindo ao dashboard administrativo',
    });
  },

  getEstoque: async (req: Request, res: Response) => {
    const produtos = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        active: true,
        category: true,
      },
    });

    res.json(produtos);
  },

  getCadastroProdutos: async (req: Request, res: Response) => {
    const categorias = await prisma.category.findMany();
    const produtos = await prisma.product.findMany({
      include: {
        category: true,
      },
    });

    res.json({
      categorias,
      produtos,
    });
  },

  getPedidos: async (req: Request, res: Response) => {
    const pedidos = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(pedidos);
  },

  getRelatorios: async (req: Request, res: Response) => {
    const totalVendas = await prisma.order.aggregate({
      _sum: {
        total: true,
      },
    });

    const vendasPorMes = await prisma.order.groupBy({
      by: ['createdAt'],
      _sum: {
        total: true,
      },
    });

    const produtosMaisVendidos = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    res.json({
      totalVendas: totalVendas._sum.total || 0,
      vendasPorMes,
      produtosMaisVendidos,
    });
  },

  getConfiguracoes: async (req: Request, res: Response) => {
    res.json([]);
  },

  getPDV: async (req: Request, res: Response) => {
    const produtos = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        image: true,
        category: true,
      },
    });
    const combos = await prisma.combo.findMany({
      where: { active: true },
      include: { items: { include: { product: true } } },
    });
    res.json({ produtos, combos });
  },

  createUser: async (req: Request, res: Response) => {
    const { name, email, password, role, cpf } = req.body;

    if (!['ADMIN', 'MOTOBOY', 'USER'].includes(role)) {
      throw new AppError('Tipo de usuário inválido. Só é permitido ADMIN, MOTOBOY ou USER.', 400);
    }
    if (!cpf) {
      throw new AppError('CPF é obrigatório.', 400);
    }
    const userExists = await prisma.user.findUnique({
      where: { email },
    });
    if (userExists) {
      throw new AppError('Email já cadastrado', 400);
    }
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        cpf,
      },
    });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      cpf: user.cpf,
    });
  },

  getUsers: async (req: Request, res: Response) => {
    const { roles } = req.query;
    let where = {};
    if (roles) {
      const rolesArray = String(roles).split(',').map(r => r.trim().toUpperCase());
      where = { role: { in: rolesArray } };
    }
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            total: true,
          }
        }
      },
    });
    const usersWithStats = users.map((user: any) => {
      const orders = user.orders || [];
      const totalSpent = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      return {
        ...user,
        orders: orders.length,
        totalSpent,
      };
    });
    res.json(usersWithStats);
  },

  updateUser: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  },

  deleteUser: async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'Usuário excluído com sucesso' });
  },

  // Criar venda do PDV físico
  createPDVSale: async (req: Request, res: Response) => {
    const { items, paymentMethodId } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Nenhum item informado.' });
    }
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Meio de pagamento obrigatório.' });
    }
    // Verifica se o método de pagamento existe
    const paymentMethod = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Meio de pagamento inválido.' });
    }
    // Pega o id do admin logado
    // @ts-ignore
    const userId = req.user.id;
    console.log('Itens recebidos na venda:', items);
    const validItems = items.filter(item => !!item.productId || !!item.doseId);
    // Buscar todos os produtos válidos do banco
    const allProducts = await prisma.product.findMany({
      where: { id: { in: validItems.map(i => i.productId) } },
      select: { id: true }
    });
    const validProductIds = new Set(allProducts.map((p: any) => p.id));
    const reallyValidItems = validItems.filter(item => validProductIds.has(item.productId));
    console.log('Itens realmente válidos para venda:', reallyValidItems);
    // Verificar estoque antes de criar a venda
    for (const item of reallyValidItems) {
      if (item.comboId) {
        const combo = await prisma.combo.findUnique({
          where: { id: item.comboId },
          include: { items: true }
        });
        if (combo) {
          for (const comboItem of combo.items) {
            const produto = await prisma.product.findUnique({ where: { id: comboItem.productId } });
            const quantidadeFinal = (produto?.stock || 0) - (comboItem.quantity * item.quantity);
            if (quantidadeFinal < 0) {
              return res.status(400).json({ error: `Estoque insuficiente para o produto do combo: ${produto?.name}. Disponível: ${produto?.stock}, solicitado: ${comboItem.quantity * item.quantity}` });
            }
          }
        }
      } else if (item.productId) {
        const produto = await prisma.product.findUnique({ where: { id: item.productId } });
        const quantidadeFinal = (produto?.stock || 0) - item.quantity;
        if (quantidadeFinal < 0) {
          return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto?.name}. Disponível: ${produto?.stock}, solicitado: ${item.quantity}` });
        }
      }
    }
    // Cria a venda
    const sale = await prisma.sale.create({
      data: {
        userId,
        total: reallyValidItems.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0),
        paymentMethodId,
        items: {
          create: reallyValidItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      } as any,
      include: {
        items: true
      }
    });
    // Subtrai o estoque dos produtos e combos
    for (const item of reallyValidItems) {
      if (item.comboId) {
        const combo = await prisma.combo.findUnique({
          where: { id: item.comboId },
          include: { items: true }
        });
        if (combo) {
          for (const comboItem of combo.items) {
            const produto = await prisma.product.findUnique({ where: { id: comboItem.productId } });
            const quantidadeFinal = (produto?.stock || 0) - (comboItem.quantity * item.quantity);
            if (quantidadeFinal < 0) {
              return res.status(400).json({ error: `Estoque insuficiente para o produto do combo: ${produto?.name}` });
            }
          }
          for (const comboItem of combo.items) {
            await prisma.product.update({
              where: { id: comboItem.productId },
              data: { stock: { decrement: comboItem.quantity * item.quantity } }
            });
          }
        }
      } else if (item.productId) {
        const produto = await prisma.product.findUnique({ where: { id: item.productId } });
        const quantidadeFinal = (produto?.stock || 0) - item.quantity;
        if (quantidadeFinal < 0) {
          return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto?.name}` });
        }
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
    }
    for (const item of reallyValidItems) {
      if (item.doseId) {
        console.log('Processando desconto de estoque para dose:', item.doseId);
        // Buscar a composição da dose
        const dose = await prisma.dose.findUnique({
          where: { id: item.doseId },
          include: { items: true }
        });
        if (!dose) {
          console.error('Dose não encontrada:', item.doseId);
          return res.status(400).json({ error: 'Dose não encontrada.' });
        }
        console.log('Composição da dose:', dose.items);
        // Se houver seleções de escolhíveis, elas vêm em item.choosableSelections
        const choosableSelections = item.choosableSelections || {};
        for (const doseItem of dose.items) {
          if (doseItem.allowFlavorSelection && doseItem.categoryId) {
            const selections = choosableSelections[doseItem.categoryId] || {};
            for (const [productId, qty] of Object.entries(selections)) {
              const quantidadeFinal = Number(qty) * item.quantity;
              const produto = await prisma.product.findUnique({ where: { id: productId } });
              if (!produto) {
                console.error('Produto escolhido não encontrado:', productId);
                return res.status(400).json({ error: `Produto escolhido não encontrado: ${productId}` });
              }
              console.log(`Descontando produto escolhido (${produto.name}): antes=${produto.isFractioned ? produto.totalVolume : produto.stock}`);
              if (produto.isFractioned) {
                const novoVolume = (produto.totalVolume || 0) - (doseItem.quantity * quantidadeFinal);
                if (novoVolume < 0) {
                  console.error('Estoque insuficiente (volume) para o produto:', produto.name);
                  return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
                }
                await prisma.product.update({
                  where: { id: productId },
                  data: { totalVolume: novoVolume }
                });
                console.log(`Novo volume de ${produto.name}: ${novoVolume}`);
              } else {
                const novoEstoque = (produto.stock || 0) - quantidadeFinal;
                if (novoEstoque < 0) {
                  console.error('Estoque insuficiente para o produto:', produto.name);
                  return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
                }
                await prisma.product.update({
                  where: { id: productId },
                  data: { stock: novoEstoque }
                });
                console.log(`Novo estoque de ${produto.name}: ${novoEstoque}`);
              }
            }
          } else {
            const produto = await prisma.product.findUnique({ where: { id: doseItem.productId } });
            if (!produto) {
              console.error('Produto da dose não encontrado:', doseItem.productId);
              return res.status(400).json({ error: `Produto da dose não encontrado: ${doseItem.productId}` });
            }
            if (doseItem.discountBy === 'volume') {
              const novoVolume = (produto.totalVolume || 0) - (doseItem.quantity * item.quantity);
              if (novoVolume < 0) {
                console.error('Estoque insuficiente (volume) para o produto:', produto.name);
                return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
              }
              await prisma.product.update({
                where: { id: doseItem.productId },
                data: { totalVolume: novoVolume }
              });
              console.log(`Novo volume de ${produto.name}: ${novoVolume}`);
            } else {
              const novoEstoque = (produto.stock || 0) - (doseItem.quantity * item.quantity);
              if (novoEstoque < 0) {
                console.error('Estoque insuficiente para o produto:', produto.name);
                return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
              }
              await prisma.product.update({
                where: { id: doseItem.productId },
                data: { stock: novoEstoque }
              });
              console.log(`Novo estoque de ${produto.name}: ${novoEstoque}`);
            }
          }
        }
      }
    }
    res.status(201).json(sale);
  },

  // Listar vendas do PDV físico
  getPDVSales: async (req: Request, res: Response) => {
    const sales = await prisma.sale.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sales);
  },
}; 