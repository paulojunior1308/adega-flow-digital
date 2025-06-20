/*
  Warnings:

  - Made the column `costPrice` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `costPrice` on table `SaleItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "costPrice" SET NOT NULL;

-- AlterTable
ALTER TABLE "SaleItem" ALTER COLUMN "costPrice" SET NOT NULL;
