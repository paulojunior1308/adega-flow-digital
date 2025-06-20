-- Script para resolver a migração falhada no Render
-- Execute este script diretamente no banco de dados do Render

-- 1. Primeiro, vamos verificar se os campos já existem
DO $$
BEGIN
    -- Verificar se costPrice já existe em OrderItem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'OrderItem' AND column_name = 'costPrice'
    ) THEN
        -- Adicionar costPrice como nullable primeiro
        ALTER TABLE "OrderItem" ADD COLUMN "costPrice" DOUBLE PRECISION;
        RAISE NOTICE 'Adicionado costPrice nullable em OrderItem';
    ELSE
        RAISE NOTICE 'costPrice já existe em OrderItem';
    END IF;

    -- Verificar se costPrice já existe em SaleItem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'SaleItem' AND column_name = 'costPrice'
    ) THEN
        -- Adicionar costPrice como nullable primeiro
        ALTER TABLE "SaleItem" ADD COLUMN "costPrice" DOUBLE PRECISION;
        RAISE NOTICE 'Adicionado costPrice nullable em SaleItem';
    ELSE
        RAISE NOTICE 'costPrice já existe em SaleItem';
    END IF;
END $$;

-- 2. Preencher os dados de costPrice com o custo atual dos produtos
UPDATE "OrderItem" 
SET "costPrice" = p."costPrice"
FROM "Product" p
WHERE "OrderItem"."productId" = p.id 
  AND "OrderItem"."costPrice" IS NULL;

UPDATE "SaleItem" 
SET "costPrice" = p."costPrice"
FROM "Product" p
WHERE "SaleItem"."productId" = p.id 
  AND "SaleItem"."costPrice" IS NULL;

-- 3. Tornar os campos obrigatórios
ALTER TABLE "OrderItem" ALTER COLUMN "costPrice" SET NOT NULL;
ALTER TABLE "SaleItem" ALTER COLUMN "costPrice" SET NOT NULL;

-- 4. Criar a tabela StockEntry se não existir
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

-- 5. Adicionar as foreign keys se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'StockEntry_productId_fkey'
    ) THEN
        ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'StockEntry_supplierId_fkey'
    ) THEN
        ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_supplierId_fkey" 
        FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 6. Marcar a migração como aplicada (se necessário)
-- Isso pode ser feito manualmente no painel do Render ou via comando 