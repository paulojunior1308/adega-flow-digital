-- Adicionar colunas lat e lng à tabela Address
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;

-- Adicionar coluna deliveryFee à tabela Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0; 