import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { generateToken } from '../config/jwt';
import { comparePassword, hashPassword } from '../config/bcrypt';
import { AppError } from '../config/errorHandler';

// Função utilitária para subtrair estoque corretamente
async function subtrairEstoqueProduto(produto: any, quantidade: number, tipoVenda: 'ml' | 'unidade' = 'unidade') {
  if (produto.unit === 'ml' && produto.quantityPerUnit) {
    if (tipoVenda === 'ml') {
      // Venda por dose: quantidade em ml
      const estoqueTotalMl = Number(produto.stock) * produto.quantityPerUnit;
      if (estoqueTotalMl < quantidade) {
        throw new Error(`Estoque insuficiente para o produto: ${produto.name}. Disponível: ${estoqueTotalMl} ml, solicitado: ${quantidade} ml`);
      }
      const fracao = quantidade / produto.quantityPerUnit;
      const novoEstoque = Math.round((Number(produto.stock) - fracao) * 10000) / 10000;
      await prisma.product.update({
        where: { id: produto.id },
        data: { stock: novoEstoque }
      });
    } else {
      // Venda por unidade: quantidade em unidades inteiras
      if (Number(produto.stock) < quantidade) {
        throw new Error(`Estoque insuficiente para o produto: ${produto.name}. Disponível: ${produto.stock} un, solicitado: ${quantidade} un`);
      }
      const novoEstoque = Number(produto.stock) - quantidade;
      await prisma.product.update({
        where: { id: produto.id },
        data: { stock: novoEstoque }
      });
    }
  } else {
    // Produto normal (unidade)
    if (Number(produto.stock) < quantidade) {
      throw new Error(`Estoque insuficiente para o produto: ${produto.name}. Disponível: ${produto.stock}, solicitado: ${quantidade}`);
    }
    const novoEstoque = Number(produto.stock) - quantidade;
    await prisma.product.update({
      where: { id: produto.id },
      data: { stock: novoEstoque }
    });
  }
}

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
    const validItems = items.filter(item => !!item.productId || !!item.comboId);
    // Buscar todos os produtos válidos do banco
    const allProducts = await prisma.product.findMany({
      where: { id: { in: validItems.filter(i => i.productId).map(i => i.productId) } },
      select: { id: true }
    });
    const validProductIds = new Set(allProducts.map((p: any) => p.id));
    const reallyValidItems = validItems.filter(item => !item.productId || validProductIds.has(item.productId));
    // LOG: Itens recebidos na venda
    console.log('PDV - Itens recebidos:', JSON.stringify(items, null, 2));
    // Verificar estoque antes de criar a venda
    for (const item of reallyValidItems) {
      if (item.comboId) {
        const combo = await prisma.combo.findUnique({
          where: { id: item.comboId },
          include: { items: { include: { product: true } } }
        });
        if (!combo) {
          return res.status(400).json({ error: 'Combo não encontrado.' });
        }
        // LOG: Combo recuperado do banco
        console.log('PDV - Combo recuperado:', JSON.stringify(combo, null, 2));
        if (combo.type === 'dose') {
          // Dose: pode mexer com unidade e ml
          for (const comboItem of combo.items) {
            const produto = comboItem.product;
            const quantidadeParaSubtrair = (comboItem.amount || comboItem.quantity) * item.quantity;
            const tipoVenda = produto.unit === 'ml' ? 'ml' : 'unidade';
            try {
              await subtrairEstoqueProduto(produto, quantidadeParaSubtrair, tipoVenda);
            } catch (err) {
              return res.status(400).json({ error: (err as Error).message });
            }
          }
        } else if (combo.type === 'combo') {
          // Combo: sempre mexe com unidade
          for (const comboItem of combo.items) {
            const produto = comboItem.product;
            try {
              await subtrairEstoqueProduto(produto, comboItem.quantity * item.quantity, 'unidade');
            } catch (err) {
              return res.status(400).json({ error: (err as Error).message });
            }
          }
        }
      } else if (item.productId) {
        const produto = await prisma.product.findUnique({ where: { id: item.productId } });
        const tipoVenda = produto && produto.unit === 'ml' ? 'ml' : 'unidade';
        let quantidadeFinal = item.quantity;
        if (tipoVenda === 'ml' && produto && produto.quantityPerUnit) {
          quantidadeFinal = item.quantity / produto.quantityPerUnit;
        }
        try {
          await subtrairEstoqueProduto(produto, quantidadeFinal, tipoVenda);
        } catch (err) {
          return res.status(400).json({ error: (err as Error).message });
        }
      }
    }
    // Cria a venda
    const saleItems = [];
    for (const item of items) {
      if (item.comboId) {
        const combo = await prisma.combo.findUnique({
          where: { id: item.comboId },
          include: { items: { include: { product: true } } }
        });
        if (!combo) continue;
        if (combo.type === 'dose') {
          for (const comboItem of combo.items) {
            const produto = comboItem.product;
            let quantidade = comboItem.quantity * item.quantity;
            if (produto.unit === 'ml' && produto.quantityPerUnit) {
              const quantidadeOriginal = quantidade;
              quantidade = quantidade / produto.quantityPerUnit;
              console.log(`[BACKEND][COMBO][${produto.name}] Dose recebida: ${quantidadeOriginal}ml, convertido para fração: ${quantidade}`);
            }
            saleItems.push({
              productId: produto.id,
              quantity: quantidade,
              price: 0 // pode ajustar se quiser dividir o valor
            });
          }
        } else if (combo.type === 'combo') {
          for (const comboItem of combo.items) {
            const produto = comboItem.product;
            let quantidade = comboItem.quantity * item.quantity;
            saleItems.push({
              productId: produto.id,
              quantity: quantidade,
              price: 0 // pode ajustar se quiser dividir o valor
            });
          }
        }
      } else if (item.productId) {
        const produto = await prisma.product.findUnique({ where: { id: item.productId } });
        let quantidadeFinal = item.quantity;
        if (produto && produto.unit === 'ml' && produto.quantityPerUnit) {
          const quantidadeOriginal = quantidadeFinal;
          quantidadeFinal = item.quantity / produto.quantityPerUnit;
          console.log(`[BACKEND][${produto.name}] Dose recebida: ${quantidadeOriginal}ml, convertido para fração: ${quantidadeFinal}`);
        } else {
          console.log(`[BACKEND][${produto?.name}] Venda por unidade: ${quantidadeFinal} un`);
        }
        saleItems.push({
          productId: item.productId,
          quantity: quantidadeFinal,
          price: item.price
        });
      }
    }
    const totalVenda = saleItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const sale = await prisma.sale.create({
      data: {
        userId,
        total: totalVenda,
        paymentMethodId,
        items: {
          create: saleItems
        }
      } as any,
      include: {
        items: true
      }
    });
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