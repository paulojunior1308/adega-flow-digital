"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comandaController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../config/errorHandler");
const socketInstance_1 = require("../config/socketInstance");
const uuid_1 = require("uuid");
exports.comandaController = {
    create: async (req, res) => {
        const { customerName, tableNumber } = req.body;
        const userId = req.user.id;
        if (!(customerName === null || customerName === void 0 ? void 0 : customerName.trim())) {
            throw new errorHandler_1.AppError('Nome do cliente é obrigatório', 400);
        }
        const lastComanda = await prisma_1.default.comanda.findFirst({
            orderBy: { number: 'desc' }
        });
        const nextNumber = ((lastComanda === null || lastComanda === void 0 ? void 0 : lastComanda.number) || 0) + 1;
        const comanda = await prisma_1.default.comanda.create({
            data: {
                number: nextNumber,
                customerName: customerName.trim(),
                tableNumber: (tableNumber === null || tableNumber === void 0 ? void 0 : tableNumber.trim()) || null,
                createdBy: userId,
                total: 0
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.emit('comanda-created', { comanda });
        }
        res.status(201).json(comanda);
    },
    list: async (req, res) => {
        const comandas = await prisma_1.default.comanda.findMany({
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(comandas);
    },
    getById: async (req, res) => {
        const { id } = req.params;
        const comanda = await prisma_1.default.comanda.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });
        if (!comanda) {
            throw new errorHandler_1.AppError('Comanda não encontrada', 404);
        }
        console.log('[DEBUG] Itens da comanda (GET):', comanda.items.map(i => ({
            id: i.id,
            name: i.name,
            productId: i.productId,
            comboInstanceId: i.comboInstanceId
        })));
        res.json(comanda);
    },
    addItem: async (req, res) => {
        console.log('[DEBUG] req.body recebido em addItem:', req.body);
        const { comandaId } = req.params;
        const { productId, comboId, doseId, offerId, quantity, price, name, code, isDoseItem, isFractioned, discountBy, choosableSelections } = req.body;
        const comanda = await prisma_1.default.comanda.findUnique({
            where: { id: comandaId },
            include: { items: true }
        });
        if (!comanda) {
            throw new errorHandler_1.AppError('Comanda não encontrada', 404);
        }
        if (!comanda.isOpen) {
            throw new errorHandler_1.AppError('Comanda está fechada', 400);
        }
        if (offerId) {
            const offer = await prisma_1.default.offer.findUnique({
                where: { id: offerId },
                include: { items: { include: { product: true } } }
            });
            if (!offer) {
                throw new errorHandler_1.AppError('Oferta não encontrada', 404);
            }
            const createdItems = [];
            for (const offerItem of offer.items) {
                const item = await prisma_1.default.comandaItem.create({
                    data: {
                        comandaId,
                        productId: offerItem.productId,
                        code: offerItem.product.sku || offerItem.product.barcode || offerItem.product.id.substring(0, 6),
                        name: `${offerItem.product.name} (Oferta: ${offer.name})`,
                        quantity: offerItem.quantity * (quantity || 1),
                        price: offer.price / offer.items.reduce((sum, item) => sum + item.quantity, 0),
                        total: (offer.price / offer.items.reduce((sum, item) => sum + item.quantity, 0)) * offerItem.quantity * (quantity || 1),
                        offerInstanceId: offerId
                    },
                    include: {
                        product: true
                    }
                });
                createdItems.push(item);
            }
            const newTotal = comanda.items.reduce((sum, item) => sum + item.total, 0) +
                createdItems.reduce((sum, item) => sum + item.total, 0);
            await prisma_1.default.comanda.update({
                where: { id: comandaId },
                data: { total: newTotal }
            });
            const updatedComanda = await prisma_1.default.comanda.findUnique({
                where: { id: comandaId },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    user: {
                        select: {
                            name: true
                        }
                    }
                }
            });
            const io = (0, socketInstance_1.getSocketInstance)();
            if (io) {
                io.emit('comanda-updated', { comanda: updatedComanda });
            }
            return res.json(updatedComanda);
        }
        if (doseId) {
            console.log('[COMANDA][LOG] Adicionando dose à comanda. Payload:', req.body);
            const dose = await prisma_1.default.dose.findUnique({
                where: { id: doseId },
                include: { items: { include: { product: true } } }
            });
            console.log('[COMANDA][LOG] Dose encontrada:', JSON.stringify(dose, null, 2));
            if (!dose) {
                throw new errorHandler_1.AppError('Dose não encontrada', 404);
            }
            const doseInstanceId = (0, uuid_1.v4)();
            const createdItems = [];
            for (const doseItem of dose.items) {
                const item = await prisma_1.default.comandaItem.create({
                    data: {
                        comandaId,
                        productId: doseItem.productId,
                        code: doseItem.product.sku || doseItem.product.barcode || doseItem.product.id.substring(0, 6),
                        name: `Dose ${dose.name} - ${doseItem.product.name}`,
                        quantity: doseItem.quantity * (quantity || 1),
                        price: dose.price / dose.items.reduce((sum, item) => sum + item.quantity, 0),
                        total: (dose.price / dose.items.reduce((sum, item) => sum + item.quantity, 0)) * doseItem.quantity * (quantity || 1),
                        isDoseItem: true,
                        isFractioned: doseItem.product.isFractioned,
                        discountBy: doseItem.product.isFractioned ? 'volume' : 'unit',
                        choosableSelections: choosableSelections || null
                    },
                    include: {
                        product: true
                    }
                });
                createdItems.push(item);
            }
            const newTotal = comanda.items.reduce((sum, item) => sum + item.total, 0) +
                createdItems.reduce((sum, item) => sum + item.total, 0);
            await prisma_1.default.comanda.update({
                where: { id: comandaId },
                data: { total: newTotal }
            });
            const updatedComanda = await prisma_1.default.comanda.findUnique({
                where: { id: comandaId },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    user: {
                        select: {
                            name: true
                        }
                    }
                }
            });
            const io = (0, socketInstance_1.getSocketInstance)();
            if (io) {
                io.emit('comanda-updated', { comanda: updatedComanda });
            }
            return res.json(updatedComanda);
        }
        if (comboId) {
            console.log('[COMANDA][LOG] Adicionando combo à comanda. Payload:', req.body);
            const combo = await prisma_1.default.combo.findUnique({
                where: { id: comboId },
                include: { items: { include: { product: true } } }
            });
            console.log('[COMANDA][LOG] Combo encontrado:', JSON.stringify(combo, null, 2));
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
                            const item = await prisma_1.default.comandaItem.create({
                                data: {
                                    comandaId,
                                    productId,
                                    code: comboItem.product.sku || comboItem.product.barcode || comboItem.product.id.substring(0, 6),
                                    name: `Combo ${combo.name} - ${comboItem.product.name}`,
                                    quantity: quantityNumber * (quantity || 1),
                                    price: customPrice !== undefined ? customPrice : (combo.price / combo.items.reduce((sum, item) => sum + item.quantity, 0)),
                                    total: (customPrice !== undefined ? customPrice : (combo.price / combo.items.reduce((sum, item) => sum + item.quantity, 0))) * quantityNumber * (quantity || 1),
                                    isDoseItem: false,
                                    isFractioned: comboItem.product.isFractioned,
                                    discountBy: comboItem.product.isFractioned ? 'volume' : 'unit',
                                    choosableSelections: choosableSelections || null
                                },
                                include: { product: true },
                            });
                            createdItems.push(item);
                        }
                    }
                }
                else {
                    const customPrice = req.body.priceByProduct && req.body.priceByProduct[comboItem.productId];
                    const item = await prisma_1.default.comandaItem.create({
                        data: {
                            comandaId,
                            productId: comboItem.productId,
                            code: comboItem.product.sku || comboItem.product.barcode || comboItem.product.id.substring(0, 6),
                            name: `Combo ${combo.name} - ${comboItem.product.name}`,
                            quantity: comboItem.quantity * (quantity || 1),
                            price: customPrice !== undefined ? customPrice : (combo.price / combo.items.reduce((sum, item) => sum + item.quantity, 0)),
                            total: (customPrice !== undefined ? customPrice : (combo.price / combo.items.reduce((sum, item) => sum + item.quantity, 0))) * comboItem.quantity * (quantity || 1),
                            isDoseItem: false,
                            isFractioned: comboItem.product.isFractioned,
                            discountBy: comboItem.product.isFractioned ? 'volume' : 'unit',
                            choosableSelections: choosableSelections || null
                        },
                        include: { product: true },
                    });
                    createdItems.push(item);
                }
            }
            const newTotal = comanda.items.reduce((sum, item) => sum + item.total, 0) +
                createdItems.reduce((sum, item) => sum + item.total, 0);
            await prisma_1.default.comanda.update({
                where: { id: comandaId },
                data: { total: newTotal }
            });
            const updatedComanda = await prisma_1.default.comanda.findUnique({
                where: { id: comandaId },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    user: {
                        select: {
                            name: true
                        }
                    }
                }
            });
            const io = (0, socketInstance_1.getSocketInstance)();
            if (io) {
                io.emit('comanda-updated', { comanda: updatedComanda });
            }
            return res.json(updatedComanda);
        }
        if (!productId || !quantity || !price || !name || !code) {
            throw new errorHandler_1.AppError('Dados do item são obrigatórios', 400);
        }
        const item = await prisma_1.default.comandaItem.create({
            data: {
                comandaId,
                productId,
                code,
                name,
                quantity,
                price,
                total: price * quantity,
                isDoseItem: isDoseItem || false,
                isFractioned: isFractioned || false,
                discountBy: discountBy || null,
                choosableSelections: choosableSelections || null
            },
            include: {
                product: true
            }
        });
        const newTotal = comanda.items.reduce((sum, item) => sum + item.total, 0) + item.total;
        await prisma_1.default.comanda.update({
            where: { id: comandaId },
            data: { total: newTotal }
        });
        const updatedComanda = await prisma_1.default.comanda.findUnique({
            where: { id: comandaId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.emit('comanda-updated', { comanda: updatedComanda });
        }
        res.json(updatedComanda);
    },
    addComboItems: async (req, res) => {
        const { comandaId } = req.params;
        const { comboId, comboInstanceId, items } = req.body;
        console.log('[DEBUG] addComboItems chamado', { comboId, comboInstanceId, itemsLength: items.length });
        const comanda = await prisma_1.default.comanda.findUnique({
            where: { id: comandaId },
            include: { items: true }
        });
        if (!comanda) {
            throw new errorHandler_1.AppError('Comanda não encontrada', 404);
        }
        if (!comanda.isOpen) {
            throw new errorHandler_1.AppError('Comanda está fechada', 400);
        }
        const createdItems = [];
        for (const item of items) {
            const created = await prisma_1.default.comandaItem.create({
                data: {
                    comandaId,
                    productId: item.productId,
                    code: item.code,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity,
                    isDoseItem: false,
                    isFractioned: item.isFractioned,
                    discountBy: item.discountBy,
                    choosableSelections: item.choosableSelections || null,
                    comboInstanceId,
                },
                include: { product: true }
            });
            createdItems.push(created);
        }
        const newTotal = comanda.items.reduce((sum, item) => sum + item.total, 0) + createdItems.reduce((sum, item) => sum + item.total, 0);
        await prisma_1.default.comanda.update({
            where: { id: comandaId },
            data: { total: newTotal }
        });
        const updatedComanda = await prisma_1.default.comanda.findUnique({
            where: { id: comandaId },
            include: {
                items: { include: { product: true } },
                user: { select: { name: true } }
            }
        });
        if (!updatedComanda) {
            return res.status(404).json({ error: 'Comanda não encontrada após atualização.' });
        }
        console.log('[DEBUG] Itens da comanda após adição:', updatedComanda.items.map(i => {
            const logObj = {
                id: i.id,
                name: i.name,
                productId: i.productId
            };
            if ('comboInstanceId' in i)
                logObj.comboInstanceId = i.comboInstanceId;
            return logObj;
        }));
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.emit('comanda-updated', { comanda: updatedComanda });
        }
        res.json(updatedComanda);
    },
    updateItemQuantity: async (req, res) => {
        const { comandaId, itemId } = req.params;
        const { quantity } = req.body;
        if (!quantity || quantity < 0) {
            throw new errorHandler_1.AppError('Quantidade deve ser maior que zero', 400);
        }
        const comanda = await prisma_1.default.comanda.findUnique({
            where: { id: comandaId },
            include: { items: true }
        });
        if (!comanda) {
            throw new errorHandler_1.AppError('Comanda não encontrada', 404);
        }
        if (!comanda.isOpen) {
            throw new errorHandler_1.AppError('Comanda está fechada', 400);
        }
        const item = comanda.items.find(i => i.id === itemId);
        if (!item) {
            throw new errorHandler_1.AppError('Item não encontrado', 404);
        }
        if (quantity === 0) {
            await prisma_1.default.comandaItem.delete({
                where: { id: itemId }
            });
        }
        else {
            await prisma_1.default.comandaItem.update({
                where: { id: itemId },
                data: {
                    quantity,
                    total: item.price * quantity
                }
            });
        }
        const updatedItems = await prisma_1.default.comandaItem.findMany({
            where: { comandaId }
        });
        const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
        await prisma_1.default.comanda.update({
            where: { id: comandaId },
            data: { total: newTotal }
        });
        const updatedComanda = await prisma_1.default.comanda.findUnique({
            where: { id: comandaId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.emit('comanda-updated', { comanda: updatedComanda });
        }
        res.json(updatedComanda);
    },
    removeItem: async (req, res) => {
        const { comandaId, itemId } = req.params;
        const comanda = await prisma_1.default.comanda.findUnique({
            where: { id: comandaId },
            include: { items: true }
        });
        if (!comanda) {
            throw new errorHandler_1.AppError('Comanda não encontrada', 404);
        }
        if (!comanda.isOpen) {
            throw new errorHandler_1.AppError('Comanda está fechada', 400);
        }
        const item = comanda.items.find(i => i.id === itemId);
        if (!item) {
            throw new errorHandler_1.AppError('Item não encontrado', 404);
        }
        await prisma_1.default.comandaItem.delete({
            where: { id: itemId }
        });
        const updatedItems = await prisma_1.default.comandaItem.findMany({
            where: { comandaId }
        });
        const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
        await prisma_1.default.comanda.update({
            where: { id: comandaId },
            data: { total: newTotal }
        });
        const updatedComanda = await prisma_1.default.comanda.findUnique({
            where: { id: comandaId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.emit('comanda-updated', { comanda: updatedComanda });
        }
        res.json(updatedComanda);
    },
    close: async (req, res) => {
        const { id } = req.params;
        const comanda = await prisma_1.default.comanda.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });
        if (!comanda) {
            throw new errorHandler_1.AppError('Comanda não encontrada', 404);
        }
        if (!comanda.isOpen) {
            throw new errorHandler_1.AppError('Comanda já está fechada', 400);
        }
        const updatedComanda = await prisma_1.default.comanda.update({
            where: { id },
            data: { isOpen: false },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.emit('comanda-closed', { comanda: updatedComanda });
        }
        res.json(updatedComanda);
    },
    reopen: async (req, res) => {
        const { id } = req.params;
        const comanda = await prisma_1.default.comanda.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });
        if (!comanda) {
            throw new errorHandler_1.AppError('Comanda não encontrada', 404);
        }
        if (comanda.isOpen) {
            throw new errorHandler_1.AppError('Comanda já está aberta', 400);
        }
        const updatedComanda = await prisma_1.default.comanda.update({
            where: { id },
            data: { isOpen: true },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.emit('comanda-reopened', { comanda: updatedComanda });
        }
        res.json(updatedComanda);
    },
    delete: async (req, res) => {
        const { id } = req.params;
        const comanda = await prisma_1.default.comanda.findUnique({
            where: { id }
        });
        if (!comanda) {
            throw new errorHandler_1.AppError('Comanda não encontrada', 404);
        }
        await prisma_1.default.comanda.delete({
            where: { id }
        });
        const io = (0, socketInstance_1.getSocketInstance)();
        if (io) {
            io.emit('comanda-deleted', { comandaId: id });
        }
        res.json({ message: 'Comanda deletada com sucesso' });
    }
};
