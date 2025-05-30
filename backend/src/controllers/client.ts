import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { generateToken } from '../config/jwt';
import { comparePassword, hashPassword } from '../config/bcrypt';
import { AppError } from '../config/errorHandler';

export const clientController = {
  register: async (req: Request, res: Response) => {
    console.log('Início do cadastro de cliente', req.body);
    const { name, email, password, cpf, phone } = req.body;

    if (!cpf) {
      throw new AppError('CPF é obrigatório.', 400);
    }
    const userExists = await prisma.user.findUnique({
      where: { email },
    });
    console.log('Usuário já existe?', !!userExists);
    if (userExists) {
      console.log('Email já cadastrado:', email);
      throw new AppError('Email já cadastrado', 400);
    }
    const hashedPassword = await hashPassword(password);
    console.log('Senha criptografada');
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER',
        cpf,
        phone,
      },
    });
    console.log('Usuário criado com sucesso:', user);
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cpf: user.cpf,
      },
      token,
    });
    console.log('Cadastro finalizado e resposta enviada');
  },

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

  getDashboard: async (req: Request, res: Response) => {
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

    res.json({
      user,
      message: 'Bem-vindo ao dashboard do cliente',
    });
  },

  getCatalogo: async (req: Request, res: Response) => {
    const produtos = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        category: true,
      },
    });

    res.json(produtos);
  },

  buscarProdutos: async (req: Request, res: Response) => {
    const { query } = req.query;

    const produtos = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query as string, mode: 'insensitive' } },
          { description: { contains: query as string, mode: 'insensitive' } },
        ],
        active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        category: true,
      },
    });

    res.json(produtos);
  },

  getCarrinho: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;

    const carrinho = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json(carrinho || { items: [] });
  },

  getEnderecos: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;

    const enderecos = await prisma.address.findMany({
      where: { userId },
    });

    res.json(enderecos);
  },

  getPedidos: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;

    const pedidos = await prisma.order.findMany({
      where: { userId },
      include: {
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

  getProfile: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    res.json(user);
  },

  updateProfile: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { name, email } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
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

  getOrders: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
    });

    res.json(orders);
  },

  createOrder: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { items, paymentMethodId } = req.body;

    // Buscar endereço para evitar erro de tipagem
    const address = await prisma.address.findFirst({ where: { userId } });
    if (!address) {
      return res.status(400).json({ error: 'Endereço não encontrado.' });
    }

    const total = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const order = await prisma.order.create({
      data: {
        userId,
        addressId: address.id,
        paymentMethodId: paymentMethodId || null,
        total,
        items: {
          create: items,
        },
      } as any, // força o tipo para aceitar paymentMethodId
      include: {
        items: true,
      },
    });

    res.json(order);
  },

  changePassword: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Preencha todos os campos.', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      throw new AppError('Senha atual incorreta.', 400);
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    res.json({ message: 'Senha alterada com sucesso!' });
  },

  getNotifications: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { order: true },
    });
    res.json(notifications);
  },

  readNotification: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }
    await prisma.notification.update({ where: { id }, data: { read: true } });
    res.json({ success: true });
  },
}; 