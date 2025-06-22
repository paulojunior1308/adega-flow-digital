"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../config/prisma"));
const router = express_1.default.Router();
router.get('/payment-methods', async (req, res) => {
    const methods = await prisma_1.default.paymentMethod.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    res.json(methods);
});
router.get('/products', async (req, res) => {
    try {
        const { categoryId, search, nameFilter } = req.query;
        const where = { active: true, stock: { gt: 0 } };
        if (categoryId)
            where.categoryId = categoryId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (nameFilter) {
            where.name = { contains: nameFilter, mode: 'insensitive' };
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
        console.error('Erro ao listar produtos públicos:', error);
        res.status(500).json({ error: 'Erro ao listar produtos' });
    }
});
router.get('/products/categories', async (req, res) => {
    try {
        const categories = await prisma_1.default.category.findMany({
            where: { active: true },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    }
    catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ error: 'Erro ao listar categorias' });
    }
});
router.get('/promotions', async (req, res) => {
    try {
        const promotions = await prisma_1.default.promotion.findMany({
            where: { active: true },
            include: {
                products: {
                    include: {
                        category: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(promotions);
    }
    catch (error) {
        console.error('Erro ao listar promoções:', error);
        res.status(500).json({ error: 'Erro ao listar promoções' });
    }
});
router.get('/combos', async (req, res) => {
    try {
        const combos = await prisma_1.default.combo.findMany({
            where: { active: true },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                category: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(combos);
    }
    catch (error) {
        console.error('Erro ao listar combos:', error);
        res.status(500).json({ error: 'Erro ao listar combos' });
    }
});
router.get('/doses', async (req, res) => {
    try {
        const doses = await prisma_1.default.dose.findMany({
            where: { active: true },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                category: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(doses);
    }
    catch (error) {
        console.error('Erro ao listar doses:', error);
        res.status(500).json({ error: 'Erro ao listar doses' });
    }
});
exports.default = router;
