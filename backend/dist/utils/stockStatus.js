"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateStockStatus = calculateStockStatus;
exports.updateProductStockStatusWithValues = updateProductStockStatusWithValues;
exports.getStockStatusText = getStockStatusText;
exports.getStockStatusColor = getStockStatusColor;
const client_1 = require("@prisma/client");
function calculateStockStatus(stock, isFractioned = false, totalVolume = null) {
    if (isFractioned && (totalVolume === null || totalVolume <= 0)) {
        return client_1.StockStatus.OUT_OF_STOCK;
    }
    if (stock <= 0) {
        return client_1.StockStatus.OUT_OF_STOCK;
    }
    if (stock <= 5) {
        return client_1.StockStatus.LOW_STOCK;
    }
    return client_1.StockStatus.IN_STOCK;
}
async function updateProductStockStatusWithValues(productId, prisma, stock, isFractioned, totalVolume) {
    const newStatus = calculateStockStatus(stock, isFractioned, totalVolume);
    await prisma.product.update({
        where: { id: productId },
        data: { stockStatus: newStatus }
    });
}
function getStockStatusText(status) {
    switch (status) {
        case client_1.StockStatus.OUT_OF_STOCK:
            return 'ESGOTADO';
        case client_1.StockStatus.LOW_STOCK:
            return 'ESTOQUE BAIXO';
        case client_1.StockStatus.IN_STOCK:
            return 'EM ESTOQUE';
        default:
            return 'DESCONHECIDO';
    }
}
function getStockStatusColor(status) {
    switch (status) {
        case client_1.StockStatus.OUT_OF_STOCK:
            return 'bg-red-500';
        case client_1.StockStatus.LOW_STOCK:
            return 'bg-yellow-500';
        case client_1.StockStatus.IN_STOCK:
            return 'bg-green-500';
        default:
            return 'bg-gray-500';
    }
}
