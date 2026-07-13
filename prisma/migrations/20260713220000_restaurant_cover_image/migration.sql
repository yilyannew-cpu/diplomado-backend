-- Imagen de portada del restaurante (vista detalle cliente)
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "cover_image" TEXT;
