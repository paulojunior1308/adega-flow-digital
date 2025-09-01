-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('OUT_OF_STOCK', 'LOW_STOCK', 'IN_STOCK');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stockStatus" "StockStatus" NOT NULL DEFAULT 'IN_STOCK';
