-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "payment_observation" TEXT;

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "breb_key" TEXT,
ADD COLUMN     "breb_owner" TEXT,
ADD COLUMN     "breb_qr_url" TEXT,
ADD COLUMN     "nequi_number" TEXT,
ADD COLUMN     "nequi_owner" TEXT;

-- CreateTable
CREATE TABLE "user_reports" (
    "id" TEXT NOT NULL,
    "reported_user" TEXT NOT NULL,
    "reported_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);
