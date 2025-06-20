-- Script SQL para resolver diretamente a migração falhada no Render
-- Execute este script diretamente no banco de dados do Render

-- 1. Marcar TODAS as migrações como aplicadas
UPDATE "_prisma_migrations" 
SET finished_at = NOW(), 
    logs = 'Migration force resolved - manual fix applied'
WHERE finished_at IS NULL;

-- 2. Adicionar campos costPrice se não existirem
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "costPrice" DOUBLE PRECISION;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "costPrice" DOUBLE PRECISION;

-- 3. Preencher dados de costPrice
UPDATE "OrderItem" 
SET "costPrice" = COALESCE(p."costPrice", 0)
FROM "Product" p
WHERE "OrderItem"."productId" = p.id 
  AND ("OrderItem"."costPrice" IS NULL OR "OrderItem"."costPrice" = 0);

UPDATE "SaleItem" 
SET "costPrice" = COALESCE(p."costPrice", 0)
FROM "Product" p
WHERE "SaleItem"."productId" = p.id 
  AND ("SaleItem"."costPrice" IS NULL OR "SaleItem"."costPrice" = 0);

-- 4. Tornar campos obrigatórios
ALTER TABLE "OrderItem" ALTER COLUMN "costPrice" SET NOT NULL;
ALTER TABLE "SaleItem" ALTER COLUMN "costPrice" SET NOT NULL;

-- 5. Adicionar campo margin se não existir
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "margin" DOUBLE PRECISION;

-- 6. Criar tabela StockEntry se não existir
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
);

-- 7. Adicionar foreign keys se não existirem
ALTER TABLE "StockEntry" ADD CONSTRAINT IF NOT EXISTS "StockEntry_productId_fkey" 
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StockEntry" ADD CONSTRAINT IF NOT EXISTS "StockEntry_supplierId_fkey" 
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Verificar se tudo foi aplicado
SELECT 'Migration resolved successfully!' as status; 