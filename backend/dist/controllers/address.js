"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../config/errorHandler");
exports.addressController = {
    list: async (req, res) => {
        const userId = req.user.id;
        const addresses = await prisma_1.default.address.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' },
        });
        res.json(addresses);
    },
    create: async (req, res) => {
        const userId = req.user.id;
        const { title, street, number, complement, neighborhood, city, state, zipcode, isDefault, lat, lng } = req.body;
        if (isDefault) {
            await prisma_1.default.address.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }
        const address = await prisma_1.default.address.create({
            data: {
                userId,
                title,
                street,
                number,
                complement,
                neighborhood,
                city,
                state,
                zipcode,
                isDefault: !!isDefault,
                lat: lat ? parseFloat(lat) : null,
                lng: lng ? parseFloat(lng) : null,
            },
        });
        res.status(201).json(address);
    },
    update: async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, street, number, complement, neighborhood, city, state, zipcode, isDefault } = req.body;
        const address = await prisma_1.default.address.findUnique({ where: { id } });
        if (!address || address.userId !== userId) {
            throw new errorHandler_1.AppError('Endereço não encontrado', 404);
        }
        if (isDefault) {
            await prisma_1.default.address.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }
        const updated = await prisma_1.default.address.update({
            where: { id },
            data: {
                title,
                street,
                number,
                complement,
                neighborhood,
                city,
                state,
                zipcode,
                isDefault: !!isDefault,
            },
        });
        res.json(updated);
    },
    remove: async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;
        const address = await prisma_1.default.address.findUnique({ where: { id } });
        if (!address || address.userId !== userId) {
            throw new errorHandler_1.AppError('Endereço não encontrado', 404);
        }
        await prisma_1.default.address.delete({ where: { id } });
        res.json({ message: 'Endereço removido com sucesso' });
    },
};
