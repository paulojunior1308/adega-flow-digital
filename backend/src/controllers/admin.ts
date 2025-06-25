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
    const validItems = items.filter(item => !!item.productId);
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
      const produto = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!produto) continue;

      if (produto.isFractioned) {
        if (item.isDoseItem) {
          // Item de dose fracionado
          if (item.discountBy === 'volume') {
            // Desconta apenas o volume
            const novoVolume = (produto.totalVolume || 0) - item.quantity;
            if (novoVolume < 0) {
              return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
            }
          } else {
            // Desconta unidade
            const novoEstoque = (produto.stock || 0) - item.quantity;
            if (novoEstoque < 0) {
              return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
            }
          }
        } else {
          // Produto fracionado normal
          if (item.sellingByVolume) {
            // Venda fracionada (por volume): desconta só do volume e recalcula o estoque
            const unitVolume = produto.unitVolume || 1;
            const volumeNecessario = item.quantity;
            const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
            const novoStock = Math.floor(novoTotalVolume / unitVolume);
            if (novoTotalVolume < 0) {
              return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
            }
          } else {
            // Venda por unidade: desconta unidade e volume
            const unitVolume = produto.unitVolume || 1;
            const volumeNecessario = item.quantity * unitVolume;
            const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
            const novoStock = Math.floor(novoTotalVolume / unitVolume);
            if (novoTotalVolume < 0) {
              return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
            }
          }
        }
      } else {
        // Produto não fracionado
        const novoEstoque = (produto.stock || 0) - item.quantity;
        if (novoEstoque < 0) {
          return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
        }
      }
    }

    // Cria a venda
    const sale = await prisma.sale.create({
      data: {
        userId,
        total: reallyValidItems.reduce((sum: number, item: any) => {
          // Se for item de dose, usa o preço da dose
          if (item.isDoseItem) {
            return sum + (item.price * item.quantity);
          }
          // Se não for dose, usa o preço normal
          return sum + (item.price * item.quantity);
        }, 0),
        paymentMethodId,
        status: 'COMPLETED',
        items: {
          create: await Promise.all(reallyValidItems.map(async (item: any) => {
            const produto = await prisma.product.findUnique({ where: { id: item.productId } });
            
            // Determina a quantidade a ser registrada
            let quantityToRecord = item.quantity;
            
            // Se for produto fracionado e não for dose, registra o volume total da garrafa
            if (produto?.isFractioned && !item.isDoseItem) {
              quantityToRecord = produto.unitVolume || 1000; // Volume total da garrafa
            }
            
            return {
              productId: item.productId,
              quantity: quantityToRecord,
              price: item.price,
              costPrice: produto?.costPrice || 0,
              isDoseItem: item.isDoseItem || false,
              isFractioned: item.isFractioned || false,
              discountBy: item.discountBy,
              choosableSelections: item.choosableSelections
            };
          }))
        }
      },
      include: {
        items: true
      }
    });

    // Atualiza o estoque
    for (const item of reallyValidItems) {
      const produto = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!produto) continue;

      console.log(`\n=== ATUALIZANDO ESTOQUE ===`);
      console.log(`Produto: ${produto.name}`);
      console.log(`ID: ${produto.id}`);
      console.log(`É fracionado: ${produto.isFractioned}`);
      console.log(`É dose: ${item.isDoseItem}`);
      console.log(`Quantidade original: ${item.quantity}`);
      console.log(`Estoque atual: ${produto.stock}`);
      console.log(`Volume total atual: ${produto.totalVolume}`);
      console.log(`Volume unitário: ${produto.unitVolume}`);

      if (produto.isFractioned) {
        if (item.isDoseItem) {
          console.log(`-> Processando como ITEM DE DOSE`);
          // Item de dose fracionado
          if (item.discountBy === 'volume') {
            // Desconta apenas o volume
            const novoVolume = (produto.totalVolume || 0) - item.quantity;
            const unitVolume = produto.unitVolume || 1;
            const novoStock = Math.floor(novoVolume / unitVolume);
            console.log(`-> Descontando volume: ${item.quantity}ml`);
            console.log(`-> Novo volume total: ${novoVolume}ml`);
            console.log(`-> Novo estoque: ${novoStock} unidades`);
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                totalVolume: novoVolume,
                stock: novoStock
              }
            });
          } else {
            // Desconta unidade
            console.log(`-> Descontando unidades: ${item.quantity}`);
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            });
          }
        } else {
          console.log(`-> Processando como PRODUTO FRACIONADO NORMAL`);
          // Produto fracionado normal
          if (item.sellingByVolume) {
            // Venda fracionada (por volume): desconta só do volume e recalcula o estoque
            const unitVolume = produto.unitVolume || 1;
            const volumeNecessario = item.quantity;
            const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
            const novoStock = Math.floor(novoTotalVolume / unitVolume);
            console.log(`-> Venda por volume: ${volumeNecessario}ml`);
            console.log(`-> Novo volume total: ${novoTotalVolume}ml`);
            console.log(`-> Novo estoque: ${novoStock} unidades`);
            if (novoTotalVolume < 0) {
              return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
            }
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                totalVolume: novoTotalVolume,
                stock: novoStock
              }
            });
          } else {
            // Venda por unidade: desconta unidade e volume
            const unitVolume = produto.unitVolume || 1;
            const volumeNecessario = item.quantity * unitVolume;
            const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
            const novoStock = Math.floor(novoTotalVolume / unitVolume);
            console.log(`-> Venda por unidade: ${item.quantity} unidades`);
            console.log(`-> Volume necessário: ${volumeNecessario}ml`);
            console.log(`-> Novo volume total: ${novoTotalVolume}ml`);
            console.log(`-> Novo estoque: ${novoStock} unidades`);
            if (novoTotalVolume < 0) {
              return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
            }
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                totalVolume: novoTotalVolume,
                stock: novoStock
              }
            });
          }
        }
      } else {
        console.log(`-> Processando como PRODUTO NÃO FRACIONADO`);
        // Produto não fracionado
        const novoEstoque = (produto.stock || 0) - item.quantity;
        console.log(`-> Descontando: ${item.quantity} unidades`);
        console.log(`-> Novo estoque: ${novoEstoque} unidades`);
        if (novoEstoque < 0) {
          return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
        }
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
      console.log(`=== ESTOQUE ATUALIZADO ===\n`);
    }

    // Registrar saída de estoque em StockMovement
    for (const item of reallyValidItems) {
      const produto = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!produto) continue;
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'out',
          quantity: item.quantity,
          unitCost: produto.costPrice,
          totalCost: (produto.costPrice || 0) * item.quantity,
          notes: 'Venda PDV',
          origin: 'venda_pdv'
        }
      });
    }

    console.log('[PDV][LOG] Finalizando venda. Payload recebido:', JSON.stringify(items, null, 2));
    res.status(201).json(sale);
  },

  // Listar vendas do PDV físico
  getPDVSales: async (req: Request, res: Response) => {
    const sales = await prisma.sale.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (sales.length > 0) {
      console.log('Primeira venda retornada pelo Prisma:');
      console.log(JSON.stringify(sales[0], null, 2));
    } else {
      console.log('Nenhuma venda encontrada.');
    }
    res.json(sales);
  },
}; 