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
const stockStatus_1 = require("../utils/stockStatus");
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
        try {
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
        }
        catch (error) {
            console.error('Erro ao buscar estoque:', error);
            res.status(500).json({ error: 'Erro ao buscar estoque' });
        }
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
        const { name, email, password, role, cpf } = req.body;
        if (!['ADMIN', 'MOTOBOY', 'USER'].includes(role)) {
            throw new errorHandler_1.AppError('Tipo de usuário inválido. Só é permitido ADMIN, MOTOBOY ou USER.', 400);
        }
        if (!cpf) {
            throw new errorHandler_1.AppError('CPF é obrigatório.', 400);
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
        const usersWithStats = users.map((user) => {
            const orders = user.orders || [];
            const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
            return Object.assign(Object.assign({}, user), { orders: orders.length, totalSpent });
        });
        res.json(usersWithStats);
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
        const paymentMethod = await prisma_1.default.paymentMethod.findUnique({ where: { id: paymentMethodId } });
        if (!paymentMethod) {
            console.log('=== DEBUG: Erro - Meio de pagamento inválido ===');
            return res.status(400).json({ error: 'Meio de pagamento inválido.' });
        }
        const userId = req.user.id;
        console.log('=== DEBUG: userId ===', userId);
        console.log('Itens recebidos na venda:', items);
        const processedItems = items.filter(item => !!item.productId);
        const allProducts = await prisma_1.default.product.findMany({
            where: { id: { in: processedItems.map(i => i.productId) } },
            select: { id: true }
        });
        const validProductIds = new Set(allProducts.map((p) => p.id));
        const reallyValidItems = processedItems.filter(item => validProductIds.has(item.productId));
        console.log('Itens realmente válidos para venda (incluindo produtos de ofertas):', reallyValidItems);
        console.log('=== DEBUG: Iniciando verificação de estoque ===');
        for (const item of reallyValidItems) {
            console.log(`=== DEBUG: Verificando estoque do item ${item.productId} ===`);
            const produto = await prisma_1.default.product.findUnique({ where: { id: item.productId } });
            console.log('Produto encontrado:', produto);
            if (!produto) {
                console.log(`=== DEBUG: Produto não encontrado: ${item.productId} ===`);
                continue;
            }
            if (produto.isFractioned) {
                console.log('=== DEBUG: Produto é fracionado ===');
                if (item.isDoseItem) {
                    console.log('=== DEBUG: Item é de dose ===');
                    if (item.discountBy === 'volume') {
                        const novoVolume = (produto.totalVolume || 0) - item.quantity;
                        console.log(`=== DEBUG: Novo volume seria: ${novoVolume} ===`);
                        if (novoVolume < 0) {
                            console.log(`=== DEBUG: Erro - Estoque insuficiente (volume) para: ${produto.name} ===`);
                            return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
                        }
                    }
                    else {
                        const novoEstoque = (produto.stock || 0) - item.quantity;
                        console.log(`=== DEBUG: Novo estoque seria: ${novoEstoque} ===`);
                        if (novoEstoque < 0) {
                            console.log(`=== DEBUG: Erro - Estoque insuficiente para: ${produto.name} ===`);
                            return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
                        }
                    }
                }
                else {
                    console.log('=== DEBUG: Produto fracionado normal ===');
                    if (item.sellingByVolume) {
                        const unitVolume = produto.unitVolume || 1;
                        const volumeNecessario = item.quantity;
                        const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
                        const novoStock = Math.floor(novoTotalVolume / unitVolume);
                        console.log(`=== DEBUG: Novo volume seria: ${novoTotalVolume}, novo stock: ${novoStock} ===`);
                        if (novoTotalVolume < 0) {
                            console.log(`=== DEBUG: Erro - Estoque insuficiente (volume) para: ${produto.name} ===`);
                            return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
                        }
                    }
                    else {
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
            }
            else {
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
        let totalVenda = 0;
        for (const item of reallyValidItems) {
            if (item.price && item.quantity) {
                totalVenda += item.price * item.quantity;
            }
        }
        console.log('=== DEBUG PDV ===');
        console.log('Itens realmente válidos para venda:', JSON.stringify(reallyValidItems, null, 2));
        for (const item of reallyValidItems) {
            const produto = await prisma_1.default.product.findUnique({ where: { id: item.productId } });
            console.log(`Produto encontrado para item:`, item.productId, produto);
        }
        console.log('=== DEBUG: Itens prontos para criar venda ===');
        console.log(JSON.stringify(reallyValidItems, null, 2));
        console.log('=== DEBUG: Dados da venda ===');
        console.log({ userId, totalVenda, paymentMethodId });
        const activeSession = await prisma_1.default.pDVSession.findFirst({
            where: { isActive: true },
            orderBy: { openedAt: 'desc' }
        });
        let sale;
        try {
            sale = await prisma_1.default.sale.create({
                data: {
                    userId,
                    total: totalVenda,
                    paymentMethodId,
                    status: 'COMPLETED',
                    pdvSessionId: activeSession ? activeSession.id : null,
                    items: {
                        create: await Promise.all(reallyValidItems.map(async (item) => {
                            const produto = await prisma_1.default.product.findUnique({ where: { id: item.productId } });
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
        }
        catch (error) {
            console.error('=== ERRO AO CRIAR VENDA ===');
            console.error('Erro ao criar venda:', error);
            if (error instanceof Error && error.stack) {
                console.error('Stack trace:', error.stack);
            }
            console.error('Payload que causou o erro:', JSON.stringify(reallyValidItems, null, 2));
            return res.status(400).json({ error: `Erro ao criar venda: ${error.message || 'Erro desconhecido'}` });
        }
        console.log('=== DEBUG: Atualizando estoque dos itens ===');
        console.log(JSON.stringify(reallyValidItems, null, 2));
        for (const item of reallyValidItems) {
            const produto = await prisma_1.default.product.findUnique({ where: { id: item.productId } });
            if (!produto)
                continue;
            if (produto.isFractioned) {
                if (item.isDoseItem) {
                    if (item.discountBy === 'volume') {
                        const novoVolume = (produto.totalVolume || 0) - item.quantity;
                        const unitVolume = produto.unitVolume || 1;
                        const novoStock = Math.floor(novoVolume / unitVolume);
                        const updatedProduct = await prisma_1.default.product.update({
                            where: { id: item.productId },
                            data: {
                                totalVolume: novoVolume,
                                stock: novoStock
                            },
                            select: { stock: true, isFractioned: true, totalVolume: true }
                        });
                        await (0, stockStatus_1.updateProductStockStatusWithValues)(item.productId, prisma_1.default, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                    }
                    else {
                        const updatedProduct = await prisma_1.default.product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.quantity } },
                            select: { stock: true, isFractioned: true, totalVolume: true }
                        });
                        await (0, stockStatus_1.updateProductStockStatusWithValues)(item.productId, prisma_1.default, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                    }
                }
                else {
                    if (item.sellingByVolume) {
                        const unitVolume = produto.unitVolume || 1;
                        const volumeNecessario = item.quantity;
                        const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
                        const novoStock = Math.floor(novoTotalVolume / unitVolume);
                        const updatedProduct = await prisma_1.default.product.update({
                            where: { id: item.productId },
                            data: {
                                totalVolume: novoTotalVolume,
                                stock: novoStock
                            },
                            select: { stock: true, isFractioned: true, totalVolume: true }
                        });
                        await (0, stockStatus_1.updateProductStockStatusWithValues)(item.productId, prisma_1.default, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                    }
                    else {
                        const unitVolume = produto.unitVolume || 1;
                        const volumeNecessario = item.quantity * unitVolume;
                        const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
                        const novoStock = Math.floor(novoTotalVolume / unitVolume);
                        const updatedProduct = await prisma_1.default.product.update({
                            where: { id: item.productId },
                            data: {
                                totalVolume: novoTotalVolume,
                                stock: novoStock
                            },
                            select: { stock: true, isFractioned: true, totalVolume: true }
                        });
                        await (0, stockStatus_1.updateProductStockStatusWithValues)(item.productId, prisma_1.default, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                    }
                }
            }
            else {
                const updatedProduct = await prisma_1.default.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                    select: { stock: true, isFractioned: true, totalVolume: true }
                });
                await (0, stockStatus_1.updateProductStockStatusWithValues)(item.productId, prisma_1.default, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
            }
        }
        for (const item of reallyValidItems) {
            const produto = await prisma_1.default.product.findUnique({ where: { id: item.productId } });
            if (!produto)
                continue;
            await prisma_1.default.stockMovement.create({
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
    getPDVSales: async (req, res) => {
        try {
            const sales = await prisma_1.default.sale.findMany({
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
            const safeSales = sales.map(sale => (Object.assign(Object.assign({}, sale), { items: sale.items.filter(item => item.product !== null) })));
            if (safeSales.length > 0) {
                console.log('Primeira venda retornada pelo Prisma:');
                console.log(JSON.stringify(safeSales[0], null, 2));
            }
            else {
                console.log('Nenhuma venda encontrada.');
            }
            res.json(safeSales);
        }
        catch (error) {
            console.error('Erro ao buscar vendas:', error);
            res.status(500).json({ error: 'Erro ao buscar vendas' });
        }
    },
    updatePDVSale: async (req, res) => {
        const { id } = req.params;
        const { paymentMethodId } = req.body;
        if (!paymentMethodId) {
            return res.status(400).json({ error: 'Meio de pagamento obrigatório.' });
        }
        const paymentMethod = await prisma_1.default.paymentMethod.findUnique({ where: { id: paymentMethodId } });
        if (!paymentMethod) {
            return res.status(400).json({ error: 'Meio de pagamento inválido.' });
        }
        try {
            const sale = await prisma_1.default.sale.update({
                where: { id },
                data: { paymentMethodId },
                include: { paymentMethod: true }
            });
            res.json(sale);
        }
        catch (error) {
            console.error('Erro ao atualizar método de pagamento da venda:', error);
            res.status(400).json({ error: 'Erro ao atualizar método de pagamento da venda.' });
        }
    },
    getEstoqueTotals: async (req, res) => {
        try {
            const produtos = await prisma_1.default.product.findMany({
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
        }
        catch (err) {
            res.status(500).json({ error: 'Erro ao calcular totais do estoque.' });
        }
    },
    getVendasHoje: async (req, res) => {
        try {
            const activeSession = await prisma_1.default.pDVSession.findFirst({
                where: { isActive: true },
                orderBy: { openedAt: 'desc' }
            });
            let startDate;
            let endDate;
            let pDVSessionId = undefined;
            if (activeSession) {
                startDate = activeSession.openedAt;
                endDate = new Date();
                pDVSessionId = activeSession.id;
            }
            else {
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                const amanha = new Date(hoje);
                amanha.setDate(hoje.getDate() + 1);
                startDate = hoje;
                endDate = amanha;
            }
            const vendasPDV = await prisma_1.default.sale.findMany({
                where: Object.assign({ createdAt: {
                        gte: startDate,
                        lt: endDate
                    }, status: 'COMPLETED' }, (pDVSessionId ? { pdvSessionId: pDVSessionId } : {})),
                select: {
                    id: true,
                    total: true,
                    createdAt: true,
                    user: { select: { id: true, name: true } },
                    paymentMethod: { select: { id: true, name: true } }
                }
            });
            const vendasOnline = await prisma_1.default.order.findMany({
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
        }
        catch (err) {
            res.status(500).json({ error: 'Erro ao buscar vendas do dia.' });
        }
    },
    openPDVSession: async (req, res) => {
        try {
            const { initialCash, notes } = req.body;
            const userId = req.user.id;
            const existingSession = await prisma_1.default.pDVSession.findFirst({
                where: { isActive: true }
            });
            if (existingSession) {
                return res.status(400).json({ error: 'Já existe uma sessão do PDV aberta.' });
            }
            const session = await prisma_1.default.pDVSession.create({
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
        }
        catch (error) {
            console.error('Erro ao abrir sessão do PDV:', error);
            res.status(500).json({ error: 'Erro ao abrir sessão do PDV.' });
        }
    },
    closePDVSession: async (req, res) => {
        try {
            const { finalCash, notes } = req.body;
            const userId = req.user.id;
            const activeSession = await prisma_1.default.pDVSession.findFirst({
                where: { isActive: true }
            });
            if (!activeSession) {
                return res.status(400).json({ error: 'Não há sessão do PDV aberta.' });
            }
            const sessionSales = await prisma_1.default.sale.findMany({
                where: {
                    pdvSessionId: activeSession.id,
                    status: 'COMPLETED'
                },
                select: { total: true }
            });
            const totalSales = sessionSales.reduce((sum, sale) => sum + sale.total, 0);
            const closedSession = await prisma_1.default.pDVSession.update({
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
        }
        catch (error) {
            console.error('Erro ao fechar sessão do PDV:', error);
            res.status(500).json({ error: 'Erro ao fechar sessão do PDV.' });
        }
    },
    getActivePDVSession: async (req, res) => {
        try {
            const activeSession = await prisma_1.default.pDVSession.findFirst({
                where: { isActive: true },
                include: {
                    user: { select: { id: true, name: true } }
                },
                orderBy: { openedAt: 'desc' }
            });
            res.json(activeSession);
        }
        catch (error) {
            console.error('Erro ao buscar sessão ativa:', error);
            res.status(500).json({ error: 'Erro ao buscar sessão ativa.' });
        }
    },
    cancelSale: async (req, res) => {
        const { id } = req.params;
        try {
            const sale = await prisma_1.default.sale.findUnique({
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
            const result = await prisma_1.default.$transaction(async (tx) => {
                for (const item of sale.items) {
                    const produto = item.product;
                    if (!produto)
                        continue;
                    if (produto.isFractioned) {
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
                    else {
                        await tx.product.update({
                            where: { id: produto.id },
                            data: {
                                stock: { increment: item.quantity }
                            }
                        });
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
                    const updatedProduct = await tx.product.findUnique({
                        where: { id: produto.id },
                        select: { stock: true, isFractioned: true, totalVolume: true }
                    });
                    if (updatedProduct) {
                        await (0, stockStatus_1.updateProductStockStatusWithValues)(produto.id, tx, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                    }
                }
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
        }
        catch (error) {
            console.error('Erro ao cancelar venda:', error);
            res.status(500).json({ error: 'Erro ao cancelar venda.' });
        }
    },
    editSale: async (req, res) => {
        const { id } = req.params;
        const { items, paymentMethodId } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Nenhum item informado.' });
        }
        try {
            const currentSale = await prisma_1.default.sale.findUnique({
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
            const processedItems = items.filter(item => !!item.productId);
            const allProducts = await prisma_1.default.product.findMany({
                where: { id: { in: processedItems.map(i => i.productId) } },
                select: { id: true }
            });
            const validProductIds = new Set(allProducts.map((p) => p.id));
            const newItems = processedItems.filter(item => validProductIds.has(item.productId));
            const result = await prisma_1.default.$transaction(async (tx) => {
                for (const item of currentSale.items) {
                    const produto = item.product;
                    if (!produto)
                        continue;
                    if (produto.isFractioned) {
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
                    else {
                        await tx.product.update({
                            where: { id: produto.id },
                            data: {
                                stock: { increment: item.quantity }
                            }
                        });
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
                    const updatedProduct = await tx.product.findUnique({
                        where: { id: produto.id },
                        select: { stock: true, isFractioned: true, totalVolume: true }
                    });
                    if (updatedProduct) {
                        await (0, stockStatus_1.updateProductStockStatusWithValues)(produto.id, tx, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                    }
                }
                for (const item of newItems) {
                    const produto = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!produto)
                        continue;
                    if (produto.isFractioned) {
                        const unitVolume = produto.unitVolume || 1;
                        const volumeNecessario = item.quantity;
                        const volumeDisponivel = produto.totalVolume || 0;
                        if (volumeDisponivel < volumeNecessario) {
                            throw new Error(`Estoque insuficiente para o produto: ${produto.name}`);
                        }
                    }
                    else {
                        const estoqueAtual = produto.stock || 0;
                        const novoEstoque = estoqueAtual - item.quantity;
                        if (novoEstoque < 0) {
                            throw new Error(`Estoque insuficiente para o produto: ${produto.name}`);
                        }
                    }
                }
                for (const item of newItems) {
                    const produto = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!produto)
                        continue;
                    if (produto.isFractioned) {
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
                    else {
                        await tx.product.update({
                            where: { id: produto.id },
                            data: { stock: { decrement: item.quantity } }
                        });
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
                    const updatedProduct = await tx.product.findUnique({
                        where: { id: produto.id },
                        select: { stock: true, isFractioned: true, totalVolume: true }
                    });
                    if (updatedProduct) {
                        await (0, stockStatus_1.updateProductStockStatusWithValues)(produto.id, tx, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                    }
                }
                let newTotal = 0;
                for (const item of newItems) {
                    const produto = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!produto)
                        continue;
                    if (produto.isFractioned && produto.unitVolume) {
                        const volumeRatio = item.quantity / produto.unitVolume;
                        const totalPrice = volumeRatio * produto.price;
                        newTotal += totalPrice - (item.discount || 0);
                    }
                    else {
                        newTotal += (item.price * item.quantity) - (item.discount || 0);
                    }
                }
                const updatedSale = await tx.sale.update({
                    where: { id },
                    data: {
                        total: newTotal,
                        paymentMethodId: paymentMethodId || currentSale.paymentMethodId,
                        items: {
                            deleteMany: {},
                            create: await Promise.all(newItems.map(async (item) => {
                                const produto = await tx.product.findUnique({ where: { id: item.productId } });
                                if (!produto) {
                                    throw new Error(`Produto não encontrado: ${item.productId}`);
                                }
                                let quantityToRecord = item.quantity;
                                let priceToRecord = item.price;
                                if (produto.isFractioned && !item.isDoseItem) {
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
        }
        catch (error) {
            console.error('Erro ao editar venda:', error);
            res.status(500).json({
                error: error.message || 'Erro ao editar venda.'
            });
        }
    },
    getPDVSessionsHistory: async (req, res) => {
        try {
            let sessions = await prisma_1.default.pDVSession.findMany({
                include: {
                    user: { select: { id: true, name: true } },
                    closedByUser: { select: { id: true, name: true } }
                },
                orderBy: { openedAt: 'desc' }
            });
            const sessionsWithTotals = await Promise.all(sessions.map(async (session) => {
                if (session.isActive) {
                    const vendas = await prisma_1.default.sale.findMany({
                        where: {
                            pdvSessionId: session.id,
                            status: 'COMPLETED'
                        },
                        select: { total: true }
                    });
                    const totalSales = vendas.reduce((sum, v) => sum + (v.total || 0), 0);
                    return Object.assign(Object.assign({}, session), { totalSales });
                }
                return session;
            }));
            res.json(sessionsWithTotals);
        }
        catch (error) {
            console.error('Erro ao buscar histórico de sessões:', error);
            res.status(500).json({ error: 'Erro ao buscar histórico de sessões.' });
        }
    },
};
