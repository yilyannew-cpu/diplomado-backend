-- Panel Admin Restaurante: categorías por sede, promociones, despachos, reseñas

-- Restaurant: meta mensual
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "monthly_goal" INTEGER NOT NULL DEFAULT 18000000;

-- Category: imagen y restaurant_id
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "restaurant_id" TEXT;

UPDATE "categories" SET "restaurant_id" = 'rest-ffcore' WHERE "restaurant_id" IS NULL;

ALTER TABLE "categories" ALTER COLUMN "restaurant_id" SET NOT NULL;

ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_key";
DROP INDEX IF EXISTS "categories_name_key";

ALTER TABLE "categories" ADD CONSTRAINT "categories_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "categories" ADD CONSTRAINT "categories_restaurant_id_name_key" UNIQUE ("restaurant_id", "name");

-- Order: notas, zona, timestamp de estado, pagos
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "zone" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "status_entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('Cash', 'Online');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Paid', 'Failed', 'Refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" "PaymentMethod" NOT NULL DEFAULT 'Cash';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" "PaymentStatus" NOT NULL DEFAULT 'Pending';

-- Promotions
CREATE TABLE IF NOT EXISTS "promotions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discount_percent" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "restaurant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "promotion_products" (
    "id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    CONSTRAINT "promotion_products_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "promotions" ADD CONSTRAINT "promotions_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_promotion_id_fkey"
  FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_promotion_id_product_id_key"
  UNIQUE ("promotion_id", "product_id");

-- Reviews
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "customer_name" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Dispatches
CREATE TABLE IF NOT EXISTS "dispatches" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "courier_id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "dispatched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_order_id_key" UNIQUE ("order_id");

ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_courier_id_fkey"
  FOREIGN KEY ("courier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
