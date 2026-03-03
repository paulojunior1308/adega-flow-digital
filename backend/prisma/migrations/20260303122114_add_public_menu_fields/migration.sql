-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "publicMenuOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "visibleInPublicMenu" BOOLEAN NOT NULL DEFAULT true;
