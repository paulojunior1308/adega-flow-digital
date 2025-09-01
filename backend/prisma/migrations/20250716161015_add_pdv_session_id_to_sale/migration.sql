-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "pdvSessionId" TEXT;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_pdvSessionId_fkey" FOREIGN KEY ("pdvSessionId") REFERENCES "PDVSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
