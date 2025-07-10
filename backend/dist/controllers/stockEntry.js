"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockEntryController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
exports.stockEntryController = {
    create: async (req, res) => {
        try {
            const { productId, quantity, unitCost, supplierId, notes } = req.body;
            if (!productId || !quantity || !unitCost) {
                return res.status(400).json({ error: 'Campos obrigatórios: produto, quantidade, custo unitário.' });
            }
            const totalCost = Number(quantity) * Number(unitCost);
            const produto = await prisma_1.default.product.findUnique({
                where: { id: productId },
                select: {
                    stock: true,
                    costPrice: true,
                    isFractioned: true,
                    unitVolume: true
                }
            });
            if (!produto) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }
            const estoqueAtual = produto.stock;
            const custoAtual = produto.costPrice;
            const quantidadeNova = Number(quantity);
            const custoNovo = Number(unitCost);
            let novoCustoMedio;
            if (estoqueAtual === 0) {
                novoCustoMedio = custoNovo;
            }
            else {
                const valorTotalAtual = estoqueAtual * custoAtual;
                const valorTotalNovo = quantidadeNova * custoNovo;
                const estoqueTotal = estoqueAtual + quantidadeNova;
                novoCustoMedio = (valorTotalAtual + valorTotalNovo) / estoqueTotal;
            }
            const entry = await prisma_1.default.stockEntry.create({
                data: {
                    productId,
                    quantity: quantidadeNova,
                    unitCost: custoNovo,
                    totalCost,
                    supplierId: supplierId || null,
                    notes: notes || null
                },
                include: { product: true, supplier: true }
            });
            await prisma_1.default.stockMovement.create({
                data: {
                    productId,
                    type: 'in',
                    quantity: quantidadeNova,
                    unitCost: custoNovo,
                    totalCost,
                    notes: notes || null,
                    origin: 'manual'
                }
            });
            await prisma_1.default.product.update({
                where: { id: productId },
                data: Object.assign({ costPrice: novoCustoMedio, stock: { increment: quantidadeNova } }, (produto.isFractioned && produto.unitVolume ? {
                    totalVolume: { increment: quantidadeNova * Number(produto.unitVolume) }
                } : {}))
            });
            res.status(201).json(Object.assign(Object.assign({}, entry), { novoCustoMedio: novoCustoMedio.toFixed(2), estoqueAnterior: estoqueAtual, estoqueNovo: estoqueAtual + quantidadeNova }));
        }
        catch (error) {
            console.error('Erro ao registrar entrada de estoque:', error);
            res.status(500).json({ error: 'Erro ao registrar entrada de estoque' });
        }
    },
    list: async (req, res) => {
        try {
            const entries = await prisma_1.default.stockEntry.findMany({
                include: { product: true, supplier: true },
                orderBy: { createdAt: 'desc' }
            });
            res.json(entries);
        }
        catch (error) {
            console.error('Erro ao listar entradas de estoque:', error);
            res.status(500).json({ error: 'Erro ao listar entradas de estoque' });
        }
    },
    stockOut: async (req, res) => {
        try {
            const { productId, quantity, notes } = req.body;
            if (!productId || !quantity) {
                return res.status(400).json({ error: 'Campos obrigatórios: produto e quantidade.' });
            }
            const quantidade = Number(quantity);
            const produto = await prisma_1.default.product.findUnique({
                where: { id: productId },
                select: {
                    id: true,
                    name: true,
                    stock: true,
                    costPrice: true,
                    isFractioned: true,
                    unitVolume: true,
                    totalVolume: true
                }
            });
            if (!produto) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }
            if (produto.isFractioned) {
                if ((produto.totalVolume || 0) < quantidade) {
                    return res.status(400).json({
                        error: `Estoque insuficiente. Produto: ${produto.name}. Volume disponível: ${produto.totalVolume}ml, solicitado: ${quantidade}ml`
                    });
                }
            }
            else {
                if ((produto.stock || 0) < quantidade) {
                    return res.status(400).json({
                        error: `Estoque insuficiente. Produto: ${produto.name}. Unidades disponíveis: ${produto.stock}, solicitadas: ${quantidade}`
                    });
                }
            }
            const totalCost = (produto.costPrice || 0) * quantidade;
            await prisma_1.default.stockMovement.create({
                data: {
                    productId,
                    type: 'out',
                    quantity: quantidade,
                    unitCost: produto.costPrice || 0,
                    totalCost,
                    notes: notes || 'Baixa Manual',
                    origin: 'baixa_manual'
                }
            });
            if (produto.isFractioned) {
                const unitVolume = produto.unitVolume || 1;
                const novoTotalVolume = (produto.totalVolume || 0) - quantidade;
                const novoStock = Math.floor(novoTotalVolume / unitVolume);
                await prisma_1.default.product.update({
                    where: { id: productId },
                    data: {
                        totalVolume: novoTotalVolume,
                        stock: novoStock
                    }
                });
            }
            else {
                await prisma_1.default.product.update({
                    where: { id: productId },
                    data: { stock: { decrement: quantidade } }
                });
            }
            res.status(201).json({
                message: 'Baixa de estoque registrada com sucesso',
                produto: produto.name,
                quantidadeBaixada: quantidade,
                estoqueAnterior: produto.isFractioned ? produto.totalVolume : produto.stock,
                estoqueNovo: produto.isFractioned ?
                    (produto.totalVolume || 0) - quantidade :
                    (produto.stock || 0) - quantidade
            });
        }
        catch (error) {
            console.error('Erro ao registrar baixa de estoque:', error);
            res.status(500).json({ error: 'Erro ao registrar baixa de estoque' });
        }
    },
    listMovements: async (req, res) => {
        try {
            const movements = await prisma_1.default.stockMovement.findMany({
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            category: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            const safeMovements = movements.filter(mov => mov.product !== null);
            res.json(safeMovements);
        }
        catch (error) {
            console.error('Erro ao listar movimentações de estoque:', error);
            res.status(500).json({ error: 'Erro ao listar movimentações de estoque' });
        }
    }
};
