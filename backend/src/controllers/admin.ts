import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { generateToken } from '../config/jwt';
import { comparePassword, hashPassword } from '../config/bcrypt';
import { AppError } from '../config/errorHandler';
import { updateProductStockStatusWithValues } from '../utils/stockStatus';

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
    try {
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
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
      res.status(500).json({ error: 'Erro ao buscar estoque' });
    }
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
    console.log('=== DEBUG: Início da função createPDVSale ===');
    const { items, paymentMethodId } = req.body;
    console.log('=== DEBUG: Request body ===');
    console.log('items:', items);
    console.log('paymentMethodId:', paymentMethodId);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('=== DEBUG: Erro - Nenhum item informado ===');
      return res.status(400).json({ error: 'Nenhum item informado.' });
    }
    if (!paymentMethodId) {
      console.log('=== DEBUG: Erro - Meio de pagamento obrigatório ===');
      return res.status(400).json({ error: 'Meio de pagamento obrigatório.' });
    }
    // Verifica se o método de pagamento existe
    const paymentMethod = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!paymentMethod) {
      console.log('=== DEBUG: Erro - Meio de pagamento inválido ===');
      return res.status(400).json({ error: 'Meio de pagamento inválido.' });
    }
    // Pega o id do admin logado
    // @ts-ignore
    const userId = req.user.id;
    console.log('=== DEBUG: userId ===', userId);
    console.log('Itens recebidos na venda:', items);
    
    // Agora todos os itens já vêm desmembrados do frontend (combos, doses, ofertas)
    const processedItems: any[] = items.filter(item => !!item.productId);
    
    // Buscar todos os produtos válidos do banco
    const allProducts = await prisma.product.findMany({
      where: { id: { in: processedItems.map(i => i.productId) } },
      select: { id: true }
    });
    const validProductIds = new Set(allProducts.map((p: any) => p.id));
    const reallyValidItems = processedItems.filter(item => validProductIds.has(item.productId));
    console.log('Itens realmente válidos para venda (incluindo produtos de ofertas):', reallyValidItems);

    // Verificar estoque antes de criar a venda
    console.log('=== DEBUG: Iniciando verificação de estoque ===');
    for (const item of reallyValidItems) {
      console.log(`=== DEBUG: Verificando estoque do item ${item.productId} ===`);
      const produto = await prisma.product.findUnique({ where: { id: item.productId } });
      console.log('Produto encontrado:', produto);
      if (!produto) {
        console.log(`=== DEBUG: Produto não encontrado: ${item.productId} ===`);
        continue;
      }

      if (produto.isFractioned) {
        console.log('=== DEBUG: Produto é fracionado ===');
        if (item.isDoseItem) {
          // Item de dose fracionado
          console.log('=== DEBUG: Item é de dose ===');
          if (item.discountBy === 'volume') {
            // Desconta apenas o volume
            const novoVolume = (produto.totalVolume || 0) - item.quantity;
            console.log(`=== DEBUG: Novo volume seria: ${novoVolume} ===`);
            if (novoVolume < 0) {
              console.log(`=== DEBUG: Erro - Estoque insuficiente (volume) para: ${produto.name} ===`);
              return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
            }
          } else {
            // Desconta unidade
            const novoEstoque = (produto.stock || 0) - item.quantity;
            console.log(`=== DEBUG: Novo estoque seria: ${novoEstoque} ===`);
            if (novoEstoque < 0) {
              console.log(`=== DEBUG: Erro - Estoque insuficiente para: ${produto.name} ===`);
              return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
            }
          }
        } else {
          // Produto fracionado normal
          console.log('=== DEBUG: Produto fracionado normal ===');
          if (item.sellingByVolume) {
            // Venda fracionada (por volume): desconta só do volume e recalcula o estoque
            const unitVolume = produto.unitVolume || 1;
            const volumeNecessario = item.quantity;
            const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
            const novoStock = Math.floor(novoTotalVolume / unitVolume);
            console.log(`=== DEBUG: Novo volume seria: ${novoTotalVolume}, novo stock: ${novoStock} ===`);
            if (novoTotalVolume < 0) {
              console.log(`=== DEBUG: Erro - Estoque insuficiente (volume) para: ${produto.name} ===`);
              return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
            }
          } else {
            // Venda por unidade: desconta unidade e volume
            const unitVolume = produto.unitVolume || 1;
            const volumeNecessario = item.quantity * unitVolume;
            const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
            const novoStock = Math.floor(novoTotalVolume / unitVolume);
            console.log(`=== DEBUG: Novo volume seria: ${novoTotalVolume}, novo stock: ${novoStock} ===`);
            if (novoTotalVolume < 0) {
              console.log(`=== DEBUG: Erro - Estoque insuficiente (volume) para: ${produto.name} ===`);
              return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
            }
          }
        }
      } else {
        // Produto não fracionado
        console.log('=== DEBUG: Produto não fracionado ===');
        const novoEstoque = (produto.stock || 0) - item.quantity;
        console.log(`=== DEBUG: Novo estoque seria: ${novoEstoque} ===`);
        if (novoEstoque < 0) {
          console.log(`=== DEBUG: Erro - Estoque insuficiente para: ${produto.name} ===`);
          return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
        }
      }
    }
    console.log('=== DEBUG: Verificação de estoque concluída com sucesso ===');

    // Calcular total da venda considerando todos os itens
    let totalVenda = 0;
    for (const item of reallyValidItems) {
      if (item.price && item.quantity) {
        totalVenda += item.price * item.quantity;
      }
    }

    // LOG dos itens realmente válidos
    console.log('=== DEBUG PDV ===');
    console.log('Itens realmente válidos para venda:', JSON.stringify(reallyValidItems, null, 2));
    for (const item of reallyValidItems) {
      const produto = await prisma.product.findUnique({ where: { id: item.productId } });
      console.log(`Produto encontrado para item:`, item.productId, produto);
    }

    // LOG antes de criar a venda
    console.log('=== DEBUG: Itens prontos para criar venda ===');
    console.log(JSON.stringify(reallyValidItems, null, 2));
    console.log('=== DEBUG: Dados da venda ===');
    console.log({ userId, totalVenda, paymentMethodId });

    // Buscar sessão ativa do PDV
    const activeSession = await prisma.pDVSession.findFirst({
      where: { isActive: true },
      orderBy: { openedAt: 'desc' }
    });

    // Cria a venda
    let sale;
    try {
      sale = await prisma.sale.create({
        data: {
          userId,
          total: totalVenda,
          paymentMethodId,
          status: 'COMPLETED',
          pdvSessionId: activeSession ? activeSession.id : null,
          items: {
            create: await Promise.all(reallyValidItems.map(async (item: any) => {
              const produto = await prisma.product.findUnique({ where: { id: item.productId } });
              if (!produto) {
                throw new Error(`Produto não encontrado: ${item.productId}`);
              }
              let quantityToRecord = item.quantity;
              if (produto.isFractioned && !item.isDoseItem) {
                quantityToRecord = produto.unitVolume || 1000;
              }
              return {
                productId: item.productId,
                quantity: quantityToRecord,
                price: item.price,
                costPrice: produto.costPrice ? Number(produto.costPrice) : 0,
                discount: item.discount || 0,
                isDoseItem: item.isDoseItem || false,
                isFractioned: item.isFractioned || false,
                discountBy: item.discountBy || null,
                choosableSelections: item.choosableSelections || null,
                comboInstanceId: item.comboInstanceId || null,
                doseInstanceId: item.doseInstanceId || null,
                offerInstanceId: (typeof item.offerInstanceId === 'string' && item.offerInstanceId.length === 36 && item.offerId) ? item.offerId : null,
                doseId: item.doseId || null,
                createdAt: new Date()
              };
            }))
          }
        },
        include: {
          items: true
        }
      });
    } catch (error: any) {
      console.error('=== ERRO AO CRIAR VENDA ===');
      console.error('Erro ao criar venda:', error);
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      console.error('Payload que causou o erro:', JSON.stringify(reallyValidItems, null, 2));
      return res.status(400).json({ error: `Erro ao criar venda: ${error.message || 'Erro desconhecido'}` });
    }

    // LOG antes de atualizar o estoque
    console.log('=== DEBUG: Atualizando estoque dos itens ===');
    console.log(JSON.stringify(reallyValidItems, null, 2));

    // Atualiza o estoque
    for (const item of reallyValidItems) {
      const produto = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!produto) continue;
      if (produto.isFractioned) {
        if (item.isDoseItem) {
          if (item.discountBy === 'volume') {
            const novoVolume = (produto.totalVolume || 0) - item.quantity;
            const unitVolume = produto.unitVolume || 1;
            const novoStock = Math.floor(novoVolume / unitVolume);
            const updatedProduct = await prisma.product.update({
              where: { id: item.productId },
              data: {
                totalVolume: novoVolume,
                stock: novoStock
              },
              select: { stock: true, isFractioned: true, totalVolume: true }
            });
            await updateProductStockStatusWithValues(item.productId, prisma, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
          } else {
            const updatedProduct = await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
              select: { stock: true, isFractioned: true, totalVolume: true }
            });
            await updateProductStockStatusWithValues(item.productId, prisma, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
          }
        } else {
          if (item.sellingByVolume) {
            const unitVolume = produto.unitVolume || 1;
            const volumeNecessario = item.quantity;
            const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
            const novoStock = Math.floor(novoTotalVolume / unitVolume);
            const updatedProduct = await prisma.product.update({
              where: { id: item.productId },
              data: {
                totalVolume: novoTotalVolume,
                stock: novoStock
              },
              select: { stock: true, isFractioned: true, totalVolume: true }
            });
            await updateProductStockStatusWithValues(item.productId, prisma, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
          } else {
            const unitVolume = produto.unitVolume || 1;
            const volumeNecessario = item.quantity * unitVolume;
            const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
            const novoStock = Math.floor(novoTotalVolume / unitVolume);
            const updatedProduct = await prisma.product.update({
              where: { id: item.productId },
              data: {
                totalVolume: novoTotalVolume,
                stock: novoStock
              },
              select: { stock: true, isFractioned: true, totalVolume: true }
            });
            await updateProductStockStatusWithValues(item.productId, prisma, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
          }
        }
      } else {
        const updatedProduct = await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
          select: { stock: true, isFractioned: true, totalVolume: true }
        });
        await updateProductStockStatusWithValues(item.productId, prisma, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
      }
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
          unitCost: produto.costPrice ? Number(produto.costPrice) : 0,
          totalCost: (produto.costPrice ? Number(produto.costPrice) : 0) * item.quantity,
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
    try {
      const sales = await prisma.sale.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { 
            include: { 
              product: true 
            } 
          },
          paymentMethod: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      // Filtrar itens com produtos nulos para evitar erros
      const safeSales = sales.map(sale => ({
        ...sale,
        items: sale.items.filter(item => item.product !== null)
      }));
      
      if (safeSales.length > 0) {
        console.log('Primeira venda retornada pelo Prisma:');
        console.log(JSON.stringify(safeSales[0], null, 2));
      } else {
        console.log('Nenhuma venda encontrada.');
      }
      res.json(safeSales);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      res.status(500).json({ error: 'Erro ao buscar vendas' });
    }
  },

  // Atualizar método de pagamento da venda PDV
  updatePDVSale: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentMethodId } = req.body;
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Meio de pagamento obrigatório.' });
    }
    // Verifica se o método de pagamento existe
    const paymentMethod = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Meio de pagamento inválido.' });
    }
    try {
      const sale = await prisma.sale.update({
        where: { id },
        data: { paymentMethodId },
        include: { paymentMethod: true }
      });
      res.json(sale);
    } catch (error: any) {
      console.error('Erro ao atualizar método de pagamento da venda:', error);
      res.status(400).json({ error: 'Erro ao atualizar método de pagamento da venda.' });
    }
  },

  // Retorna totais de custo e venda do estoque
  getEstoqueTotals: async (req: Request, res: Response) => {
    try {
      const produtos = await prisma.product.findMany({
        select: {
          stock: true,
          costPrice: true,
          price: true
        }
      });
      let totalCusto = 0;
      let totalVenda = 0;
      for (const p of produtos) {
        const estoque = p.stock || 0;
        const custo = p.costPrice ? Number(p.costPrice) : 0;
        const venda = p.price ? Number(p.price) : 0;
        totalCusto += estoque * custo;
        totalVenda += estoque * venda;
      }
      res.json({ totalCusto, totalVenda });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao calcular totais do estoque.' });
    }
  },

  // Retorna todas as vendas do dia (PDV e online, status concluída)
  getVendasHoje: async (req: Request, res: Response) => {
    try {
      // Buscar sessão ativa do PDV
      const activeSession = await prisma.pDVSession.findFirst({
        where: { isActive: true },
        orderBy: { openedAt: 'desc' }
      });

      let startDate: Date;
      let endDate: Date;
      let pDVSessionId: string | undefined = undefined;

      if (activeSession) {
        // Se há sessão ativa, usar período da sessão
        startDate = activeSession.openedAt;
        endDate = new Date(); // Até agora
        pDVSessionId = activeSession.id;
      } else {
        // Se não há sessão ativa, usar dia atual (comportamento anterior)
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        startDate = hoje;
        endDate = amanha;
      }

      // Vendas PDV
      const vendasPDV = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate
          },
          status: 'COMPLETED',
          ...(pDVSessionId ? { pdvSessionId: pDVSessionId } : {})
        },
        select: {
          id: true,
          total: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
          paymentMethod: { select: { id: true, name: true } }
        }
      });
      // Pedidos online
      const vendasOnline = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate
          },
          status: 'DELIVERED'
        },
        select: {
          id: true,
          total: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
          paymentMethod: true
        }
      });
      res.json({ pdv: vendasPDV, online: vendasOnline, activeSession });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar vendas do dia.' });
    }
  },

  // Abrir sessão do PDV
  openPDVSession: async (req: Request, res: Response) => {
    try {
      const { initialCash, notes } = req.body;
      // @ts-ignore
      const userId = req.user.id;

      // Verificar se já existe uma sessão ativa
      const existingSession = await prisma.pDVSession.findFirst({
        where: { isActive: true }
      });

      if (existingSession) {
        return res.status(400).json({ error: 'Já existe uma sessão do PDV aberta.' });
      }

      const session = await prisma.pDVSession.create({
        data: {
          openedBy: userId,
          initialCash: initialCash || 0,
          notes: notes || null
        },
        include: {
          user: { select: { id: true, name: true } }
        }
      });

      res.status(201).json(session);
    } catch (error) {
      console.error('Erro ao abrir sessão do PDV:', error);
      res.status(500).json({ error: 'Erro ao abrir sessão do PDV.' });
    }
  },

  // Fechar sessão do PDV
  closePDVSession: async (req: Request, res: Response) => {
    try {
      const { finalCash, notes } = req.body;
      // @ts-ignore
      const userId = req.user.id;

      // Buscar sessão ativa
      const activeSession = await prisma.pDVSession.findFirst({
        where: { isActive: true }
      });

      if (!activeSession) {
        return res.status(400).json({ error: 'Não há sessão do PDV aberta.' });
      }

      // Calcular total de vendas da sessão
      const sessionSales = await prisma.sale.findMany({
        where: {
          pdvSessionId: activeSession.id,
          status: 'COMPLETED'
        },
        select: { total: true }
      });

      const totalSales = sessionSales.reduce((sum, sale) => sum + sale.total, 0);

      // Fechar sessão
      const closedSession = await prisma.pDVSession.update({
        where: { id: activeSession.id },
        data: {
          closedAt: new Date(),
          closedBy: userId,
          finalCash: finalCash || 0,
          totalSales: totalSales,
          isActive: false,
          notes: notes || activeSession.notes
        },
        include: {
          user: { select: { id: true, name: true } },
          closedByUser: { select: { id: true, name: true } }
        }
      });

      res.json(closedSession);
    } catch (error) {
      console.error('Erro ao fechar sessão do PDV:', error);
      res.status(500).json({ error: 'Erro ao fechar sessão do PDV.' });
    }
  },

  // Obter sessão ativa do PDV
  getActivePDVSession: async (req: Request, res: Response) => {
    try {
      const activeSession = await prisma.pDVSession.findFirst({
        where: { isActive: true },
        include: {
          user: { select: { id: true, name: true } }
        },
        orderBy: { openedAt: 'desc' }
      });

      res.json(activeSession);
    } catch (error) {
      console.error('Erro ao buscar sessão ativa:', error);
      res.status(500).json({ error: 'Erro ao buscar sessão ativa.' });
    }
  },

  // Cancelar venda e restaurar estoque
  cancelSale: async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      // Buscar a venda com todos os itens
      const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!sale) {
        return res.status(404).json({ error: 'Venda não encontrada.' });
      }

      if (sale.status === 'CANCELLED') {
        return res.status(400).json({ error: 'Venda já foi cancelada.' });
      }

      // Iniciar transação para garantir consistência
      const result = await prisma.$transaction(async (tx) => {
        // Restaurar estoque para cada item da venda
        for (const item of sale.items) {
          const produto = item.product;
          if (!produto) continue;

          if (produto.isFractioned) {
            // Produto fracionado: restaurar volume
            const unitVolume = produto.unitVolume || 1;
            const volumeToRestore = item.quantity;
            const novoTotalVolume = (produto.totalVolume || 0) + volumeToRestore;
            const novoStock = Math.floor(novoTotalVolume / unitVolume);

            await tx.product.update({
              where: { id: produto.id },
              data: {
                totalVolume: novoTotalVolume,
                stock: novoStock
              }
            });

            // Registrar movimentação de entrada (restauração)
            await tx.stockMovement.create({
              data: {
                productId: produto.id,
                type: 'in',
                quantity: item.quantity,
                unitCost: produto.costPrice || 0,
                totalCost: (produto.costPrice || 0) * item.quantity,
                notes: `Restauração de estoque - Cancelamento da venda ${sale.id}`,
                origin: 'cancelamento_venda'
              }
            });
          } else {
            // Produto não fracionado: restaurar unidades
            await tx.product.update({
              where: { id: produto.id },
              data: {
                stock: { increment: item.quantity }
              }
            });

            // Registrar movimentação de entrada (restauração)
            await tx.stockMovement.create({
              data: {
                productId: produto.id,
                type: 'in',
                quantity: item.quantity,
                unitCost: produto.costPrice || 0,
                totalCost: (produto.costPrice || 0) * item.quantity,
                notes: `Restauração de estoque - Cancelamento da venda ${sale.id}`,
                origin: 'cancelamento_venda'
              }
            });
          }

          // Atualizar status do estoque
          const updatedProduct = await tx.product.findUnique({
            where: { id: produto.id },
            select: { stock: true, isFractioned: true, totalVolume: true }
          });
          
          if (updatedProduct) {
            await updateProductStockStatusWithValues(
              produto.id, 
              tx, 
              updatedProduct.stock, 
              updatedProduct.isFractioned, 
              updatedProduct.totalVolume
            );
          }
        }

        // Atualizar status da venda para cancelada
        const updatedSale = await tx.sale.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });

        return updatedSale;
      });

      res.json({
        message: 'Venda cancelada com sucesso e estoque restaurado.',
        sale: result
      });

    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      res.status(500).json({ error: 'Erro ao cancelar venda.' });
    }
  },

  // Editar venda (alterar itens)
  editSale: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { items, paymentMethodId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Nenhum item informado.' });
    }

    try {
      // Buscar a venda atual
      const currentSale = await prisma.sale.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!currentSale) {
        return res.status(404).json({ error: 'Venda não encontrada.' });
      }

      if (currentSale.status === 'CANCELLED') {
        return res.status(400).json({ error: 'Não é possível editar uma venda cancelada.' });
      }

      // Processar novos itens
      const processedItems: any[] = items.filter(item => !!item.productId);
      
      // Buscar todos os produtos válidos
      const allProducts = await prisma.product.findMany({
        where: { id: { in: processedItems.map(i => i.productId) } },
        select: { id: true }
      });
      const validProductIds = new Set(allProducts.map((p: any) => p.id));
      const newItems = processedItems.filter(item => validProductIds.has(item.productId));

      // Iniciar transação
      const result = await prisma.$transaction(async (tx) => {
        // 1. Restaurar estoque dos itens atuais
        for (const item of currentSale.items) {
          const produto = item.product;
          if (!produto) continue;

          if (produto.isFractioned) {
            // Produto fracionado: restaurar volume
            const unitVolume = produto.unitVolume || 1;
            const volumeToRestore = item.quantity;
            const novoTotalVolume = (produto.totalVolume || 0) + volumeToRestore;
            const novoStock = Math.floor(novoTotalVolume / unitVolume);

            await tx.product.update({
              where: { id: produto.id },
              data: {
                totalVolume: novoTotalVolume,
                stock: novoStock
              }
            });

            // Registrar movimentação de entrada (restauração)
            await tx.stockMovement.create({
              data: {
                productId: produto.id,
                type: 'in',
                quantity: item.quantity,
                unitCost: produto.costPrice || 0,
                totalCost: (produto.costPrice || 0) * item.quantity,
                notes: `Restauração de estoque - Edição da venda ${currentSale.id}`,
                origin: 'edicao_venda'
              }
            });
          } else {
            // Produto não fracionado: restaurar unidades
            await tx.product.update({
              where: { id: produto.id },
              data: {
                stock: { increment: item.quantity }
              }
            });

            // Registrar movimentação de entrada (restauração)
            await tx.stockMovement.create({
              data: {
                productId: produto.id,
                type: 'in',
                quantity: item.quantity,
                unitCost: produto.costPrice || 0,
                totalCost: (produto.costPrice || 0) * item.quantity,
                notes: `Restauração de estoque - Edição da venda ${currentSale.id}`,
                origin: 'edicao_venda'
              }
            });
          }

          // Atualizar status do estoque
          const updatedProduct = await tx.product.findUnique({
            where: { id: produto.id },
            select: { stock: true, isFractioned: true, totalVolume: true }
          });
          
          if (updatedProduct) {
            await updateProductStockStatusWithValues(
              produto.id, 
              tx, 
              updatedProduct.stock, 
              updatedProduct.isFractioned, 
              updatedProduct.totalVolume
            );
          }
        }

        // 2. Verificar estoque para novos itens
        for (const item of newItems) {
          const produto = await tx.product.findUnique({ where: { id: item.productId } });
          if (!produto) continue;

          if (produto.isFractioned) {
            // Produto fracionado: verificar volume
            const unitVolume = produto.unitVolume || 1;
            const volumeNecessario = item.quantity;
            const volumeDisponivel = produto.totalVolume || 0;
            
            if (volumeDisponivel < volumeNecessario) {
              throw new Error(`Estoque insuficiente para o produto: ${produto.name}`);
            }
          } else {
            // Produto não fracionado: verificar unidades
            const estoqueAtual = produto.stock || 0;
            const novoEstoque = estoqueAtual - item.quantity;
            
            if (novoEstoque < 0) {
              throw new Error(`Estoque insuficiente para o produto: ${produto.name}`);
            }
          }
        }

        // 3. Descontar estoque dos novos itens
        for (const item of newItems) {
          const produto = await tx.product.findUnique({ where: { id: item.productId } });
          if (!produto) continue;

          if (produto.isFractioned) {
            // Produto fracionado: desconta volume
            const unitVolume = produto.unitVolume || 1;
            const volumeToDiscount = item.quantity;
            const novoTotalVolume = (produto.totalVolume || 0) - volumeToDiscount;
            const novoStock = Math.floor(novoTotalVolume / unitVolume);

            await tx.product.update({
              where: { id: produto.id },
              data: {
                totalVolume: novoTotalVolume,
                stock: novoStock
              }
            });

            // Registrar movimentação de saída
            await tx.stockMovement.create({
              data: {
                productId: produto.id,
                type: 'out',
                quantity: item.quantity,
                unitCost: produto.costPrice || 0,
                totalCost: (produto.costPrice || 0) * item.quantity,
                notes: 'Venda PDV (Editada)',
                origin: 'venda_pdv'
              }
            });
          } else {
            // Produto não fracionado: desconta unidades
            await tx.product.update({
              where: { id: produto.id },
              data: { stock: { decrement: item.quantity } }
            });

            // Registrar movimentação de saída
            await tx.stockMovement.create({
              data: {
                productId: produto.id,
                type: 'out',
                quantity: item.quantity,
                unitCost: produto.costPrice || 0,
                totalCost: (produto.costPrice || 0) * item.quantity,
                notes: 'Venda PDV (Editada)',
                origin: 'venda_pdv'
              }
            });
          }

          // Atualizar status do estoque
          const updatedProduct = await tx.product.findUnique({
            where: { id: produto.id },
            select: { stock: true, isFractioned: true, totalVolume: true }
          });
          
          if (updatedProduct) {
            await updateProductStockStatusWithValues(
              produto.id, 
              tx, 
              updatedProduct.stock, 
              updatedProduct.isFractioned, 
              updatedProduct.totalVolume
            );
          }
        }

        // 4. Calcular novo total
        let newTotal = 0;
        for (const item of newItems) {
          const produto = await tx.product.findUnique({ where: { id: item.productId } });
          if (!produto) continue;
          
          if (produto.isFractioned && produto.unitVolume) {
            // Para produtos fracionados, calcular baseado no volume
            // Se o produto custa R$ 25 por 1000ml, então 900ml = (900/1000) * 25 = R$ 22,50
            const volumeRatio = item.quantity / produto.unitVolume;
            const totalPrice = volumeRatio * produto.price;
            newTotal += totalPrice - (item.discount || 0);
          } else {
            // Para produtos por unidade, calcular normalmente
            newTotal += (item.price * item.quantity) - (item.discount || 0);
          }
        }

        // 5. Atualizar venda com novos itens
        const updatedSale = await tx.sale.update({
          where: { id },
          data: {
            total: newTotal,
            paymentMethodId: paymentMethodId || currentSale.paymentMethodId,
            items: {
              deleteMany: {}, // Remove todos os itens atuais
              create: await Promise.all(newItems.map(async (item: any) => {
                const produto = await tx.product.findUnique({ where: { id: item.productId } });
                if (!produto) {
                  throw new Error(`Produto não encontrado: ${item.productId}`);
                }
                let quantityToRecord = item.quantity;
                let priceToRecord = item.price;
                
                if (produto.isFractioned && !item.isDoseItem) {
                  // Para produtos fracionados, usar o preço do produto
                  priceToRecord = produto.price;
                }
                
                return {
                  productId: item.productId,
                  quantity: quantityToRecord,
                  price: priceToRecord,
                  costPrice: produto.costPrice ? Number(produto.costPrice) : 0,
                  discount: item.discount || 0,
                  isDoseItem: item.isDoseItem || false,
                  isFractioned: item.isFractioned || false,
                  discountBy: item.discountBy || null,
                  choosableSelections: item.choosableSelections || null,
                  comboInstanceId: item.comboInstanceId || null,
                  doseInstanceId: item.doseInstanceId || null,
                  offerInstanceId: (typeof item.offerInstanceId === 'string' && item.offerInstanceId.length === 36 && item.offerId) ? item.offerId : null,
                  doseId: item.doseId || null,
                  createdAt: new Date()
                };
              }))
            }
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });

        return updatedSale;
      });

      res.json({
        message: 'Venda editada com sucesso.',
        sale: result
      });

    } catch (error: any) {
      console.error('Erro ao editar venda:', error);
      res.status(500).json({ 
        error: error.message || 'Erro ao editar venda.' 
      });
    }
  },

  // Listar histórico de sessões do PDV
  getPDVSessionsHistory: async (req: Request, res: Response) => {
    try {
      let sessions = await prisma.pDVSession.findMany({
        include: {
          user: { select: { id: true, name: true } },
          closedByUser: { select: { id: true, name: true } }
        },
        orderBy: { openedAt: 'desc' }
      });

      // Para sessões ativas, calcular o total de vendas em tempo real
      const sessionsWithTotals = await Promise.all(sessions.map(async (session) => {
        if (session.isActive) {
          const vendas = await prisma.sale.findMany({
            where: {
              pdvSessionId: session.id,
              status: 'COMPLETED'
            },
            select: { total: true }
          });
          const totalSales = vendas.reduce((sum, v) => sum + (v.total || 0), 0);
          return { ...session, totalSales };
        }
        return session;
      }));

      res.json(sessionsWithTotals);
    } catch (error) {
      console.error('Erro ao buscar histórico de sessões:', error);
      res.status(500).json({ error: 'Erro ao buscar histórico de sessões.' });
    }
  },
}; 