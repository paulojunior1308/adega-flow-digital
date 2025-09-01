"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../config/errorHandler");
const socketInstance_1 = require("../config/socketInstance");
const stockStatus_1 = require("../utils/stockStatus");
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
        if (distanceKm > 5) {
            return res.status(400).json({ error: 'Desculpe, seu endereço está fora do alcance de entrega de 5km da loja.' });
        }
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
            if (produto.isFractioned) {
                let descontoPorVolume = false;
                if (item.doseId) {
                    const dose = await prisma_1.default.dose.findUnique({ where: { id: item.doseId }, include: { items: true } });
                    if (dose) {
                        const doseItem = dose.items.find(di => di.productId === item.productId);
                        if (doseItem && doseItem.discountBy === 'volume') {
                            descontoPorVolume = true;
                        }
                    }
                }
                if (descontoPorVolume) {
                    if ((produto.totalVolume || 0) < item.quantity) {
                        return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto '${produto.name}'.` });
                    }
                }
                else {
                    if ((produto.stock || 0) < item.quantity) {
                        return res.status(400).json({ error: `Estoque insuficiente para o produto '${produto.name}'.` });
                    }
                }
            }
            else {
                if ((produto.stock || 0) < item.quantity) {
                    return res.status(400).json({ error: `Estoque insuficiente para o produto '${produto.name}'.` });
                }
            }
        }
        const combosMap = {};
        const dosesMap = {};
        const avulsos = [];
        for (const item of cart.items) {
            const comboInstanceId = item.comboInstanceId;
            const doseInstanceId = item.doseInstanceId;
            if (comboInstanceId) {
                if (!combosMap[comboInstanceId])
                    combosMap[comboInstanceId] = [];
                combosMap[comboInstanceId].push(item);
            }
            else if (doseInstanceId) {
                if (!dosesMap[doseInstanceId])
                    dosesMap[doseInstanceId] = [];
                dosesMap[doseInstanceId].push(item);
            }
            else {
                avulsos.push(item);
            }
        }
        let totalCombos = 0;
        for (const comboItems of Object.values(combosMap)) {
            const comboId = comboItems[0].comboId;
            const combo = await prisma_1.default.combo.findUnique({ where: { id: comboId } });
            if (combo) {
                totalCombos += combo.price;
            }
        }
        let totalDoses = 0;
        for (const doseItems of Object.values(dosesMap)) {
            const doseId = doseItems[0].doseId;
            const dose = await prisma_1.default.dose.findUnique({ where: { id: doseId } });
            if (dose) {
                totalDoses += dose.price;
            }
        }
        const totalAvulsos = avulsos.reduce((sum, item) => {
            var _a, _b, _c;
            const valor = ((_a = item.price) !== null && _a !== void 0 ? _a : item.product.price) * item.quantity;
            console.log(`[AVULSO] Item ${item.id} (${(_b = item.product) === null || _b === void 0 ? void 0 : _b.name}): (price: ${(_c = item.price) !== null && _c !== void 0 ? _c : item.product.price}) x (qtd: ${item.quantity}) = ${valor}`);
            return sum + valor;
        }, 0);
        const totalProdutos = totalCombos + totalDoses + totalAvulsos;
        console.log('Subtotal dos combos:', totalCombos);
        console.log('Subtotal das doses:', totalDoses);
        console.log('Subtotal dos avulsos:', totalAvulsos);
        console.log('Subtotal dos produtos:', totalProdutos);
        console.log('Taxa de entrega:', deliveryFee);
        const total = totalProdutos + deliveryFee;
        console.log('Total final do pedido:', total);
        const isPix = paymentMethod.name && paymentMethod.name.toLowerCase().includes('pix');
        const order = await prisma_1.default.order.create({
            data: {
                userId,
                addressId,
                paymentMethodId,
                total,
                instructions,
                deliveryFee: deliveryFee,
                pixPaymentStatus: isPix ? 'PENDING' : undefined,
                deliveryLat: addressLat,
                deliveryLng: addressLng,
                items: {
                    create: await Promise.all(cart.items.map(async (item) => {
                        var _a;
                        const produto = await prisma_1.default.product.findUnique({ where: { id: item.productId } });
                        let quantityToRecord = item.quantity;
                        if ((produto === null || produto === void 0 ? void 0 : produto.isFractioned) && !item.doseId) {
                            quantityToRecord = produto.unitVolume || 1000;
                        }
                        return {
                            productId: item.productId,
                            quantity: quantityToRecord,
                            price: (_a = item.price) !== null && _a !== void 0 ? _a : item.product.price,
                            costPrice: (produto === null || produto === void 0 ? void 0 : produto.costPrice) || 0,
                            doseId: item.doseId || null,
                            choosableSelections: item.choosableSelections || null,
                            comboInstanceId: item.comboInstanceId || null,
                            doseInstanceId: item.doseInstanceId || null,
                        };
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                address: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            },
        });
        console.log('[ORDER][LOG] Pedido criado:', { id: order.id, createdAt: order.createdAt, status: order.status });
        console.log('[DEBUG][ORDER CREATE] Itens do pedido criados:', order.items.map(i => ({
            id: i.id,
            productId: i.productId,
            doseId: i.doseId,
            comboInstanceId: i.comboInstanceId,
            doseInstanceId: i.doseInstanceId,
            quantity: i.quantity,
            price: i.price
        })));
        await prisma_1.default.cartItem.deleteMany({ where: { cartId: cart.id } });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.emit('new-order', { order });
        }
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
                user: { select: { id: true, name: true, email: true, phone: true } },
                items: { include: { product: true } },
                address: true,
                paymentMethod: true,
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
            include: {
                items: {
                    include: {
                        product: true,
                        dose: {
                            include: {
                                items: {
                                    include: {
                                        product: true
                                    }
                                }
                            }
                        }
                    }
                },
                address: true
            },
        });
        if (statusEnum === 'DELIVERED') {
            console.log('[ORDER][LOG] Pedido marcado como entregue. Itens:', JSON.stringify(order.items, null, 2));
            console.log('[DEBUG][ORDER DELIVERED] Itens do pedido para processamento:', order.items.map(i => ({
                id: i.id,
                productId: i.productId,
                doseId: i.doseId,
                comboInstanceId: i.comboInstanceId,
                doseInstanceId: i.doseInstanceId,
                quantity: i.quantity,
                price: i.price
            })));
            const dosesMap = {};
            const combosMap = {};
            const outros = [];
            for (const item of order.items) {
                const doseInstanceId = item.doseInstanceId;
                const comboInstanceId = item.comboInstanceId;
                if (doseInstanceId) {
                    if (!dosesMap[doseInstanceId])
                        dosesMap[doseInstanceId] = [];
                    dosesMap[doseInstanceId].push(item);
                }
                else if (comboInstanceId) {
                    if (!combosMap[comboInstanceId])
                        combosMap[comboInstanceId] = [];
                    combosMap[comboInstanceId].push(item);
                }
                else {
                    outros.push(item);
                }
            }
            for (const comboItems of Object.values(combosMap)) {
                const item = comboItems[0];
                console.log('[DEBUG][COMBO] Processando comboInstanceId:', item.comboInstanceId);
                const comboInstanceId = item.comboInstanceId;
                const combos = await prisma_1.default.combo.findMany({
                    where: { active: true },
                    include: { items: true }
                });
                console.log('[DEBUG][COMBO] Total de combos ativos encontrados:', combos.length);
                let foundCombo = null;
                for (const combo of combos) {
                    const comboProductIds = combo.items.map(ci => ci.productId).sort();
                    const orderProductIds = comboItems.map(oi => oi.productId).sort();
                    console.log(`[DEBUG][COMBO] Comparando combo "${combo.name}" (ID: ${combo.id}):`);
                    console.log(`  - Produtos do combo: ${JSON.stringify(comboProductIds)}`);
                    console.log(`  - Produtos do pedido: ${JSON.stringify(orderProductIds)}`);
                    console.log(`  - Correspondem: ${JSON.stringify(comboProductIds) === JSON.stringify(orderProductIds)}`);
                    if (JSON.stringify(comboProductIds) === JSON.stringify(orderProductIds)) {
                        foundCombo = combo;
                        console.log(`[DEBUG][COMBO] Combo encontrado: ${combo.name} (ID: ${combo.id})`);
                        break;
                    }
                }
                if (foundCombo) {
                    console.log('[ORDER][LOG] Descontando estoque de combo:', foundCombo.id);
                    console.log('[DESCONTO ESTOQUE][COMBO] Composição do combo:', JSON.stringify(foundCombo.items, null, 2));
                    for (const comboItem of foundCombo.items) {
                        const produto = await prisma_1.default.product.findUnique({ where: { id: comboItem.productId } });
                        if (!produto) {
                            console.error('Produto do combo não encontrado:', comboItem.productId);
                            return res.status(400).json({ error: `Produto do combo não encontrado: ${comboItem.productId}` });
                        }
                        const quantidadeDescontada = Math.abs(Number(comboItem.quantity));
                        console.log(`[DEBUG][COMBO] Produto: ${produto.name}, isFractioned: ${produto.isFractioned}, quantidadeDescontada: ${quantidadeDescontada}`);
                        if (produto.isFractioned) {
                            const unitVolume = produto.unitVolume || 1000;
                            const volumeAtual = produto.totalVolume || 0;
                            const novoVolume = volumeAtual - unitVolume;
                            const novoEstoque = Math.floor(novoVolume / unitVolume);
                            console.log(`[COMBO][FRACIONADO] Produto: ${produto.name} | Volume atual: ${volumeAtual} | Descontar: ${unitVolume} ml (garrafa inteira) | Novo estoque: ${novoEstoque} | Novo volume: ${novoVolume}`);
                            if (novoVolume < 0) {
                                console.error(`[ERRO][COMBO][FRACIONADO] Estoque insuficiente para o produto: ${produto.name}`);
                                return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
                            }
                            const updatedProduct = await prisma_1.default.product.update({
                                where: { id: comboItem.productId },
                                data: {
                                    totalVolume: novoVolume,
                                    stock: novoEstoque
                                },
                                select: { stock: true, isFractioned: true, totalVolume: true }
                            });
                            await (0, stockStatus_1.updateProductStockStatusWithValues)(comboItem.productId, prisma_1.default, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                        }
                        else {
                            const estoqueAtual = produto.stock || 0;
                            const novoEstoque = estoqueAtual - quantidadeDescontada;
                            console.log(`[COMBO][NAO FRACIONADO] Produto: ${produto.name} | Estoque atual: ${estoqueAtual} | Descontar: ${quantidadeDescontada} un | Novo estoque: ${novoEstoque}`);
                            if (novoEstoque < 0) {
                                console.error(`[ERRO][COMBO][NAO FRACIONADO] Estoque insuficiente para o produto: ${produto.name}`);
                                return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
                            }
                            const updatedProduct = await prisma_1.default.product.update({
                                where: { id: comboItem.productId },
                                data: { stock: novoEstoque },
                                select: { stock: true, isFractioned: true, totalVolume: true }
                            });
                            await (0, stockStatus_1.updateProductStockStatusWithValues)(comboItem.productId, prisma_1.default, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                        }
                    }
                }
                else {
                    console.error('Combo não encontrado para comboInstanceId:', comboInstanceId);
                    console.log('[DEBUG][COMBO] Tratando itens como produtos avulsos...');
                    for (const orderItem of comboItems) {
                        const produto = await prisma_1.default.product.findUnique({ where: { id: orderItem.productId } });
                        if (!produto) {
                            console.error('Produto não encontrado:', orderItem.productId);
                            return res.status(400).json({ error: `Produto não encontrado: ${orderItem.productId}` });
                        }
                        const quantidade = orderItem.quantity;
                        console.log(`[DEBUG][AVULSO] Produto: ${produto.name}, isFractioned: ${produto.isFractioned}, quantidade: ${quantidade}`);
                        if (produto.isFractioned) {
                            const unitVolume = produto.unitVolume || 1000;
                            const volumeAtual = produto.totalVolume || 0;
                            const novoVolume = volumeAtual - unitVolume;
                            const novoEstoque = Math.floor(novoVolume / unitVolume);
                            console.log(`[AVULSO][FRACIONADO] Produto: ${produto.name} | Volume atual: ${volumeAtual} | Descontar: ${unitVolume} ml (garrafa inteira) | Novo estoque: ${novoEstoque} | Novo volume: ${novoVolume}`);
                            if (novoVolume < 0) {
                                console.error(`[ERRO][AVULSO][FRACIONADO] Estoque insuficiente para o produto: ${produto.name}`);
                                return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
                            }
                            const updatedProduct = await prisma_1.default.product.update({
                                where: { id: orderItem.productId },
                                data: {
                                    totalVolume: novoVolume,
                                    stock: novoEstoque
                                },
                                select: { stock: true, isFractioned: true, totalVolume: true }
                            });
                            await (0, stockStatus_1.updateProductStockStatusWithValues)(orderItem.productId, prisma_1.default, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                        }
                        else {
                            const estoqueAtual = produto.stock || 0;
                            const novoEstoque = estoqueAtual - quantidade;
                            console.log(`[AVULSO][NAO FRACIONADO] Produto: ${produto.name} | Estoque atual: ${estoqueAtual} | Descontar: ${quantidade} un | Novo estoque: ${novoEstoque}`);
                            if (novoEstoque < 0) {
                                console.error(`[ERRO][AVULSO][NAO FRACIONADO] Estoque insuficiente para o produto: ${produto.name}`);
                                return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
                            }
                            const updatedProduct = await prisma_1.default.product.update({
                                where: { id: orderItem.productId },
                                data: { stock: novoEstoque },
                                select: { stock: true, isFractioned: true, totalVolume: true }
                            });
                            await (0, stockStatus_1.updateProductStockStatusWithValues)(orderItem.productId, prisma_1.default, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                        }
                    }
                }
            }
            for (const doseItems of Object.values(dosesMap)) {
                const item = doseItems[0];
                console.log('[DEBUG][DOSE] Processando doseInstanceId:', item.doseInstanceId, 'doseId:', item.doseId);
                if (item.doseId) {
                    console.log('[ORDER][LOG] Descontando estoque de dose:', item.doseId);
                    const dose = await prisma_1.default.dose.findUnique({
                        where: { id: item.doseId },
                        include: { items: true }
                    });
                    if (!dose) {
                        console.error('Dose não encontrada:', item.doseId);
                        return res.status(400).json({ error: 'Dose não encontrada.' });
                    }
                    console.log('[DESCONTO ESTOQUE][DOSE] Composição da dose:', JSON.stringify(dose.items, null, 2));
                    for (const doseItem of dose.items) {
                        const produto = await prisma_1.default.product.findUnique({ where: { id: doseItem.productId } });
                        if (!produto) {
                            console.error('Produto da dose não encontrado:', doseItem.productId);
                            return res.status(400).json({ error: `Produto da dose não encontrado: ${doseItem.productId}` });
                        }
                        const quantidadeDescontada = Math.abs(Number(doseItem.quantity));
                        console.log(`[DEBUG][DOSE] Produto: ${produto.name}, isFractioned: ${produto.isFractioned}, discountBy: ${doseItem.discountBy}, quantidadeDescontada: ${quantidadeDescontada}`);
                        if (produto.isFractioned && doseItem.discountBy === 'volume') {
                            const volumeAtual = produto.totalVolume || 0;
                            const unitVolume = produto.unitVolume || 1;
                            const novoVolume = volumeAtual - quantidadeDescontada;
                            const novoEstoque = Math.floor(novoVolume / unitVolume);
                            console.log(`[DOSE][FRACIONADO][VOLUME][INSTANCIA] Produto: ${produto.name} | Volume atual: ${volumeAtual} | Descontar: ${quantidadeDescontada} ml | Novo estoque: ${novoEstoque} | Novo volume: ${novoVolume}`);
                            if (novoVolume < 0) {
                                console.error(`[ERRO][DOSE][FRACIONADO][VOLUME] Estoque insuficiente para o produto: ${produto.name}`);
                                return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
                            }
                            const updatedProduct = await prisma_1.default.product.update({
                                where: { id: doseItem.productId },
                                data: {
                                    totalVolume: novoVolume,
                                    stock: novoEstoque
                                },
                                select: { stock: true, isFractioned: true, totalVolume: true }
                            });
                            await (0, stockStatus_1.updateProductStockStatusWithValues)(doseItem.productId, prisma_1.default, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                        }
                        else {
                            const estoqueAtual = produto.stock || 0;
                            const novoEstoque = estoqueAtual - quantidadeDescontada;
                            console.log(`[DOSE][NAO FRACIONADO][INSTANCIA] Produto: ${produto.name} | Estoque atual: ${estoqueAtual} | Descontar: ${quantidadeDescontada} un | Novo estoque: ${novoEstoque}`);
                            if (novoEstoque < 0) {
                                console.error(`[ERRO][DOSE][NAO FRACIONADO] Estoque insuficiente para o produto: ${produto.name}`);
                                return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
                            }
                            const updatedProduct = await prisma_1.default.product.update({
                                where: { id: doseItem.productId },
                                data: { stock: novoEstoque },
                                select: { stock: true, isFractioned: true, totalVolume: true }
                            });
                            await (0, stockStatus_1.updateProductStockStatusWithValues)(doseItem.productId, prisma_1.default, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
                        }
                    }
                }
            }
            for (const item of outros) {
            }
            console.log('[ORDER][DELIVERED] Registrando saída de estoque em StockMovement...');
            for (const comboItems of Object.values(combosMap)) {
                const item = comboItems[0];
                const comboInstanceId = item.comboInstanceId;
                const combos = await prisma_1.default.combo.findMany({
                    where: { active: true },
                    include: { items: true }
                });
                let foundCombo = null;
                for (const combo of combos) {
                    const comboProductIds = combo.items.map(ci => ci.productId).sort();
                    const orderProductIds = comboItems.map(oi => oi.productId).sort();
                    if (JSON.stringify(comboProductIds) === JSON.stringify(orderProductIds)) {
                        foundCombo = combo;
                        break;
                    }
                }
                if (foundCombo) {
                    for (const comboItem of foundCombo.items) {
                        const produto = await prisma_1.default.product.findUnique({ where: { id: comboItem.productId } });
                        if (!produto)
                            continue;
                        const quantidadeDescontada = Math.abs(Number(comboItem.quantity));
                        const totalCost = (produto.costPrice || 0) * quantidadeDescontada;
                        await prisma_1.default.stockMovement.create({
                            data: {
                                productId: comboItem.productId,
                                type: 'out',
                                quantity: quantidadeDescontada,
                                unitCost: produto.costPrice || 0,
                                totalCost,
                                notes: 'Entrega - Combo',
                                origin: 'entrega_online'
                            }
                        });
                    }
                }
                else {
                    for (const orderItem of comboItems) {
                        const produto = await prisma_1.default.product.findUnique({ where: { id: orderItem.productId } });
                        if (!produto)
                            continue;
                        const quantidade = orderItem.quantity;
                        const totalCost = (produto.costPrice || 0) * quantidade;
                        await prisma_1.default.stockMovement.create({
                            data: {
                                productId: orderItem.productId,
                                type: 'out',
                                quantity: quantidade,
                                unitCost: produto.costPrice || 0,
                                totalCost,
                                notes: 'Entrega - Produto Avulso',
                                origin: 'entrega_online'
                            }
                        });
                    }
                }
            }
            for (const doseItems of Object.values(dosesMap)) {
                const item = doseItems[0];
                if (item.doseId) {
                    const dose = await prisma_1.default.dose.findUnique({
                        where: { id: item.doseId },
                        include: { items: true }
                    });
                    if (dose) {
                        for (const doseItem of dose.items) {
                            const produto = await prisma_1.default.product.findUnique({ where: { id: doseItem.productId } });
                            if (!produto)
                                continue;
                            const quantidadeDescontada = Math.abs(Number(doseItem.quantity));
                            const totalCost = (produto.costPrice || 0) * quantidadeDescontada;
                            await prisma_1.default.stockMovement.create({
                                data: {
                                    productId: doseItem.productId,
                                    type: 'out',
                                    quantity: quantidadeDescontada,
                                    unitCost: produto.costPrice || 0,
                                    totalCost,
                                    notes: 'Entrega - Dose',
                                    origin: 'entrega_online'
                                }
                            });
                        }
                    }
                }
            }
            for (const item of outros) {
                const produto = await prisma_1.default.product.findUnique({ where: { id: item.productId } });
                if (!produto)
                    continue;
                const quantidade = item.quantity;
                const totalCost = (produto.costPrice || 0) * quantidade;
                await prisma_1.default.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: 'out',
                        quantity: quantidade,
                        unitCost: produto.costPrice || 0,
                        totalCost,
                        notes: 'Entrega - Produto Avulso',
                        origin: 'entrega_online'
                    }
                });
            }
        }
        const statusMessages = {
            PENDING: 'Seu pedido foi recebido e está aguardando confirmação.',
            CONFIRMED: 'Seu pedido foi confirmado!',
            PREPARING: 'Seu pedido está sendo preparado.',
            DELIVERING: 'Seu pedido saiu para entrega!',
            DELIVERED: 'Seu pedido foi entregue!',
            CANCELLED: 'Seu pedido foi cancelado.'
        };
        const message = statusMessages[statusEnum] || `Status do pedido atualizado: ${statusEnum}`;
        const notification = await prisma_1.default.notification.create({
            data: {
                userId: order.userId,
                orderId: order.id,
                message,
            }
        });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.to(order.userId).emit('order-notification', { notification });
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
    updatePixStatus: async (req, res) => {
        const { id } = req.params;
        const { pixPaymentStatus } = req.body;
        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(pixPaymentStatus)) {
            return res.status(400).json({ error: 'Status PIX inválido.' });
        }
        const order = await prisma_1.default.order.update({
            where: { id },
            data: { pixPaymentStatus: pixPaymentStatus },
            include: { items: { include: { product: true } }, address: true },
        });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.to(order.userId).emit('order-updated', { order });
        }
        res.json(order);
    },
};
