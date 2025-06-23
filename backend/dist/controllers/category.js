"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
exports.categoryController = {
    async list(req, res) {
        try {
            const { active } = req.query;
            const where = {};
            if (active !== undefined) {
                where.active = active === 'true';
            }
            const categories = await prisma_1.default.category.findMany({
                where,
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    active: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { products: true }
                    }
                }
            });
            console.log('Categorias retornadas do banco (com todos os campos):');
            categories.forEach(cat => {
                console.log(JSON.stringify(cat));
            });
            res.json(categories);
        }
        catch (error) {
            console.error('Erro ao listar categorias:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },
    async get(req, res) {
        try {
            const { id } = req.params;
            const category = await prisma_1.default.category.findUnique({
                where: { id },
                include: {
                    products: {
                        where: { active: true },
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            stock: true,
                            image: true
                        }
                    },
                    _count: {
                        select: { products: true }
                    }
                }
            });
            if (!category) {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }
            const categoryWithCount = Object.assign(Object.assign({}, category), { _count: category._count || { products: 0 } });
            res.json(categoryWithCount);
        }
        catch (error) {
            console.error('Erro ao buscar categoria:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },
    async create(req, res) {
        try {
            const { name, description, active = true } = req.body;
            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
            }
            const existingCategory = await prisma_1.default.category.findFirst({
                where: { name: { equals: name.trim(), mode: 'insensitive' } }
            });
            if (existingCategory) {
                return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
            }
            const category = await prisma_1.default.category.create({
                data: {
                    name: name.trim(),
                    description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
                    active: Boolean(active)
                }
            });
            res.status(201).json(category);
        }
        catch (error) {
            console.error('Erro ao criar categoria:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, active } = req.body;
            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
            }
            const existingCategory = await prisma_1.default.category.findUnique({
                where: { id }
            });
            if (!existingCategory) {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }
            const duplicateCategory = await prisma_1.default.category.findFirst({
                where: {
                    name: { equals: name.trim(), mode: 'insensitive' },
                    id: { not: id }
                }
            });
            if (duplicateCategory) {
                return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
            }
            const category = await prisma_1.default.category.update({
                where: { id },
                data: {
                    name: name.trim(),
                    description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
                    active: active !== undefined ? Boolean(active) : undefined
                }
            });
            res.json(category);
        }
        catch (error) {
            console.error('Erro ao atualizar categoria:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },
    async delete(req, res) {
        var _a;
        try {
            const { id } = req.params;
            const category = await prisma_1.default.category.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { products: true }
                    }
                }
            });
            if (!category) {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }
            const productCount = ((_a = category._count) === null || _a === void 0 ? void 0 : _a.products) || 0;
            if (productCount > 0) {
                return res.status(400).json({
                    error: 'Não é possível deletar uma categoria que possui produtos associados',
                    productCount
                });
            }
            await prisma_1.default.category.delete({
                where: { id }
            });
            res.json({ message: 'Categoria deletada com sucesso' });
        }
        catch (error) {
            console.error('Erro ao deletar categoria:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },
    async updateActive(req, res) {
        try {
            const { id } = req.params;
            const { active } = req.body;
            console.log(`Recebido PATCH para categoria ${id} com active=${active}`);
            const category = await prisma_1.default.category.update({
                where: { id },
                data: { active: Boolean(active) }
            });
            console.log('Categoria atualizada:', category);
            res.json(category);
        }
        catch (error) {
            console.error('Erro ao atualizar status da categoria:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
};
