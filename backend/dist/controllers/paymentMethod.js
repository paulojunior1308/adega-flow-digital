"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethodController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
exports.paymentMethodController = {
    list: async (req, res) => {
        const methods = await prisma_1.default.paymentMethod.findMany({ orderBy: { name: 'asc' } });
        res.json(methods);
    },
    create: async (req, res) => {
        const { name, active } = req.body;
        const method = await prisma_1.default.paymentMethod.create({ data: { name, active } });
        res.json(method);
    },
    update: async (req, res) => {
        const { id } = req.params;
        const { name, active } = req.body;
        const method = await prisma_1.default.paymentMethod.update({ where: { id }, data: { name, active } });
        res.json(method);
    },
    delete: async (req, res) => {
        const { id } = req.params;
        await prisma_1.default.paymentMethod.delete({ where: { id } });
        res.json({ success: true });
    },
    get: async (req, res) => {
        const { id } = req.params;
        const method = await prisma_1.default.paymentMethod.findUnique({ where: { id } });
        res.json(method);
    },
};
