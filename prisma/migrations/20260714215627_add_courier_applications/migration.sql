/*
  Warnings:

  - The `payment_method` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `payment_status` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Paid', 'Failed', 'Refunded');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('Cash', 'Online');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "payment_method",
ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL DEFAULT 'Cash',
DROP COLUMN "payment_status",
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'Pending';

-- CreateTable
CREATE TABLE "courier_applications" (
    "id" TEXT NOT NULL,
    "courier_id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courier_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courier_applications_courier_id_restaurant_id_key" ON "courier_applications"("courier_id", "restaurant_id");

-- AddForeignKey
ALTER TABLE "courier_applications" ADD CONSTRAINT "courier_applications_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_applications" ADD CONSTRAINT "courier_applications_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
