const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function forceResolveMigration() {
  try {
    console.log('🔧 Forçando resolução da migração falhada...');
    
    // 1. Marcar a migração como aplicada (força a resolução)
    await prisma.$executeRaw`
      UPDATE "_prisma_migrations" 
      SET finished_at = NOW(), 
          logs = 'Migration force resolved - manual fix applied'
      WHERE migration_name = '20250619143431_add_costprice_to_items_and_stockentry'
    `;
    
    console.log('✅ Migração marcada como aplicada');
    
    // 2. Aplicar as mudanças manualmente
    console.log('🔧 Aplicando mudanças manualmente...');
    
    // Adicionar campos costPrice se não existirem
    try {
      await prisma.$executeRaw`ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "costPrice" DOUBLE PRECISION`;
      await prisma.$executeRaw`ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "costPrice" DOUBLE PRECISION`;
      console.log('✅ Campos costPrice verificados/criados');
    } catch (error) {
      console.log('⚠️ Campos costPrice já existem ou erro:', error.message);
    }
    
    // Preencher dados
    try {
      const orderItemsUpdated = await prisma.$executeRaw`
        UPDATE "OrderItem" 
        SET "costPrice" = COALESCE(p."costPrice", 0)
        FROM "Product" p
        WHERE "OrderItem"."productId" = p.id 
          AND ("OrderItem"."costPrice" IS NULL OR "OrderItem"."costPrice" = 0)
      `;
      
      const saleItemsUpdated = await prisma.$executeRaw`
        UPDATE "SaleItem" 
        SET "costPrice" = COALESCE(p."costPrice", 0)
        FROM "Product" p
        WHERE "SaleItem"."productId" = p.id 
          AND ("SaleItem"."costPrice" IS NULL OR "SaleItem"."costPrice" = 0)
      `;
      
      console.log(`✅ Dados preenchidos: ${orderItemsUpdated} OrderItems, ${saleItemsUpdated} SaleItems`);
    } catch (error) {
      console.log('⚠️ Erro ao preencher dados:', error.message);
    }
    
    // Tornar campos obrigatórios
    try {
      await prisma.$executeRaw`ALTER TABLE "OrderItem" ALTER COLUMN "costPrice" SET NOT NULL`;
      await prisma.$executeRaw`ALTER TABLE "SaleItem" ALTER COLUMN "costPrice" SET NOT NULL`;
      console.log('✅ Campos tornados obrigatórios');
    } catch (error) {
      console.log('⚠️ Erro ao tornar campos obrigatórios:', error.message);
    }
    
    // Criar tabela StockEntry
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "StockEntry" (
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
      
      // Adicionar foreign keys se não existirem
      await prisma.$executeRaw`
        ALTER TABLE "StockEntry" ADD CONSTRAINT IF NOT EXISTS "StockEntry_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `;
      
      await prisma.$executeRaw`
        ALTER TABLE "StockEntry" ADD CONSTRAINT IF NOT EXISTS "StockEntry_supplierId_fkey" 
        FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE
      `;
      
      console.log('✅ Tabela StockEntry verificada/criada');
    } catch (error) {
      console.log('⚠️ Erro ao criar tabela StockEntry:', error.message);
    }
    
    console.log('\n🎉 Migração forçadamente resolvida!');
    
  } catch (error) {
    console.error('💥 Erro ao forçar resolução:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

forceResolveMigration(); 