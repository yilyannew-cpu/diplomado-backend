-- Logo del restaurante (URL o data URL durable en Neon)
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "logo" TEXT;
