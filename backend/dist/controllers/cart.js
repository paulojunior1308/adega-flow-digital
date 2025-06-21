"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../config/errorHandler");
const uuid_1 = require("uuid");
exports.cartController = {
    getCart: async (req, res) => {
        const userId = req.user.id;
        let cart = await prisma_1.default.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                        combo: true,
                        dose: {
                            include: {
                                items: {
                                    include: {
                                        product: true
                                    }
                                }
                            }
                        }
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
        let { productId, comboId, doseId, quantity, price, choosableSelections } = req.body;
        quantity = quantity || 1;
        let cart = await prisma_1.default.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await prisma_1.default.cart.create({ data: { userId } });
        }
        if (doseId) {
            console.log('[CART][LOG] Adicionando dose ao carrinho. Payload:', req.body);
            const dose = await prisma_1.default.dose.findUnique({
                where: { id: doseId },
                include: { items: { include: { product: true } } }
            });
            console.log('[CART][LOG] Dose encontrada:', JSON.stringify(dose, null, 2));
            if (!dose) {
                throw new errorHandler_1.AppError('Dose não encontrada', 404);
            }
            const doseInstanceId = (0, uuid_1.v4)();
            const createdItems = [];
            for (const doseItem of dose.items) {
                const item = await prisma_1.default.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: doseItem.productId,
                        quantity: doseItem.quantity * quantity,
                        doseId,
                        doseInstanceId,
                        price: dose.price,
                    },
                    include: { product: true },
                });
                createdItems.push(item);
            }
            return res.status(201).json(createdItems);
        }
        if (comboId) {
            console.log('[CART][LOG] Adicionando combo ao carrinho. Payload:', req.body);
            const combo = await prisma_1.default.combo.findUnique({ where: { id: comboId }, include: { items: { include: { product: true } } } });
            console.log('[CART][LOG] Combo encontrado:', JSON.stringify(combo, null, 2));
            if (!combo) {
                throw new errorHandler_1.AppError('Combo não encontrado', 404);
            }
            const createdItems = [];
            const choosableSelections = req.body.choosableSelections || {};
            console.log('Recebido choosableSelections:', JSON.stringify(choosableSelections));
            const comboInstanceId = (0, uuid_1.v4)();
            for (const comboItem of combo.items) {
                if (comboItem.allowFlavorSelection && comboItem.categoryId) {
                    const selections = choosableSelections[comboItem.categoryId] || {};
                    for (const [productId, qty] of Object.entries(selections)) {
                        const quantityNumber = Number(qty);
                        if (quantityNumber > 0) {
                            console.log('Buscando produto', productId);
                            const customPrice = req.body.priceByProduct && req.body.priceByProduct[productId];
                            const item = await prisma_1.default.cartItem.create({
                                data: Object.assign({ cartId: cart.id, productId, quantity: quantityNumber * quantity, comboId,
                                    comboInstanceId }, (customPrice !== undefined ? { price: customPrice } : {})),
                                include: { product: true },
                            });
                            createdItems.push(item);
                        }
                    }
                }
                else {
                    const customPrice = req.body.priceByProduct && req.body.priceByProduct[comboItem.productId];
                    const item = await prisma_1.default.cartItem.create({
                        data: Object.assign({ cartId: cart.id, productId: comboItem.productId, quantity: comboItem.quantity * quantity, comboId,
                            comboInstanceId }, (customPrice !== undefined ? { price: customPrice } : {})),
                        include: { product: true },
                    });
                    createdItems.push(item);
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
        const existing = await prisma_1.default.cartItem.findFirst({
            where: { cartId: cart.id, productId, comboId: null },
        });
        const totalQuantity = ((existing === null || existing === void 0 ? void 0 : existing.quantity) || 0) + quantity;
        if (product.isFractioned) {
            if (totalQuantity > (product.totalVolume || 0)) {
                throw new errorHandler_1.AppError(`Estoque insuficiente. Só temos ${product.totalVolume} ml de ${product.name}.`, 400);
            }
        }
        else {
            if (totalQuantity > product.stock) {
                throw new errorHandler_1.AppError(`Estoque insuficiente. Só temos ${product.stock} unidade(s) de ${product.name}.`, 400);
            }
        }
        if (existing) {
            const updated = await prisma_1.default.cartItem.update({
                where: { id: existing.id },
                data: { quantity: totalQuantity },
                include: { product: true },
            });
            return res.status(201).json(updated);
        }
        else {
            const item = await prisma_1.default.cartItem.create({
                data: Object.assign({ cartId: cart.id, productId,
                    quantity, comboId: null }, (price !== undefined ? { price } : {})),
                include: { product: true },
            });
            return res.status(201).json(item);
        }
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
