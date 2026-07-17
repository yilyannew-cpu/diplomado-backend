-- Reparacion idempotente: en Neon ya existian PaymentStatus/PaymentMethod
-- (schema push o intento previo). Esta migracion solo debe anadir
-- ApplicationStatus + courier_applications y alinear columnas de pago si siguen en TEXT.

-- CreateEnum (si ya existen, no falla)
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Paid', 'Failed', 'Refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('Cash', 'Online');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Convertir payment_method TEXT -> enum (sin DROP COLUMN)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'payment_method'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE "orders" ALTER COLUMN "payment_method" DROP DEFAULT;
    ALTER TABLE "orders"
      ALTER COLUMN "payment_method" TYPE "PaymentMethod"
      USING ("payment_method"::"PaymentMethod");
    ALTER TABLE "orders"
      ALTER COLUMN "payment_method" SET DEFAULT 'Cash'::"PaymentMethod";
  END IF;
END $$;

-- Convertir payment_status TEXT -> enum (sin DROP COLUMN)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'payment_status'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE "orders" ALTER COLUMN "payment_status" DROP DEFAULT;
    ALTER TABLE "orders"
      ALTER COLUMN "payment_status" TYPE "PaymentStatus"
      USING ("payment_status"::"PaymentStatus");
    ALTER TABLE "orders"
      ALTER COLUMN "payment_status" SET DEFAULT 'Pending'::"PaymentStatus";
  END IF;
END $$;

-- Tabla de postulaciones de domiciliarios
CREATE TABLE IF NOT EXISTS "courier_applications" (
    "id" TEXT NOT NULL,
    "courier_id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "courier_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "courier_applications_courier_id_restaurant_id_key"
  ON "courier_applications"("courier_id", "restaurant_id");

DO $$ BEGIN
  ALTER TABLE "courier_applications"
    ADD CONSTRAINT "courier_applications_courier_id_fkey"
    FOREIGN KEY ("courier_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "courier_applications"
    ADD CONSTRAINT "courier_applications_restaurant_id_fkey"
    FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;