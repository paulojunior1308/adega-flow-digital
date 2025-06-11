-- AlterTable
ALTER TABLE "Combo" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "Dose" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "DoseItem" ALTER COLUMN "discountBy" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Combo" ADD CONSTRAINT "Combo_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dose" ADD CONSTRAINT "Dose_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
