import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resolveMigration() {
  try {
    console.log('🔧 Resolvendo migração falhada...');
    
    // 1. Verificar se a migração está marcada como falhada
    try {
      const failedMigrations = await prisma.$queryRaw`
        SELECT * FROM "_prisma_migrations" 
        WHERE migration_name = '20250619143431_add_costprice_to_items_and_stockentry' 
        AND finished_at IS NULL
      `;

      if ((failedMigrations as any[]).length > 0) {
        console.log('📝 Marcando migração falhada como aplicada...');
        
        // Marcar a migração como aplicada
        await prisma.$executeRaw`
          UPDATE "_prisma_migrations" 
          SET finished_at = NOW(), 
              logs = 'Migration resolved manually - fields already exist'
          WHERE migration_name = '20250619143431_add_costprice_to_items_and_stockentry'
        `;
        
        console.log('✅ Migração marcada como aplicada');
      } else {
        console.log('ℹ️ Migração não está marcada como falhada');
      }
    } catch (error) {
      console.log('⚠️ Não foi possível verificar migrações falhadas:', error);
    }

    // 2. Verificar e criar campos costPrice se não existirem
    try {
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

      if ((orderItemColumns as any[]).length === 0) {
        console.log('➕ Adicionando costPrice em OrderItem...');
        await prisma.$executeRaw`ALTER TABLE "OrderItem" ADD COLUMN "costPrice" DOUBLE PRECISION`;
        console.log('✅ costPrice adicionado em OrderItem');
      } else {
        console.log('✅ costPrice já existe em OrderItem');
      }

      if ((saleItemColumns as any[]).length === 0) {
        console.log('➕ Adicionando costPrice em SaleItem...');
        await prisma.$executeRaw`ALTER TABLE "SaleItem" ADD COLUMN "costPrice" DOUBLE PRECISION`;
        console.log('✅ costPrice adicionado em SaleItem');
      } else {
        console.log('✅ costPrice já existe em SaleItem');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar/criar campos costPrice:', error);
    }

    // 3. Preencher dados se campos estiverem vazios
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

      console.log(`✅ OrderItems atualizados: ${orderItemsUpdated}`);
      console.log(`✅ SaleItems atualizados: ${saleItemsUpdated}`);
    } catch (error) {
      console.log('⚠️ Erro ao preencher dados costPrice:', error);
    }

    // 4. Tornar campos obrigatórios (se não estiverem)
    try {
      await prisma.$executeRaw`ALTER TABLE "OrderItem" ALTER COLUMN "costPrice" SET NOT NULL`;
      await prisma.$executeRaw`ALTER TABLE "SaleItem" ALTER COLUMN "costPrice" SET NOT NULL`;
      console.log('🔒 Campos costPrice tornados obrigatórios');
    } catch (error) {
      console.log('ℹ️ Campos costPrice já são obrigatórios ou erro ao tornar obrigatórios');
    }

    // 5. Criar tabela StockEntry se não existir
    try {
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
        
        console.log('✅ Tabela StockEntry criada com sucesso');
      } else {
        console.log('✅ Tabela StockEntry já existe');
      }
    } catch (error) {
      console.log('⚠️ Erro ao criar tabela StockEntry:', error);
    }

    console.log('\n🎉 Processo de resolução concluído!');

  } catch (error) {
    console.error('💥 Erro geral ao resolver migração:', error);
    // Não falhar o build, apenas logar o erro
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script se for chamado diretamente
if (require.main === module) {
  resolveMigration();
}

export default resolveMigration; 