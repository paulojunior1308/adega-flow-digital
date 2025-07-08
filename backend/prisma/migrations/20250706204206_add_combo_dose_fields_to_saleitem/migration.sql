-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "comboInstanceId" TEXT,
ADD COLUMN     "doseId" TEXT,
ADD COLUMN     "doseInstanceId" TEXT;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE SET NULL ON UPDATE CASCADE;
