-- AlterTable
ALTER TABLE "ComandaItem" ADD COLUMN     "offerInstanceId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "offerInstanceId" TEXT;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "offerInstanceId" TEXT;

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "offerInstanceId" TEXT;

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferItem" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OfferItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_offerInstanceId_fkey" FOREIGN KEY ("offerInstanceId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_offerInstanceId_fkey" FOREIGN KEY ("offerInstanceId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_offerInstanceId_fkey" FOREIGN KEY ("offerInstanceId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferItem" ADD CONSTRAINT "OfferItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferItem" ADD CONSTRAINT "OfferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComandaItem" ADD CONSTRAINT "ComandaItem_offerInstanceId_fkey" FOREIGN KEY ("offerInstanceId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
