/*
  Warnings:

  - A unique constraint covering the columns `[authority]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "authority" TEXT,
ADD COLUMN     "paymentRefId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_authority_key" ON "Order"("authority");
