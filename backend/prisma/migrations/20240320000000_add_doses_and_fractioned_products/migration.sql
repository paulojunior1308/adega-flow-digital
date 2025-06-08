-- AlterTable
ALTER TABLE "Product" ADD COLUMN "isFractioned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "totalVolume" DOUBLE PRECISION,
ADD COLUMN "unitVolume" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Dose" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoseItem" (
    "id" TEXT NOT NULL,
    "doseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoseItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DoseItem" ADD CONSTRAINT "DoseItem_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseItem" ADD CONSTRAINT "DoseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 