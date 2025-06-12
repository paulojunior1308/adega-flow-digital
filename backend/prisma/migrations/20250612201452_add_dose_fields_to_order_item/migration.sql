/*
  Warnings:

  - You are about to drop the column `soldVolume` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `soldVolume` on the `cart_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "soldVolume",
ADD COLUMN     "choosableSelections" JSONB,
ADD COLUMN     "doseId" TEXT;

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "soldVolume";

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE SET NULL ON UPDATE CASCADE;
