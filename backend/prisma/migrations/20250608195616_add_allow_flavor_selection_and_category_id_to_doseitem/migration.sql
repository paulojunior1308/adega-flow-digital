-- DropForeignKey
ALTER TABLE "DoseItem" DROP CONSTRAINT "DoseItem_doseId_fkey";

-- AlterTable
ALTER TABLE "DoseItem" ADD COLUMN     "allowFlavorSelection" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "discountBy" TEXT NOT NULL DEFAULT 'unit';

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "doseId" TEXT;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseItem" ADD CONSTRAINT "DoseItem_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
