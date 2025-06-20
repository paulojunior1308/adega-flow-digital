import prisma from '../config/prisma';

async function fixFailedMigration() {
  try {
    console.log('🔧 Iniciando correção da migração falhada...');
    
    // 1. Verificar se os campos costPrice existem
    const orderItemColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'OrderItem' AND column_name = 'costPrice'
    `;
    
    const saleItemColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'SaleItem' AND column_name = 'costPrice'
    `;

    // 2. Adicionar campos costPrice se não existirem
    if ((orderItemColumns as any[]).length === 0) {
      console.log('➕ Adicionando costPrice nullable em OrderItem...');
      await prisma.$executeRaw`ALTER TABLE "OrderItem" ADD COLUMN "costPrice" DOUBLE PRECISION`;
    } else {
      console.log('✅ costPrice já existe em OrderItem');
    }

    if ((saleItemColumns as any[]).length === 0) {
      console.log('➕ Adicionando costPrice nullable em SaleItem...');
      await prisma.$executeRaw`ALTER TABLE "SaleItem" ADD COLUMN "costPrice" DOUBLE PRECISION`;
    } else {
      console.log('✅ costPrice já existe em SaleItem');
    }

    // 3. Preencher dados de costPrice
    console.log('📊 Preenchendo dados de costPrice...');
    
    const orderItemsUpdated = await prisma.$executeRaw`
      UPDATE "OrderItem" 
      SET "costPrice" = p."costPrice"
      FROM "Product" p
      WHERE "OrderItem"."productId" = p.id 
        AND "OrderItem"."costPrice" IS NULL
    `;
    
    const saleItemsUpdated = await prisma.$executeRaw`
      UPDATE "SaleItem" 
      SET "costPrice" = p."costPrice"
      FROM "Product" p
      WHERE "SaleItem"."productId" = p.id 
        AND "SaleItem"."costPrice" IS NULL
    `;

    console.log(`✅ OrderItems atualizados: ${orderItemsUpdated}`);
    console.log(`✅ SaleItems atualizados: ${saleItemsUpdated}`);

    // 4. Tornar campos obrigatórios
    console.log('🔒 Tornando campos costPrice obrigatórios...');
    await prisma.$executeRaw`ALTER TABLE "OrderItem" ALTER COLUMN "costPrice" SET NOT NULL`;
    await prisma.$executeRaw`ALTER TABLE "SaleItem" ALTER COLUMN "costPrice" SET NOT NULL`;

    // 5. Verificar se a tabela StockEntry existe
    const stockEntryExists = await prisma.$queryRaw`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'StockEntry'
    `;

    if ((stockEntryExists as any[]).length === 0) {
      console.log('➕ Criando tabela StockEntry...');
      await prisma.$executeRaw`
        CREATE TABLE "StockEntry" (
          "id" TEXT NOT NULL,
          "productId" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL,
          "unitCost" DOUBLE PRECISION NOT NULL,
          "totalCost" DOUBLE PRECISION NOT NULL,
          "supplierId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "notes" TEXT,
          CONSTRAINT "StockEntry_pkey" PRIMARY KEY ("id")
        )
      `;

      // Adicionar foreign keys
      await prisma.$executeRaw`
        ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `;

      await prisma.$executeRaw`
        ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_supplierId_fkey" 
        FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE
      `;
    } else {
      console.log('✅ Tabela StockEntry já existe');
    }

    console.log('\n🎉 Migração falhada corrigida com sucesso!');
    console.log('📝 Agora você pode marcar a migração como resolvida no painel do Render');

  } catch (error) {
    console.error('💥 Erro ao corrigir migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script se for chamado diretamente
if (require.main === module) {
  fixFailedMigration();
}

export default fixFailedMigration; 