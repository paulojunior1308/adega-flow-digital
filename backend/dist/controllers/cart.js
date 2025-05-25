"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../config/errorHandler");
exports.cartController = {
    getCart: async (req, res) => {
        const userId = req.user.id;
        let cart = await prisma_1.default.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        if (!cart) {
            const createdCart = await prisma_1.default.cart.create({ data: { userId } });
            cart = Object.assign(Object.assign({}, createdCart), { items: [] });
        }
        res.json(cart);
    },
    addItem: async (req, res) => {
        const userId = req.user.id;
        let { productId, comboId, quantity, price } = req.body;
        quantity = quantity || 1;
        let cart = await prisma_1.default.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await prisma_1.default.cart.create({ data: { userId } });
        }
        if (comboId) {
            const combo = await prisma_1.default.combo.findUnique({
                where: { id: comboId },
                include: { items: true }
            });
            if (!combo) {
                throw new errorHandler_1.AppError('Combo não encontrado', 404);
            }
            const createdItems = [];
            const choosableSelections = req.body.choosableSelections || {};
            console.log('Recebido choosableSelections:', JSON.stringify(choosableSelections));
            for (const comboItem of combo.items) {
                if (comboItem.allowFlavorSelection && comboItem.categoryId) {
                    const selections = choosableSelections[comboItem.categoryId] || {};
                    for (const [productId, qty] of Object.entries(selections)) {
                        const quantityNumber = Number(qty);
                        if (quantityNumber > 0) {
                            console.log('Buscando produto', productId);
                            const existing = await prisma_1.default.cartItem.findFirst({
                                where: { cartId: cart.id, productId, comboId },
                            });
                            const customPrice = req.body.priceByProduct && req.body.priceByProduct[productId];
                            if (existing) {
                                const updated = await prisma_1.default.cartItem.update({
                                    where: { id: existing.id },
                                    data: Object.assign({ quantity: existing.quantity + quantityNumber * quantity }, (customPrice !== undefined ? { price: customPrice } : {})),
                                });
                                createdItems.push(updated);
                            }
                            else {
                                const item = await prisma_1.default.cartItem.create({
                                    data: Object.assign({ cartId: cart.id, productId, quantity: quantityNumber * quantity, comboId }, (customPrice !== undefined ? { price: customPrice } : {})),
                                    include: { product: true },
                                });
                                createdItems.push(item);
                            }
                        }
                    }
                }
                else {
                    const existing = await prisma_1.default.cartItem.findFirst({
                        where: { cartId: cart.id, productId: comboItem.productId, comboId },
                    });
                    const customPrice = req.body.priceByProduct && req.body.priceByProduct[comboItem.productId];
                    if (existing) {
                        const updated = await prisma_1.default.cartItem.update({
                            where: { id: existing.id },
                            data: Object.assign({ quantity: existing.quantity + comboItem.quantity * quantity }, (customPrice !== undefined ? { price: customPrice } : {})),
                        });
                        createdItems.push(updated);
                    }
                    else {
                        const item = await prisma_1.default.cartItem.create({
                            data: Object.assign({ cartId: cart.id, productId: comboItem.productId, quantity: comboItem.quantity * quantity, comboId }, (customPrice !== undefined ? { price: customPrice } : {})),
                            include: { product: true },
                        });
                        createdItems.push(item);
                    }
                }
            }
            return res.status(201).json(createdItems);
        }
        productId = String(productId);
        const product = await prisma_1.default.product.findUnique({ where: { id: productId } });
        if (!product) {
            console.error('Produto não encontrado no banco:', productId);
            throw new errorHandler_1.AppError('Produto não encontrado', 404);
        }
        const item = await prisma_1.default.cartItem.create({
            data: Object.assign({ cartId: cart.id, productId,
                quantity, comboId: null }, (price !== undefined ? { price } : {})),
            include: { product: true },
        });
        res.status(201).json(item);
    },
    updateItem: async (req, res) => {
        const userId = req.user.id;
        const { itemId } = req.params;
        const { quantity } = req.body;
        const item = await prisma_1.default.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
        if (!item || item.cart.userId !== userId) {
            throw new errorHandler_1.AppError('Item não encontrado', 404);
        }
        const updated = await prisma_1.default.cartItem.update({
            where: { id: itemId },
            data: { quantity },
            include: { product: true },
        });
        res.json(updated);
    },
    removeItem: async (req, res) => {
        const userId = req.user.id;
        const { itemId } = req.params;
        const item = await prisma_1.default.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
        if (!item || item.cart.userId !== userId) {
            throw new errorHandler_1.AppError('Item não encontrado', 404);
        }
        console.log('Removendo item do carrinho:', { id: item.id, productId: item.productId, comboId: item.comboId });
        if (item.comboId) {
            await prisma_1.default.cartItem.deleteMany({ where: { cartId: item.cartId, comboId: item.comboId } });
            return res.json({ message: 'Combo removido do carrinho.' });
        }
        await prisma_1.default.cartItem.delete({ where: { id: itemId } });
        res.json({ message: 'Item removido do carrinho' });
    },
};
