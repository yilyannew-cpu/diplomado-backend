-- CreateEnum
CREATE TYPE "Role" AS ENUM ('cliente', 'admin', 'domiciliario', 'superadmin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Activo', 'Pendiente', 'Suspendido', 'Rechazado');

-- CreateEnum
CREATE TYPE "RestaurantStatus" AS ENUM ('Activo', 'Pendiente', 'Rechazado');

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "delivery_minutes" INTEGER NOT NULL DEFAULT 30,
    "accent" TEXT NOT NULL DEFAULT '#4f46e5',
    "initials" TEXT NOT NULL,
    "status" "RestaurantStatus" NOT NULL DEFAULT 'Pendiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "vehicle" TEXT,
    "document_id" TEXT,
    "avatar" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'Pendiente',
    "restaurant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
