-- Atualizar status de estoque para produtos existentes
-- Produtos com estoque 0 ou volume 0 (fracionados) = OUT_OF_STOCK
UPDATE "Product" 
SET "stockStatus" = 'OUT_OF_STOCK' 
WHERE "stock" = 0 
   OR ("isFractioned" = true AND ("totalVolume" IS NULL OR "totalVolume" <= 0));

-- Produtos com estoque <= 5 = LOW_STOCK
UPDATE "Product" 
SET "stockStatus" = 'LOW_STOCK' 
WHERE "stock" > 0 
   AND "stock" <= 5 
   AND ("isFractioned" = false OR ("isFractioned" = true AND "totalVolume" > 0));

-- Produtos com estoque > 5 = IN_STOCK
UPDATE "Product" 
SET "stockStatus" = 'IN_STOCK' 
WHERE "stock" > 5 
   AND ("isFractioned" = false OR ("isFractioned" = true AND "totalVolume" > 0)); 