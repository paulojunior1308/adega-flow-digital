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
        let sale;
        try {
            sale = await prisma_1.default.sale.create({
                data: {
                    userId,
                    total: totalVenda,
                    paymentMethodId,
                    status: 'COMPLETED',
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
                        await prisma_1.default.product.update({
                            where: { id: item.productId },
                            data: {
                                totalVolume: novoVolume,
                                stock: novoStock
                            }
                        });
                    }
                    else {
                        await prisma_1.default.product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.quantity } }
                        });
                    }
                }
                else {
                    if (item.sellingByVolume) {
                        const unitVolume = produto.unitVolume || 1;
                        const volumeNecessario = item.quantity;
                        const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
                        const novoStock = Math.floor(novoTotalVolume / unitVolume);
                        await prisma_1.default.product.update({
                            where: { id: item.productId },
                            data: {
                                totalVolume: novoTotalVolume,
                                stock: novoStock
                            }
                        });
                    }
                    else {
                        const unitVolume = produto.unitVolume || 1;
                        const volumeNecessario = item.quantity * unitVolume;
                        const novoTotalVolume = (produto.totalVolume || 0) - volumeNecessario;
                        const novoStock = Math.floor(novoTotalVolume / unitVolume);
                        await prisma_1.default.product.update({
                            where: { id: item.productId },
                            data: {
                                totalVolume: novoTotalVolume,
                                stock: novoStock
                            }
                        });
                    }
                }
            }
            else {
                await prisma_1.default.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
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
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const amanha = new Date(hoje);
            amanha.setDate(hoje.getDate() + 1);
            const vendasPDV = await prisma_1.default.sale.findMany({
                where: {
                    createdAt: {
                        gte: hoje,
                        lt: amanha
                    },
                    status: 'COMPLETED'
                },
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
                        gte: hoje,
                        lt: amanha
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
            res.json({ pdv: vendasPDV, online: vendasOnline });
        }
        catch (err) {
            res.status(500).json({ error: 'Erro ao buscar vendas do dia.' });
        }
    },
};
