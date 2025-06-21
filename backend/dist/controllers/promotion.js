"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
exports.promotionController = {
    list: async (req, res) => {
        try {
            const promotions = await prisma_1.default.promotion.findMany({
                include: {
                    products: {
                        include: {
                            category: true
                        }
                    }
                }
            });
            res.json(promotions);
        }
        catch (error) {
            console.error('Erro ao listar promoções:', error);
            res.status(500).json({ error: 'Erro ao listar promoções' });
        }
    },
    create: async (req, res) => {
        try {
            const { name, description, price, originalPrice, productIds, image } = req.body;
            const promotion = await prisma_1.default.promotion.create({
                data: {
                    name,
                    description,
                    price: parseFloat(price),
                    originalPrice: parseFloat(originalPrice),
                    image: image || undefined,
                    products: {
                        connect: JSON.parse(productIds).map((id) => ({ id }))
                    }
                },
                include: {
                    products: {
                        include: {
                            category: true
                        }
                    }
                }
            });
            res.json(promotion);
        }
        catch (error) {
            console.error('Erro ao criar promoção:', error);
            res.status(500).json({ error: 'Erro ao criar promoção' });
        }
    },
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, price, originalPrice, productIds, active, image } = req.body;
            const promotion = await prisma_1.default.promotion.update({
                where: { id },
                data: {
                    name,
                    description,
                    price: parseFloat(price),
                    originalPrice: parseFloat(originalPrice),
                    active: active === 'true',
                    image: image || undefined,
                    products: {
                        set: JSON.parse(productIds).map((id) => ({ id }))
                    }
                },
                include: {
                    products: {
                        include: {
                            category: true
                        }
                    }
                }
            });
            res.json(promotion);
        }
        catch (error) {
            console.error('Erro ao atualizar promoção:', error);
            res.status(500).json({ error: 'Erro ao atualizar promoção' });
        }
    },
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma_1.default.promotion.delete({ where: { id } });
            res.json({ success: true });
        }
        catch (error) {
            console.error('Erro ao deletar promoção:', error);
            res.status(500).json({ error: 'Erro ao deletar promoção' });
        }
    }
};
