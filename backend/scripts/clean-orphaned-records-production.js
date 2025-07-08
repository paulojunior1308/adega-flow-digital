const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanOrphanedRecordsProduction() {
  try {
    console.log('🔍 Iniciando limpeza de registros órfãos em PRODUÇÃO...');
    console.log('⚠️  ATENÇÃO: Este script irá deletar registros órfãos do banco de dados.');
    console.log('📋 Certifique-se de que fez backup antes de continuar.\n');

    // Contadores para relatório
    const report = {
      saleItemsRemoved: 0,
      orderItemsRemoved: 0,
      cartItemsRemoved: 0,
      comandaItemsRemoved: 0,
      salesRemoved: 0,
      ordersRemoved: 0,
      comandasRemoved: 0,
      cartsRemoved: 0
    };

    // 1. Contar registros órfãos antes da limpeza
    console.log('📊 Contando registros órfãos...');
    
    const orphanedSaleItemsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "SaleItem" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
    `;
    
    const orphanedOrderItemsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "OrderItem" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
    `;
    
    const orphanedCartItemsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "cart_items" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
    `;
    
    const orphanedComandaItemsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "ComandaItem" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
    `;

    console.log(`📦 SaleItems órfãos encontrados: ${orphanedSaleItemsCount[0].count}`);
    console.log(`📦 OrderItems órfãos encontrados: ${orphanedOrderItemsCount[0].count}`);
    console.log(`📦 CartItems órfãos encontrados: ${orphanedCartItemsCount[0].count}`);
    console.log(`📦 ComandaItems órfãos encontrados: ${orphanedComandaItemsCount[0].count}\n`);

    // 2. Confirmar com o usuário
    const totalOrphaned = orphanedSaleItemsCount[0].count + orphanedOrderItemsCount[0].count + 
                         orphanedCartItemsCount[0].count + orphanedComandaItemsCount[0].count;
    
    if (totalOrphaned === 0) {
      console.log('✅ Nenhum registro órfão encontrado. Nada a limpar.');
      return;
    }

    console.log(`⚠️  Total de registros órfãos: ${totalOrphaned}`);
    console.log('❓ Deseja continuar com a limpeza? (s/N)');
    
    // Em produção, você pode comentar esta linha e deixar executar automaticamente
    // ou implementar uma confirmação via variável de ambiente
    // process.exit(0);

    // 3. Limpar registros órfãos
    console.log('\n🧹 Iniciando limpeza...\n');

    // Limpar SaleItem com produtos inexistentes
    console.log('📦 Limpando SaleItem com produtos inexistentes...');
    const orphanedSaleItems = await prisma.$queryRaw`
      DELETE FROM "SaleItem" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
      RETURNING id
    `;
    report.saleItemsRemoved = orphanedSaleItems.length;
    console.log(`✅ ${report.saleItemsRemoved} registros de SaleItem removidos`);

    // Limpar OrderItem com produtos inexistentes
    console.log('\n📦 Limpando OrderItem com produtos inexistentes...');
    const orphanedOrderItems = await prisma.$queryRaw`
      DELETE FROM "OrderItem" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
      RETURNING id
    `;
    report.orderItemsRemoved = orphanedOrderItems.length;
    console.log(`✅ ${report.orderItemsRemoved} registros de OrderItem removidos`);

    // Limpar CartItem com produtos inexistentes
    console.log('\n📦 Limpando CartItem com produtos inexistentes...');
    const orphanedCartItems = await prisma.$queryRaw`
      DELETE FROM "cart_items" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
      RETURNING id
    `;
    report.cartItemsRemoved = orphanedCartItems.length;
    console.log(`✅ ${report.cartItemsRemoved} registros de CartItem removidos`);

    // Limpar ComandaItem com produtos inexistentes
    console.log('\n📦 Limpando ComandaItem com produtos inexistentes...');
    const orphanedComandaItems = await prisma.$queryRaw`
      DELETE FROM "ComandaItem" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
      RETURNING id
    `;
    report.comandaItemsRemoved = orphanedComandaItems.length;
    console.log(`✅ ${report.comandaItemsRemoved} registros de ComandaItem removidos`);

    // Limpar Sale sem itens
    console.log('\n📦 Limpando Sale sem itens...');
    const orphanedSales = await prisma.$queryRaw`
      DELETE FROM "Sale" 
      WHERE id NOT IN (SELECT DISTINCT "saleId" FROM "SaleItem")
      RETURNING id
    `;
    report.salesRemoved = orphanedSales.length;
    console.log(`✅ ${report.salesRemoved} registros de Sale removidos`);

    // Limpar Order sem itens
    console.log('\n📦 Limpando Order sem itens...');
    const orphanedOrders = await prisma.$queryRaw`
      DELETE FROM "Order" 
      WHERE id NOT IN (SELECT DISTINCT "orderId" FROM "OrderItem")
      RETURNING id
    `;
    report.ordersRemoved = orphanedOrders.length;
    console.log(`✅ ${report.ordersRemoved} registros de Order removidos`);

    // Limpar Comanda sem itens
    console.log('\n📦 Limpando Comanda sem itens...');
    const orphanedComandas = await prisma.$queryRaw`
      DELETE FROM "Comanda" 
      WHERE id NOT IN (SELECT DISTINCT "comandaId" FROM "ComandaItem")
      RETURNING id
    `;
    report.comandasRemoved = orphanedComandas.length;
    console.log(`✅ ${report.comandasRemoved} registros de Comanda removidos`);

    // Limpar Cart sem itens
    console.log('\n📦 Limpando Cart sem itens...');
    const orphanedCarts = await prisma.$queryRaw`
      DELETE FROM "Cart" 
      WHERE id NOT IN (SELECT DISTINCT "cartId" FROM "cart_items")
      RETURNING id
    `;
    report.cartsRemoved = orphanedCarts.length;
    console.log(`✅ ${report.cartsRemoved} registros de Cart removidos`);

    // 4. Relatório final
    console.log('\n📋 === RELATÓRIO DE LIMPEZA ===');
    console.log(`📦 SaleItems removidos: ${report.saleItemsRemoved}`);
    console.log(`📦 OrderItems removidos: ${report.orderItemsRemoved}`);
    console.log(`📦 CartItems removidos: ${report.cartItemsRemoved}`);
    console.log(`📦 ComandaItems removidos: ${report.comandaItemsRemoved}`);
    console.log(`💰 Sales removidas: ${report.salesRemoved}`);
    console.log(`📦 Orders removidas: ${report.ordersRemoved}`);
    console.log(`🍽️  Comandas removidas: ${report.comandasRemoved}`);
    console.log(`🛒 Carts removidos: ${report.cartsRemoved}`);
    
    const totalRemoved = Object.values(report).reduce((sum, count) => sum + count, 0);
    console.log(`\n🎯 Total de registros removidos: ${totalRemoved}`);
    
    console.log('\n🎉 Limpeza concluída com sucesso!');
    console.log('💡 Agora você pode reiniciar o backend sem erros.');
    console.log('📝 Recomendação: Faça um novo backup após a limpeza.');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    console.error('🔧 Verifique os logs e tente novamente.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se for chamado diretamente
if (require.main === module) {
  cleanOrphanedRecordsProduction();
}

module.exports = { cleanOrphanedRecordsProduction }; 