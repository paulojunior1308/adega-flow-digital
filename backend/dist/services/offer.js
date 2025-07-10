"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleActive = exports.remove = exports.update = exports.create = exports.getById = exports.getAll = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getAll = async () => {
    return prisma_1.default.offer.findMany({
        include: {
            items: { include: { product: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};
exports.getAll = getAll;
const getById = async (id) => {
    return prisma_1.default.offer.findUnique({
        where: { id },
        include: {
            items: { include: { product: true } }
        }
    });
};
exports.getById = getById;
const create = async (data) => {
    const { name, description, price, image, items } = data;
    const offer = await prisma_1.default.offer.create({
        data: {
            name,
            description,
            price,
            image,
            items: {
                create: items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            }
        },
        include: {
            items: { include: { product: true } }
        }
    });
    return offer;
};
exports.create = create;
const update = async (id, data) => {
    const { name, description, price, image, items, active } = data;
    await prisma_1.default.offerItem.deleteMany({ where: { offerId: id } });
    const offer = await prisma_1.default.offer.update({
        where: { id },
        data: {
            name,
            description,
            price,
            image,
            active,
            items: {
                create: items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            }
        },
        include: {
            items: { include: { product: true } }
        }
    });
    return offer;
};
exports.update = update;
const remove = async (id) => {
    await prisma_1.default.offerItem.deleteMany({ where: { offerId: id } });
    await prisma_1.default.offer.delete({ where: { id } });
};
exports.remove = remove;
const toggleActive = async (id) => {
    const offer = await prisma_1.default.offer.findUnique({ where: { id } });
    if (!offer)
        throw new Error('Oferta não encontrada');
    return prisma_1.default.offer.update({
        where: { id },
        data: { active: !offer.active },
        include: {
            items: { include: { product: true } }
        }
    });
};
exports.toggleActive = toggleActive;
