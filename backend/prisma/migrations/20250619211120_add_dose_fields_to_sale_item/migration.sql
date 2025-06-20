-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "choosableSelections" JSONB,
ADD COLUMN     "discountBy" TEXT,
ADD COLUMN     "isDoseItem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFractioned" BOOLEAN NOT NULL DEFAULT false;
