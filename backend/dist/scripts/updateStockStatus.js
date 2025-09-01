"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const stockStatus_1 = require("../utils/stockStatus");
const prisma = new client_1.PrismaClient();
async function updateAllProductStockStatus() {
    try {
        console.log('🔄 Iniciando atualização do status de estoque de todos os produtos...');
        const products = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                stock: true,
                isFractioned: true,
                totalVolume: true,
                stockStatus: true
            }
        });
        console.log(`📦 Encontrados ${products.length} produtos para atualizar`);
        let updatedCount = 0;
        let errorCount = 0;
        for (const product of products) {
            try {
                const newStatus = (0, stockStatus_1.calculateStockStatus)(product.stock, product.isFractioned, product.totalVolume);
                if (product.stockStatus !== newStatus) {
                    await prisma.product.update({
                        where: { id: product.id },
                        data: { stockStatus: newStatus }
                    });
                    console.log(`✅ ${product.name}: ${product.stockStatus} → ${newStatus} (estoque: ${product.stock})`);
                    updatedCount++;
                }
                else {
                    console.log(`⏭️  ${product.name}: status já correto (${product.stockStatus})`);
                }
            }
            catch (error) {
                console.error(`❌ Erro ao atualizar ${product.name}:`, error);
                errorCount++;
            }
        }
        console.log('\n📊 Resumo da atualização:');
        console.log(`✅ Produtos atualizados: ${updatedCount}`);
        console.log(`❌ Erros: ${errorCount}`);
        console.log(`📦 Total processado: ${products.length}`);
    }
    catch (error) {
        console.error('❌ Erro geral:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
updateAllProductStockStatus();
