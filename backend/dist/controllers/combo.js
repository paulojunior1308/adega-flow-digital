"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comboController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
exports.comboController = {
    list: async (req, res) => {
        try {
            const combos = await prisma_1.default.combo.findMany({
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    category: true
                                }
                            }
                        }
                    },
                    category: true
                }
            });
            const combosComProdutos = combos.map(combo => (Object.assign(Object.assign({}, combo), { items: combo.items.map(item => (Object.assign(Object.assign({}, item), { product: item.product || null }))) })));
            res.json(combosComProdutos);
        }
        catch (error) {
            console.error('Erro ao listar combos:', error);
            res.status(500).json({ error: 'Erro ao listar combos' });
        }
    },
    create: async (req, res) => {
        try {
            const { name, description, price, items, image, categoryId } = req.body;
            const parsedItems = JSON.parse(items);
            const combo = await prisma_1.default.combo.create({
                data: {
                    name,
                    description,
                    price: parseFloat(price),
                    image: image || undefined,
                    categoryId: categoryId || null,
                    items: {
                        create: parsedItems.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            allowFlavorSelection: item.allowFlavorSelection,
                            maxFlavors: item.maxFlavors || 1,
                            categoryId: item.categoryId || null,
                            nameFilter: item.nameFilter || null
                        }))
                    }
                },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    category: true
                                }
                            }
                        }
                    },
                    category: true
                }
            });
            res.json(combo);
        }
        catch (error) {
            console.error('Erro ao criar combo:', error);
            res.status(500).json({ error: 'Erro ao criar combo' });
        }
    },
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, price, items, active, image, categoryId } = req.body;
            const parsedItems = JSON.parse(items);
            await prisma_1.default.comboItem.deleteMany({
                where: { comboId: id }
            });
            const combo = await prisma_1.default.combo.update({
                where: { id },
                data: {
                    name,
                    description,
                    price: parseFloat(price),
                    active: active === 'true',
                    image: image || undefined,
                    categoryId: categoryId || null,
                    items: {
                        create: parsedItems.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            allowFlavorSelection: item.allowFlavorSelection,
                            maxFlavors: item.maxFlavors || 1,
                            categoryId: item.categoryId || null,
                            nameFilter: item.nameFilter || null
                        }))
                    }
                },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    category: true
                                }
                            }
                        }
                    },
                    category: true
                }
            });
            res.json(combo);
        }
        catch (error) {
            console.error('Erro ao atualizar combo:', error);
            res.status(500).json({ error: 'Erro ao atualizar combo' });
        }
    },
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma_1.default.comboItem.deleteMany({
                where: { comboId: id }
            });
            await prisma_1.default.combo.delete({ where: { id } });
            res.json({ success: true });
        }
        catch (error) {
            console.error('Erro ao deletar combo:', error);
            res.status(500).json({ error: 'Erro ao deletar combo' });
        }
    },
    updateActive: async (req, res) => {
        try {
            const { id } = req.params;
            const { active } = req.body;
            const combo = await prisma_1.default.combo.update({
                where: { id },
                data: { active: Boolean(active) },
            });
            res.json(combo);
        }
        catch (error) {
            console.error('Erro ao atualizar status do combo:', error);
            res.status(500).json({ error: 'Erro ao atualizar status do combo' });
        }
    }
};
