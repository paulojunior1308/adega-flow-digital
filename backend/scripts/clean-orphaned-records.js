const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanOrphanedRecords() {
  try {
    console.log('🔍 Iniciando limpeza de registros órfãos...');

    // 1. Limpar SaleItem com produtos inexistentes
    console.log('\n📦 Limpando SaleItem com produtos inexistentes...');
    const orphanedSaleItems = await prisma.$queryRaw`
      DELETE FROM "SaleItem" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
    `;
    console.log(`✅ ${orphanedSaleItems.length || 0} registros de SaleItem removidos`);

    // 2. Limpar OrderItem com produtos inexistentes
    console.log('\n📦 Limpando OrderItem com produtos inexistentes...');
    const orphanedOrderItems = await prisma.$queryRaw`
      DELETE FROM "OrderItem" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
    `;
    console.log(`✅ ${orphanedOrderItems.length || 0} registros de OrderItem removidos`);

    // 3. Limpar CartItem com produtos inexistentes
    console.log('\n📦 Limpando CartItem com produtos inexistentes...');
    const orphanedCartItems = await prisma.$queryRaw`
      DELETE FROM "cart_items" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
    `;
    console.log(`✅ ${orphanedCartItems.length || 0} registros de CartItem removidos`);

    // 4. Limpar ComandaItem com produtos inexistentes
    console.log('\n📦 Limpando ComandaItem com produtos inexistentes...');
    const orphanedComandaItems = await prisma.$queryRaw`
      DELETE FROM "ComandaItem" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
    `;
    console.log(`✅ ${orphanedComandaItems.length || 0} registros de ComandaItem removidos`);

    // 5. Limpar Sale sem itens
    console.log('\n📦 Limpando Sale sem itens...');
    const orphanedSales = await prisma.$queryRaw`
      DELETE FROM "Sale" 
      WHERE id NOT IN (SELECT DISTINCT "saleId" FROM "SaleItem")
    `;
    console.log(`✅ ${orphanedSales.length || 0} registros de Sale removidos`);

    // 6. Limpar Order sem itens
    console.log('\n📦 Limpando Order sem itens...');
    const orphanedOrders = await prisma.$queryRaw`
      DELETE FROM "Order" 
      WHERE id NOT IN (SELECT DISTINCT "orderId" FROM "OrderItem")
    `;
    console.log(`✅ ${orphanedOrders.length || 0} registros de Order removidos`);

    // 7. Limpar Comanda sem itens
    console.log('\n📦 Limpando Comanda sem itens...');
    const orphanedComandas = await prisma.$queryRaw`
      DELETE FROM "Comanda" 
      WHERE id NOT IN (SELECT DISTINCT "comandaId" FROM "ComandaItem")
    `;
    console.log(`✅ ${orphanedComandas.length || 0} registros de Comanda removidos`);

    // 8. Limpar Cart sem itens
    console.log('\n📦 Limpando Cart sem itens...');
    const orphanedCarts = await prisma.$queryRaw`
      DELETE FROM "Cart" 
      WHERE id NOT IN (SELECT DISTINCT "cartId" FROM "cart_items")
    `;
    console.log(`✅ ${orphanedCarts.length || 0} registros de Cart removidos`);

    console.log('\n🎉 Limpeza concluída com sucesso!');
    console.log('💡 Agora você pode reiniciar o backend sem erros.');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOrphanedRecords(); 