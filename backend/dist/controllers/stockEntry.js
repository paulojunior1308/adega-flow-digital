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
    }
};
