"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
exports.financeController = {
    report: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            let start = startDate ? new Date(startDate) : undefined;
            let end = endDate ? new Date(endDate) : undefined;
            if (end) {
                end.setDate(end.getDate() + 1);
            }
            const dateFilter2 = {};
            if (start)
                dateFilter2.gte = start;
            if (end)
                dateFilter2.lt = end;
            const salesData = await prisma_1.default.sale.findMany({
                where: Object.assign({ status: 'COMPLETED' }, (Object.keys(dateFilter2).length > 0 ? { createdAt: dateFilter2 } : {})),
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });
            const ordersData = await prisma_1.default.order.findMany({
                where: Object.assign({ status: 'DELIVERED' }, (Object.keys(dateFilter2).length > 0 ? { createdAt: dateFilter2 } : {})),
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });
            let total_sales = 0;
            let total_cost = 0;
            const processItems = (items, sourceId, sourceType) => {
                items.forEach((item) => {
                    var _a, _b, _c, _d, _e;
                    const itemTotal = Number(item.price);
                    let itemCost = 0;
                    const quantity = Number(item.quantity) || 0;
                    const costAtTimeOfSale = Number(item.costPrice) || 0;
                    const bottleVolume = ((_a = item.product) === null || _a === void 0 ? void 0 : _a.unitVolume) || 1000;
                    const isDoseSale = ((_b = item.product) === null || _b === void 0 ? void 0 : _b.isFractioned) && quantity < (bottleVolume * 0.8);
                    const isFullBottleSale = ((_c = item.product) === null || _c === void 0 ? void 0 : _c.isFractioned) &&
                        itemTotal > (costAtTimeOfSale * 0.5) &&
                        quantity < bottleVolume;
                    const isComboOrAvulso = ((_d = item.product) === null || _d === void 0 ? void 0 : _d.isFractioned) && !isDoseSale && !isFullBottleSale;
                    if (isDoseSale) {
                        const costPerMl = costAtTimeOfSale / bottleVolume;
                        itemCost = costPerMl * quantity;
                        console.log(`- Item: ${item.product.name} (Venda de Dose)`);
                        console.log(`  Fonte: ${sourceType} ID: ${sourceId}`);
                        console.log(`  Preço Registrado: R$ ${itemTotal.toFixed(2)}`);
                        console.log(`  Volume Vendido: ${quantity}ml`);
                        console.log(`  Custo da Garrafa: R$ ${costAtTimeOfSale.toFixed(2)}`);
                        console.log(`  Volume da Garrafa: ${bottleVolume}ml`);
                        console.log(`  Custo por ml: R$ ${costPerMl.toFixed(4)}`);
                        console.log(`  Custo Total do Item: R$ ${itemCost.toFixed(2)}`);
                    }
                    else if (isFullBottleSale) {
                        itemCost = costAtTimeOfSale;
                        console.log(`- Item: ${item.product.name} (Venda de Garrafa Inteira)`);
                        console.log(`  Fonte: ${sourceType} ID: ${sourceId}`);
                        console.log(`  Preço Registrado: R$ ${itemTotal.toFixed(2)}`);
                        console.log(`  Quantidade Registrada: ${quantity}ml`);
                        console.log(`  Volume da Garrafa: ${bottleVolume}ml`);
                        console.log(`  Custo da Garrafa Inteira: R$ ${costAtTimeOfSale.toFixed(2)}`);
                        console.log(`  Custo Total do Item: R$ ${itemCost.toFixed(2)}`);
                    }
                    else {
                        if ((_e = item.product) === null || _e === void 0 ? void 0 : _e.isFractioned) {
                            itemCost = costAtTimeOfSale;
                            console.log(`- Item: ${item.product.name} (Venda Normal/Combo - Garrafa Inteira)`);
                            console.log(`  Fonte: ${sourceType} ID: ${sourceId}`);
                            console.log(`  Preço Registrado: R$ ${itemTotal.toFixed(2)}`);
                            console.log(`  Quantidade Registrada: ${quantity}ml`);
                            console.log(`  Volume da Garrafa: ${bottleVolume}ml`);
                            console.log(`  Custo da Garrafa Inteira: R$ ${costAtTimeOfSale.toFixed(2)}`);
                            console.log(`  Custo Total do Item: R$ ${itemCost.toFixed(2)}`);
                        }
                        else {
                            itemCost = costAtTimeOfSale * quantity;
                            console.log(`- Item: ${item.product.name} (Venda Normal/Combo)`);
                            console.log(`  Fonte: ${sourceType} ID: ${sourceId}`);
                            console.log(`  Preço Registrado: R$ ${itemTotal.toFixed(2)}`);
                            console.log(`  Quantidade: ${quantity}`);
                            console.log(`  Custo Unitário Salvo: R$ ${costAtTimeOfSale.toFixed(2)}`);
                            console.log(`  Custo Total do Item: R$ ${itemCost.toFixed(2)}`);
                        }
                    }
                    total_sales += itemTotal;
                    total_cost += itemCost;
                });
            };
            console.log('\n=== Detalhamento das Vendas (Sale) ===');
            salesData.forEach(sale => {
                console.log(`\nVenda ID: ${sale.id}`);
                processItems(sale.items, sale.id, 'Sale');
            });
            console.log('\n=== Detalhamento dos Pedidos (Order) ===');
            ordersData.forEach(order => {
                console.log(`\nPedido ID: ${order.id}`);
                processItems(order.items, order.id, 'Order');
            });
            console.log('\n=== Resumo Financeiro ===');
            console.log(`Total de Vendas: R$ ${total_sales.toFixed(2)}`);
            console.log(`Total de Custos: R$ ${total_cost.toFixed(2)}`);
            const gross_profit = total_sales - total_cost;
            const expenses = await prisma_1.default.accountPayable.findMany({
                where: Object.keys(dateFilter2).length > 0 ? { createdAt: dateFilter2 } : {},
            });
            const total_expenses = expenses.reduce((sum, e) => sum + (Number(e.value) || 0), 0);
            const net_profit = gross_profit - total_expenses;
            console.log('Filtro de datas recebido:', { startDate, endDate, dateFilter2 });
            console.log('Vendas (Sale) encontradas:', salesData.length);
            console.log('Pedidos (Order) encontrados:', ordersData.length);
            res.json({
                total_sales: Number(total_sales.toFixed(2)),
                total_cost: Number(total_cost.toFixed(2)),
                gross_profit: Number(gross_profit.toFixed(2)),
                total_expenses: Number(total_expenses.toFixed(2)),
                net_profit: Number(net_profit.toFixed(2))
            });
        }
        catch (error) {
            console.error('Erro ao gerar relatório financeiro:', error);
            res.status(500).json({ error: 'Erro ao gerar relatório financeiro' });
        }
    }
};
