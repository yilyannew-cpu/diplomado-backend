-- CreateTable
CREATE TABLE IF NOT EXISTS "delivery_reviews" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "courier_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "restaurant_rating" DOUBLE PRECISION NOT NULL,
    "restaurant_comment" TEXT,
    "courier_rating" DOUBLE PRECISION,
    "courier_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "delivery_reviews_order_id_key" ON "delivery_reviews"("order_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "delivery_reviews_restaurant_id_idx" ON "delivery_reviews"("restaurant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "delivery_reviews_courier_id_idx" ON "delivery_reviews"("courier_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "delivery_reviews" ADD CONSTRAINT "delivery_reviews_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "delivery_reviews" ADD CONSTRAINT "delivery_reviews_restaurant_id_fkey"
    FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "delivery_reviews" ADD CONSTRAINT "delivery_reviews_courier_id_fkey"
    FOREIGN KEY ("courier_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
