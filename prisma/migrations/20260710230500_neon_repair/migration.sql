-- Repair Neon: categorías huérfanas sin restaurant_id válido

UPDATE "categories" SET "restaurant_id" = (
  SELECT id FROM "restaurants" ORDER BY "created_at" ASC LIMIT 1
)
WHERE "restaurant_id" IS NULL
  AND EXISTS (SELECT 1 FROM "restaurants");

DELETE FROM "categories" WHERE "restaurant_id" IS NULL;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'restaurant_id' AND is_nullable = 'YES'
  ) AND NOT EXISTS (SELECT 1 FROM "categories" WHERE "restaurant_id" IS NULL) THEN
    ALTER TABLE "categories" ALTER COLUMN "restaurant_id" SET NOT NULL;
  END IF;
END $$;

-- Asegurar columnas de pagos como TEXT (por si quedaron como enum de intentos fallidos)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_observation" TEXT;
