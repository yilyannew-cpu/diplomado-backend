-- AlterEnum: permitir suspender restaurantes (ocultarlos del catálogo cliente)
ALTER TYPE "RestaurantStatus" ADD VALUE IF NOT EXISTS 'Suspendido';
