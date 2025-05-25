"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
exports.supplierController = {
    list: async (req, res) => {
        const { search } = req.query;
        const where = search
            ? {
                OR: [
                    { name: { contains: String(search), mode: client_1.Prisma.QueryMode.insensitive } },
                    { email: { contains: String(search), mode: client_1.Prisma.QueryMode.insensitive } },
                    { phone: { contains: String(search), mode: client_1.Prisma.QueryMode.insensitive } },
                    { document: { contains: String(search), mode: client_1.Prisma.QueryMode.insensitive } },
                    { address: { contains: String(search), mode: client_1.Prisma.QueryMode.insensitive } },
                ],
            }
            : {};
        const suppliers = await prisma_1.default.supplier.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        res.json(suppliers);
    },
    create: async (req, res) => {
        var _a, _b;
        const { name, email, phone, document, address } = req.body;
        try {
            const supplier = await prisma_1.default.supplier.create({
                data: { name, email, phone, document, address },
            });
            res.json(supplier);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && ((_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('email'))) {
                return res.status(400).json({ error: 'Já existe um fornecedor cadastrado com este e-mail.' });
            }
            throw error;
        }
    },
    update: async (req, res) => {
        const { id } = req.params;
        const { name, email, phone, document, address, active } = req.body;
        const supplier = await prisma_1.default.supplier.update({
            where: { id },
            data: { name, email, phone, document, address, active },
        });
        res.json(supplier);
    },
    delete: async (req, res) => {
        const { id } = req.params;
        await prisma_1.default.supplier.delete({ where: { id } });
        res.json({ success: true });
    },
    get: async (req, res) => {
        const { id } = req.params;
        const supplier = await prisma_1.default.supplier.findUnique({ where: { id } });
        res.json(supplier);
    },
};
