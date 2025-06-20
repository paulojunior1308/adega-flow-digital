import prisma from '../config/prisma';

async function fillCostPriceData() {
  try {
    console.log('🚀 Iniciando preenchimento dos dados de costPrice...');
    
    // Preencher SaleItem com costPrice nulo
    const saleItemsToUpdate = await prisma.$queryRaw`
      SELECT si.id, si."productId", p."costPrice", p.name as "productName"
      FROM "SaleItem" si
      JOIN "Product" p ON si."productId" = p.id
      WHERE si."costPrice" IS NULL
    `;

    console.log(`📊 Encontrados ${(saleItemsToUpdate as any[]).length} itens de venda para atualizar`);

    let updatedSaleItems = 0;
    for (const item of saleItemsToUpdate as any[]) {
      try {
        await prisma.$executeRaw`
          UPDATE "SaleItem" 
          SET "costPrice" = ${item.costPrice} 
          WHERE id = ${item.id}
        `;
        console.log(`✅ SaleItem ${item.productName}: costPrice = ${item.costPrice}`);
        updatedSaleItems++;
      } catch (error) {
        console.error(`❌ Erro ao atualizar SaleItem ${item.productName}:`, error);
      }
    }

    // Preencher OrderItem com costPrice nulo
    const orderItemsToUpdate = await prisma.$queryRaw`
      SELECT oi.id, oi."productId", p."costPrice", p.name as "productName"
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      WHERE oi."costPrice" IS NULL
    `;

    console.log(`📊 Encontrados ${(orderItemsToUpdate as any[]).length} itens de pedido para atualizar`);

    let updatedOrderItems = 0;
    for (const item of orderItemsToUpdate as any[]) {
      try {
        await prisma.$executeRaw`
          UPDATE "OrderItem" 
          SET "costPrice" = ${item.costPrice} 
          WHERE id = ${item.id}
        `;
        console.log(`✅ OrderItem ${item.productName}: costPrice = ${item.costPrice}`);
        updatedOrderItems++;
      } catch (error) {
        console.error(`❌ Erro ao atualizar OrderItem ${item.productName}:`, error);
      }
    }

    console.log('\n📈 Resumo da atualização:');
    console.log(`✅ SaleItems atualizados: ${updatedSaleItems}`);
    console.log(`✅ OrderItems atualizados: ${updatedOrderItems}`);
    console.log(`📊 Total processado: ${updatedSaleItems + updatedOrderItems}`);

    if (updatedSaleItems + updatedOrderItems > 0) {
      console.log('\n🎉 Todos os costPrice foram preenchidos com sucesso!');
    } else {
      console.log('\n✅ Nenhum registro precisava ser atualizado.');
    }

  } catch (error) {
    console.error('💥 Erro geral no script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script se for chamado diretamente
if (require.main === module) {
  fillCostPriceData();
}

export default fillCostPriceData; 