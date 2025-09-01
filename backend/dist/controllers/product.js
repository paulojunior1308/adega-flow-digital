"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const stockStatus_1 = require("../utils/stockStatus");
exports.productController = {
    list: async (req, res) => {
        try {
            const { categoryId, pinned, search } = req.query;
            const where = {};
            if (categoryId)
                where.categoryId = categoryId;
            if (typeof pinned !== 'undefined')
                where.pinned = pinned === 'true';
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { barcode: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } }
                ];
            }
            const products = await prisma_1.default.product.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true } },
                    supplier: true
                }
            });
            res.json(products);
        }
        catch (error) {
            console.error('Erro ao listar produtos:', error);
            res.status(500).json({ error: 'Erro ao listar produtos' });
        }
    },
    listCategories: async (req, res) => {
        try {
            const categories = await prisma_1.default.category.findMany({
                where: { active: true },
                select: {
                    id: true,
                    name: true,
                    description: true
                }
            });
            res.json(categories);
        }
        catch (error) {
            console.error('Erro ao listar categorias:', error);
            res.status(500).json({ error: 'Erro ao listar categorias' });
        }
    },
    create: async (req, res) => {
        try {
            const { name, description, price, categoryId, supplierId, stock, minStock, barcode, costPrice, margin, image, isFractioned, totalVolume, unitVolume } = req.body;
            let finalPrice = parseFloat(price);
            if (margin && costPrice && !price) {
                const marginPercent = parseFloat(margin);
                finalPrice = parseFloat(costPrice) / (1 - (marginPercent / 100));
            }
            const stockValue = parseInt(stock);
            const isFractionedValue = isFractioned === true || isFractioned === 'true';
            const totalVolumeValue = totalVolume ? parseFloat(totalVolume) : null;
            const stockStatus = (0, stockStatus_1.calculateStockStatus)(stockValue, isFractionedValue, totalVolumeValue);
            const product = await prisma_1.default.product.create({
                data: {
                    name,
                    description,
                    price: finalPrice,
                    costPrice: costPrice ? parseFloat(costPrice) : 0,
                    margin: margin ? parseFloat(margin) : null,
                    categoryId,
                    supplierId: supplierId || null,
                    stock: stockValue,
                    minStock: minStock ? parseInt(minStock) : 0,
                    barcode: barcode || null,
                    image: image || null,
                    isFractioned: isFractionedValue,
                    totalVolume: totalVolumeValue,
                    unitVolume: unitVolume ? parseFloat(unitVolume) : null,
                    stockStatus
                },
                include: {
                    category: true,
                    supplier: true
                }
            });
            console.log('Produto criado:', product);
            res.json(product);
        }
        catch (error) {
            console.error('Erro ao criar produto:', error);
            res.status(500).json({ error: 'Erro ao criar produto' });
        }
    },
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, price, categoryId, supplierId, stock, minStock, barcode, costPrice, margin, active, image, isFractioned, totalVolume, unitVolume } = req.body;
            let finalPrice = parseFloat(price);
            if (margin && costPrice) {
                const marginPercent = parseFloat(margin);
                finalPrice = parseFloat(costPrice) / (1 - (marginPercent / 100));
            }
            const stockValue = parseInt(stock);
            const isFractionedValue = isFractioned === true || isFractioned === 'true';
            const totalVolumeValue = totalVolume ? parseFloat(totalVolume) : null;
            const stockStatus = (0, stockStatus_1.calculateStockStatus)(stockValue, isFractionedValue, totalVolumeValue);
            const product = await prisma_1.default.product.update({
                where: { id },
                data: {
                    name,
                    description,
                    price: finalPrice,
                    costPrice: costPrice ? parseFloat(costPrice) : undefined,
                    margin: margin ? parseFloat(margin) : undefined,
                    stock: stockValue,
                    minStock: minStock ? parseInt(minStock) : undefined,
                    barcode,
                    active: typeof active === 'boolean' ? active : active === 'true' || active === '1',
                    image: image || undefined,
                    isFractioned: isFractionedValue,
                    totalVolume: totalVolumeValue,
                    unitVolume: unitVolume ? parseFloat(unitVolume) : null,
                    stockStatus,
                    category: {
                        connect: { id: categoryId }
                    },
                    supplier: supplierId ? {
                        connect: { id: supplierId }
                    } : undefined
                },
                include: {
                    category: true,
                    supplier: true
                }
            });
            console.log('Produto atualizado:', product);
            res.json(product);
        }
        catch (error) {
            console.error('Erro ao atualizar produto:', error);
            res.status(500).json({ error: 'Erro ao atualizar produto.' });
        }
    },
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const sales = await prisma_1.default.saleItem.findFirst({ where: { productId: id } });
            if (sales) {
                return res.status(400).json({ error: 'Não é possível excluir, pois o produto está vinculado a vendas.' });
            }
            const combos = await prisma_1.default.comboItem.findFirst({ where: { productId: id } });
            if (combos) {
                return res.status(400).json({ error: 'Não é possível excluir, pois o produto está vinculado a combos.' });
            }
            await prisma_1.default.product.delete({ where: { id } });
            res.json({ message: 'Produto excluído com sucesso.' });
        }
        catch (error) {
            console.error('Erro ao deletar produto:', error);
            if (error.code === 'P2003') {
                return res.status(400).json({ error: 'Não é possível excluir este produto pois ele está sendo usado em outras partes do sistema.' });
            }
            res.status(500).json({ error: 'Erro ao deletar produto.' });
        }
    },
    listPromosCombos: async (req, res) => {
        const products = await prisma_1.default.product.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                price: true,
                image: true,
                isPromotion: true,
                isCombo: true,
                active: true,
                category: true,
            },
        });
        res.json(products);
    },
    updatePromosCombos: async (req, res) => {
        const { id } = req.params;
        const { isPromotion, isCombo } = req.body;
        const product = await prisma_1.default.product.update({
            where: { id },
            data: {
                isPromotion: typeof isPromotion === 'boolean' ? isPromotion : undefined,
                isCombo: typeof isCombo === 'boolean' ? isCombo : undefined,
            },
            select: {
                id: true,
                name: true,
                isPromotion: true,
                isCombo: true,
            },
        });
        res.json(product);
    },
    updatePinned: async (req, res) => {
        try {
            const { id } = req.params;
            const { pinned } = req.body;
            const product = await prisma_1.default.product.update({
                where: { id },
                data: { pinned: Boolean(pinned) },
            });
            res.json(product);
        }
        catch (error) {
            console.error('Erro ao atualizar pinned do produto:', error);
            res.status(500).json({ error: 'Erro ao atualizar produto' });
        }
    },
    updateStock: async (req, res) => {
        try {
            const { id } = req.params;
            const { stock } = req.body;
            const stockValue = parseInt(stock);
            const productInfo = await prisma_1.default.product.findUnique({
                where: { id },
                select: {
                    isFractioned: true,
                    totalVolume: true
                }
            });
            if (!productInfo) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }
            const stockStatus = (0, stockStatus_1.calculateStockStatus)(stockValue, productInfo.isFractioned, productInfo.totalVolume);
            const product = await prisma_1.default.product.update({
                where: { id },
                data: {
                    stock: stockValue,
                    stockStatus
                },
                include: {
                    category: true,
                    supplier: true
                }
            });
            res.json(product);
        }
        catch (error) {
            console.error('Erro ao atualizar estoque:', error);
            res.status(500).json({ error: 'Erro ao atualizar estoque.' });
        }
    },
};
