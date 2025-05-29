"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const jwt_1 = require("../config/jwt");
const bcrypt_1 = require("../config/bcrypt");
const errorHandler_1 = require("../config/errorHandler");
exports.clientController = {
    register: async (req, res) => {
        console.log('Início do cadastro de cliente', req.body);
        const { name, email, password, cpf, phone } = req.body;
        if (!cpf) {
            throw new errorHandler_1.AppError('CPF é obrigatório.', 400);
        }
        const userExists = await prisma_1.default.user.findUnique({
            where: { email },
        });
        console.log('Usuário já existe?', !!userExists);
        if (userExists) {
            console.log('Email já cadastrado:', email);
            throw new errorHandler_1.AppError('Email já cadastrado', 400);
        }
        const hashedPassword = await (0, bcrypt_1.hashPassword)(password);
        console.log('Senha criptografada');
        const user = await prisma_1.default.user.create({
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
        const token = (0, jwt_1.generateToken)({ id: user.id, email: user.email, role: user.role });
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
    login: async (req, res) => {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new errorHandler_1.AppError('Credenciais inválidas', 401);
        }
        const passwordMatch = await (0, bcrypt_1.comparePassword)(password, user.password);
        if (!passwordMatch) {
            throw new errorHandler_1.AppError('Credenciais inválidas', 401);
        }
        const token = (0, jwt_1.generateToken)({ id: user.id, email: user.email, role: user.role });
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
    getDashboard: async (req, res) => {
        const userId = req.user.id;
        const user = await prisma_1.default.user.findUnique({
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
    getCatalogo: async (req, res) => {
        const produtos = await prisma_1.default.product.findMany({
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
    buscarProdutos: async (req, res) => {
        const { query } = req.query;
        const produtos = await prisma_1.default.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
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
    getCarrinho: async (req, res) => {
        const userId = req.user.id;
        const carrinho = await prisma_1.default.cart.findUnique({
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
    getEnderecos: async (req, res) => {
        const userId = req.user.id;
        const enderecos = await prisma_1.default.address.findMany({
            where: { userId },
        });
        res.json(enderecos);
    },
    getPedidos: async (req, res) => {
        const userId = req.user.id;
        const pedidos = await prisma_1.default.order.findMany({
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
    getProfile: async (req, res) => {
        const userId = req.user.id;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new errorHandler_1.AppError('Usuário não encontrado', 404);
        }
        res.json(user);
    },
    updateProfile: async (req, res) => {
        const userId = req.user.id;
        const { name, email } = req.body;
        const user = await prisma_1.default.user.update({
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
    getOrders: async (req, res) => {
        const userId = req.user.id;
        const orders = await prisma_1.default.order.findMany({
            where: { userId },
            include: {
                items: true,
            },
        });
        res.json(orders);
    },
    createOrder: async (req, res) => {
        const userId = req.user.id;
        const { items, paymentMethodId } = req.body;
        const address = await prisma_1.default.address.findFirst({ where: { userId } });
        if (!address) {
            return res.status(400).json({ error: 'Endereço não encontrado.' });
        }
        const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
        const order = await prisma_1.default.order.create({
            data: {
                userId,
                addressId: address.id,
                paymentMethodId: paymentMethodId || null,
                total,
                items: {
                    create: items,
                },
            },
            include: {
                items: true,
            },
        });
        res.json(order);
    },
};
