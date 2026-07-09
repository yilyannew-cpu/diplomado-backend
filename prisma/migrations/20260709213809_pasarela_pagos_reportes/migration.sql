-- Pasarela pagos + reportes (idempotente, compatible con panel admin)

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_observation" TEXT;

ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "nequi_number" TEXT;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "nequi_owner" TEXT;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "breb_key" TEXT;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "breb_owner" TEXT;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "breb_qr_url" TEXT;

CREATE TABLE IF NOT EXISTS "user_reports" (
    "id" TEXT NOT NULL,
    "reported_user" TEXT NOT NULL,
    "reported_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);
