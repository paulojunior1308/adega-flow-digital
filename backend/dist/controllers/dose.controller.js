"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.doseController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const cloudinary_1 = require("../utils/cloudinary");
exports.doseController = {
    async create(req, res) {
        try {
            const { name, description, price, items, categoryId } = req.body;
            let image = '';
            if (req.file) {
                image = await (0, cloudinary_1.uploadToCloudinary)(req.file);
            }
            const dose = await prisma_1.default.dose.create({
                data: {
                    name,
                    description,
                    price: parseFloat(price),
                    image,
                    categoryId: categoryId || null,
                    items: {
                        create: JSON.parse(items).map((item) => ({
                            productId: item.productId,
                            quantity: parseFloat(item.quantity),
                            allowFlavorSelection: !!item.allowFlavorSelection,
                            categoryId: item.categoryId || null,
                            discountBy: item.discountBy || 'unit',
                            nameFilter: item.nameFilter || null,
                            volumeToDiscount: item.volumeToDiscount ? parseFloat(item.volumeToDiscount) : null
                        }))
                    }
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    category: true
                }
            });
            console.log('Dose criada:', JSON.stringify(dose, null, 2));
            return res.json(dose);
        }
        catch (error) {
            console.error('Erro ao criar dose:', error);
            return res.status(500).json({ error: 'Erro ao criar dose' });
        }
    },
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, price, items, active, categoryId } = req.body;
            let image = '';
            const dose = await prisma_1.default.dose.findUnique({
                where: { id },
                include: { items: true }
            });
            if (!dose) {
                return res.status(404).json({ error: 'Dose não encontrada' });
            }
            if (req.file) {
                image = await (0, cloudinary_1.uploadToCloudinary)(req.file);
            }
            const updatedDose = await prisma_1.default.dose.update({
                where: { id },
                data: {
                    name,
                    description,
                    price: parseFloat(price),
                    image: image || dose.image,
                    active: active === 'true',
                    categoryId: categoryId || null,
                    items: {
                        deleteMany: {},
                        create: JSON.parse(items).map((item) => ({
                            productId: item.productId,
                            quantity: parseFloat(item.quantity),
                            allowFlavorSelection: !!item.allowFlavorSelection,
                            categoryId: item.categoryId || null,
                            discountBy: item.discountBy || 'unit',
                            nameFilter: item.nameFilter || null,
                            volumeToDiscount: item.volumeToDiscount ? parseFloat(item.volumeToDiscount) : null
                        }))
                    }
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    category: true
                }
            });
            console.log('Dose atualizada:', JSON.stringify(updatedDose, null, 2));
            return res.json(updatedDose);
        }
        catch (error) {
            console.error('Erro ao atualizar dose:', error);
            return res.status(500).json({ error: 'Erro ao atualizar dose' });
        }
    },
    async delete(req, res) {
        try {
            const { id } = req.params;
            const dose = await prisma_1.default.dose.findUnique({
                where: { id }
            });
            if (!dose) {
                return res.status(404).json({ error: 'Dose não encontrada' });
            }
            await prisma_1.default.doseItem.deleteMany({ where: { doseId: id } });
            await prisma_1.default.dose.delete({ where: { id } });
            return res.status(204).send();
        }
        catch (error) {
            console.error('Erro ao excluir dose:', error);
            return res.status(500).json({ error: 'Erro ao excluir dose' });
        }
    },
    async list(req, res) {
        try {
            const doses = await prisma_1.default.dose.findMany({
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    category: true
                }
            });
            return res.json(doses);
        }
        catch (error) {
            console.error('Erro ao listar doses:', error);
            return res.status(500).json({ error: 'Erro ao listar doses' });
        }
    },
    async getById(req, res) {
        try {
            const { id } = req.params;
            const dose = await prisma_1.default.dose.findUnique({
                where: { id },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    category: true
                }
            });
            if (!dose) {
                return res.status(404).json({ error: 'Dose não encontrada' });
            }
            return res.json(dose);
        }
        catch (error) {
            console.error('Erro ao buscar dose:', error);
            return res.status(500).json({ error: 'Erro ao buscar dose' });
        }
    }
};
