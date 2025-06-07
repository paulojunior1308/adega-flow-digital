-- AlterTable
ALTER TABLE "Combo" ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "ComboItem" ADD COLUMN     "amount" INTEGER,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "canSellByDose" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canSellByUnit" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "quantityPerUnit" INTEGER,
ADD COLUMN     "unit" TEXT;
