"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const jwt_1 = require("../config/jwt");
const bcrypt_1 = require("../config/bcrypt");
const errorHandler_1 = require("../config/errorHandler");
exports.adminController = {
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
        if (user.role !== 'ADMIN') {
            throw new errorHandler_1.AppError('Acesso negado. Apenas administradores podem acessar esta área.', 403);
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
    dashboard: async (req, res) => {
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
        const totalProdutos = await prisma_1.default.product.count();
        const totalPedidos = await prisma_1.default.order.count();
        const totalClientes = await prisma_1.default.user.count({
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
    getEstoque: async (req, res) => {
        const produtos = await prisma_1.default.product.findMany({
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
    getCadastroProdutos: async (req, res) => {
        const categorias = await prisma_1.default.category.findMany();
        const produtos = await prisma_1.default.product.findMany({
            include: {
                category: true,
            },
        });
        res.json({
            categorias,
            produtos,
        });
    },
    getPedidos: async (req, res) => {
        const pedidos = await prisma_1.default.order.findMany({
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
    getRelatorios: async (req, res) => {
        const totalVendas = await prisma_1.default.order.aggregate({
            _sum: {
                total: true,
            },
        });
        const vendasPorMes = await prisma_1.default.order.groupBy({
            by: ['createdAt'],
            _sum: {
                total: true,
            },
        });
        const produtosMaisVendidos = await prisma_1.default.orderItem.groupBy({
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
    getConfiguracoes: async (req, res) => {
        res.json([]);
    },
    getPDV: async (req, res) => {
        const produtos = await prisma_1.default.product.findMany({
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
        const combos = await prisma_1.default.combo.findMany({
            where: { active: true },
            include: { items: { include: { product: true } } },
        });
        res.json({ produtos, combos });
    },
    createUser: async (req, res) => {
        const { name, email, password, role } = req.body;
        if (!['ADMIN', 'MOTOBOY', 'USER'].includes(role)) {
            throw new errorHandler_1.AppError('Tipo de usuário inválido. Só é permitido ADMIN, MOTOBOY ou USER.', 400);
        }
        const userExists = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (userExists) {
            throw new errorHandler_1.AppError('Email já cadastrado', 400);
        }
        const hashedPassword = await (0, bcrypt_1.hashPassword)(password);
        const user = await prisma_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
            },
        });
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    },
    getUsers: async (req, res) => {
        const { roles } = req.query;
        let where = {};
        if (roles) {
            const rolesArray = String(roles).split(',').map(r => r.trim().toUpperCase());
            where = { role: { in: rolesArray } };
        }
        const users = await prisma_1.default.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json(users);
    },
    updateUser: async (req, res) => {
        const { id } = req.params;
        const { name, email, role } = req.body;
        const user = await prisma_1.default.user.update({
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
    deleteUser: async (req, res) => {
        const { id } = req.params;
        await prisma_1.default.user.delete({
            where: { id },
        });
        res.json({ message: 'Usuário excluído com sucesso' });
    },
    createPDVSale: async (req, res) => {
        const { items, paymentMethodId } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Nenhum item informado.' });
        }
        if (!paymentMethodId) {
            return res.status(400).json({ error: 'Meio de pagamento obrigatório.' });
        }
        const paymentMethod = await prisma_1.default.paymentMethod.findUnique({ where: { id: paymentMethodId } });
        if (!paymentMethod) {
            return res.status(400).json({ error: 'Meio de pagamento inválido.' });
        }
        const userId = req.user.id;
        const validItems = items.filter(item => !!item.productId);
        const allProducts = await prisma_1.default.product.findMany({
            where: { id: { in: validItems.map(i => i.productId) } },
            select: { id: true }
        });
        const validProductIds = new Set(allProducts.map(p => p.id));
        const reallyValidItems = validItems.filter(item => validProductIds.has(item.productId));
        console.log('Itens realmente válidos para venda:', reallyValidItems);
        for (const item of reallyValidItems) {
            if (item.comboId) {
                const combo = await prisma_1.default.combo.findUnique({
                    where: { id: item.comboId },
                    include: { items: true }
                });
                if (combo) {
                    for (const comboItem of combo.items) {
                        const produto = await prisma_1.default.product.findUnique({ where: { id: comboItem.productId } });
                        const quantidadeFinal = ((produto === null || produto === void 0 ? void 0 : produto.stock) || 0) - (comboItem.quantity * item.quantity);
                        if (quantidadeFinal < 0) {
                            return res.status(400).json({ error: `Estoque insuficiente para o produto do combo: ${produto === null || produto === void 0 ? void 0 : produto.name}. Disponível: ${produto === null || produto === void 0 ? void 0 : produto.stock}, solicitado: ${comboItem.quantity * item.quantity}` });
                        }
                    }
                }
            }
            else if (item.productId) {
                const produto = await prisma_1.default.product.findUnique({ where: { id: item.productId } });
                const quantidadeFinal = ((produto === null || produto === void 0 ? void 0 : produto.stock) || 0) - item.quantity;
                if (quantidadeFinal < 0) {
                    return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto === null || produto === void 0 ? void 0 : produto.name}. Disponível: ${produto === null || produto === void 0 ? void 0 : produto.stock}, solicitado: ${item.quantity}` });
                }
            }
        }
        const sale = await prisma_1.default.sale.create({
            data: {
                userId,
                total: reallyValidItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0),
                paymentMethodId,
                items: {
                    create: reallyValidItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            },
            include: {
                items: true
            }
        });
        for (const item of reallyValidItems) {
            if (item.comboId) {
                const combo = await prisma_1.default.combo.findUnique({
                    where: { id: item.comboId },
                    include: { items: true }
                });
                if (combo) {
                    for (const comboItem of combo.items) {
                        const produto = await prisma_1.default.product.findUnique({ where: { id: comboItem.productId } });
                        const quantidadeFinal = ((produto === null || produto === void 0 ? void 0 : produto.stock) || 0) - (comboItem.quantity * item.quantity);
                        if (quantidadeFinal < 0) {
                            return res.status(400).json({ error: `Estoque insuficiente para o produto do combo: ${produto === null || produto === void 0 ? void 0 : produto.name}` });
                        }
                    }
                    for (const comboItem of combo.items) {
                        await prisma_1.default.product.update({
                            where: { id: comboItem.productId },
                            data: { stock: { decrement: comboItem.quantity * item.quantity } }
                        });
                    }
                }
            }
            else if (item.productId) {
                const produto = await prisma_1.default.product.findUnique({ where: { id: item.productId } });
                const quantidadeFinal = ((produto === null || produto === void 0 ? void 0 : produto.stock) || 0) - item.quantity;
                if (quantidadeFinal < 0) {
                    return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto === null || produto === void 0 ? void 0 : produto.name}` });
                }
                await prisma_1.default.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
            }
        }
        res.status(201).json(sale);
    },
    getPDVSales: async (req, res) => {
        const sales = await prisma_1.default.sale.findMany({
            include: {
                user: { select: { id: true, name: true, email: true } },
                items: { include: { product: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(sales);
    },
};
