"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../config/errorHandler");
const socketInstance_1 = require("../config/socketInstance");
const STORE_LOCATION = {
    lat: -23.75516809248333,
    lng: -46.69815114446251
};
function calculateDistance(lat1, lng1, lat2, lng2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function calculateDeliveryFee(distanceKm) {
    if (distanceKm <= 2)
        return 3;
    return 3 + (distanceKm - 2) * 1.5;
}
exports.orderController = {
    create: async (req, res) => {
        const userId = req.user.id;
        const { addressId, paymentMethodId, instructions } = req.body;
        console.log('paymentMethodId recebido:', paymentMethodId);
        const paymentMethod = await prisma_1.default.paymentMethod.findUnique({ where: { id: paymentMethodId } });
        console.log('paymentMethod encontrado:', paymentMethod);
        if (!paymentMethod) {
            return res.status(400).json({ error: 'Forma de pagamento inválida' });
        }
        if (!addressId) {
            return res.status(400).json({ error: 'Endereço de entrega é obrigatório' });
        }
        const address = await prisma_1.default.address.findUnique({
            where: { id: addressId },
        });
        if (!address || address.userId !== userId) {
            return res.status(400).json({ error: 'Endereço inválido' });
        }
        const addressLat = address.lat;
        const addressLng = address.lng;
        if (typeof addressLat !== 'number' || typeof addressLng !== 'number') {
            return res.status(400).json({ error: 'Endereço do cliente sem coordenadas (lat/lng).' });
        }
        console.log('Coordenadas loja:', STORE_LOCATION);
        console.log('Coordenadas cliente:', addressLat, addressLng);
        const distanceKm = calculateDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, addressLat, addressLng);
        console.log('Distância calculada (km):', distanceKm);
        const deliveryFee = Math.round((calculateDeliveryFee(distanceKm) + Number.EPSILON) * 100) / 100;
        console.log('Taxa de entrega calculada:', deliveryFee);
        const cart = await prisma_1.default.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true } } },
        });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Carrinho vazio' });
        }
        for (const item of cart.items) {
            const produto = await prisma_1.default.product.findUnique({ where: { id: item.productId } });
            if (!produto) {
                return res.status(400).json({ error: `Produto não encontrado: ${item.productId}` });
            }
            if ((produto.stock || 0) < item.quantity) {
                return res.status(400).json({ error: `Estoque insuficiente para o produto '${produto.name}'.` });
            }
        }
        const totalProdutos = cart.items.reduce((sum, item) => { var _a; return sum + ((_a = item.price) !== null && _a !== void 0 ? _a : item.product.price) * item.quantity; }, 0);
        const total = totalProdutos + deliveryFee;
        let order;
        if (paymentMethod.name.toLowerCase().includes('pix')) {
            order = await prisma_1.default.order.create({
                data: {
                    userId,
                    addressId,
                    paymentMethodId,
                    total,
                    instructions,
                    deliveryFee: deliveryFee,
                    status: 'PENDING',
                    items: {
                        create: cart.items.map((item) => {
                            var _a;
                            return ({
                                productId: item.productId,
                                quantity: item.quantity,
                                price: (_a = item.price) !== null && _a !== void 0 ? _a : item.product.price,
                            });
                        }),
                    },
                },
                include: {
                    items: { include: { product: true } },
                    address: true,
                    user: { select: { name: true, email: true } }
                },
            });
        }
        else {
            order = await prisma_1.default.order.create({
                data: {
                    userId,
                    addressId,
                    paymentMethodId,
                    total,
                    instructions,
                    deliveryFee: deliveryFee,
                    items: {
                        create: cart.items.map((item) => {
                            var _a;
                            return ({
                                productId: item.productId,
                                quantity: item.quantity,
                                price: (_a = item.price) !== null && _a !== void 0 ? _a : item.product.price,
                            });
                        }),
                    },
                },
                include: {
                    items: { include: { product: true } },
                    address: true,
                    user: { select: { name: true, email: true } }
                },
            });
            const io = (0, socketInstance_1.getSocketInstance)();
            if (io) {
                io.emit('new-order', { order });
            }
        }
        await prisma_1.default.cartItem.deleteMany({ where: { cartId: cart.id } });
        res.status(201).json(order);
    },
    list: async (req, res) => {
        const userId = req.user.id;
        const orders = await prisma_1.default.order.findMany({
            where: { userId },
            include: { items: { include: { product: true } }, address: true },
            orderBy: { createdAt: 'desc' },
        });
        const formatted = orders.map((order) => (Object.assign(Object.assign({}, order), { products: order.items.map((item) => ({
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
                image: item.product.image || '',
            })) })));
        res.json(formatted);
    },
    adminList: async (req, res) => {
        const orders = await prisma_1.default.order.findMany({
            include: {
                user: { select: { id: true, name: true, email: true } },
                items: { include: { product: true } },
                address: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    },
    updateStatus: async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        const statusMap = {
            pending: 'PENDING',
            preparing: 'PREPARING',
            delivering: 'DELIVERING',
            delivered: 'DELIVERED',
            cancelled: 'CANCELLED',
            confirmed: 'CONFIRMED',
        };
        const statusEnum = statusMap[String(status)];
        if (!statusEnum) {
            throw new errorHandler_1.AppError('Status inválido', 400);
        }
        const order = await prisma_1.default.order.update({
            where: { id },
            data: { status: statusEnum },
            include: { items: { include: { product: true } }, address: true },
        });
        if (statusEnum === 'DELIVERED') {
            if (order.items && Array.isArray(order.items)) {
                for (const item of order.items) {
                    if (item.productId) {
                        await prisma_1.default.product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.quantity } }
                        });
                    }
                }
            }
        }
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.to(order.userId).emit('order-updated', { order });
        }
        res.json(order);
    },
    updateLocation: async (req, res) => {
        const { id } = req.params;
        const { deliveryLat, deliveryLng } = req.body;
        const order = await prisma_1.default.order.update({
            where: { id },
            data: { deliveryLat, deliveryLng },
            include: { items: { include: { product: true } }, address: true },
        });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.to(order.userId).emit('order-updated', { order });
        }
        res.json(order);
    },
    motoboyList: async (req, res) => {
        const orders = await prisma_1.default.order.findMany({
            where: { status: 'DELIVERING' },
            include: {
                items: { include: { product: true } },
                address: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const formatted = orders.map((order) => ({
            id: order.id,
            status: order.status,
            address: `${order.address.title} - ${order.address.street}, ${order.address.number}${order.address.complement ? ' ' + order.address.complement : ''}, ${order.address.neighborhood}, ${order.address.city} - ${order.address.state}, CEP: ${order.address.zipcode}`,
            products: order.items.map((item) => {
                var _a, _b;
                return ({
                    name: (_b = (_a = item.product) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '',
                    quantity: item.quantity
                });
            }),
            createdAt: order.createdAt,
            total: order.total
        }));
        res.json(formatted);
    },
    motoboyUpdateStatus: async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        if (status !== 'delivered' && status !== 'DELIVERED') {
            return res.status(403).json({ error: 'Motoboy só pode marcar como entregue.' });
        }
        const order = await prisma_1.default.order.update({
            where: { id },
            data: { status: 'DELIVERED' },
            include: { items: { include: { product: true } }, address: true },
        });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.to(order.userId).emit('order-updated', { order });
        }
        res.json(order);
    },
    calculateDeliveryFee: async (req, res) => {
        const { addressId } = req.body;
        if (!addressId) {
            return res.status(400).json({ error: 'Endereço de entrega é obrigatório' });
        }
        const userId = req.user.id;
        const address = await prisma_1.default.address.findUnique({ where: { id: addressId } });
        if (!address || address.userId !== userId) {
            return res.status(400).json({ error: 'Endereço inválido' });
        }
        const addressLat = address.lat;
        const addressLng = address.lng;
        if (typeof addressLat !== 'number' || typeof addressLng !== 'number') {
            return res.status(400).json({ error: 'Endereço do cliente sem coordenadas (lat/lng).' });
        }
        console.log('Coordenadas loja:', STORE_LOCATION);
        console.log('Coordenadas cliente:', addressLat, addressLng);
        const distanceKm = calculateDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, addressLat, addressLng);
        console.log('Distância calculada (km):', distanceKm);
        const deliveryFee = Math.round((calculateDeliveryFee(distanceKm) + Number.EPSILON) * 100) / 100;
        console.log('Taxa de entrega calculada:', deliveryFee);
        res.json({ deliveryFee });
    },
    approvePixPayment: async (req, res) => {
        const userId = req.user.id;
        const { orderId } = req.body;
        const order = await prisma_1.default.order.findUnique({ where: { id: orderId } });
        if (!order || order.userId !== userId) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }
        const updatedOrder = await prisma_1.default.order.update({
            where: { id: orderId },
            data: { status: 'CONFIRMED' },
            include: { items: { include: { product: true } }, address: true, user: { select: { name: true, email: true } } }
        });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.emit('new-order', { order: updatedOrder });
        }
        res.json({ success: true, order: updatedOrder });
    },
};
