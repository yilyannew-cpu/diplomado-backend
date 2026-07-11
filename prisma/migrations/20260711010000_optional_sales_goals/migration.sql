-- Metas de ventas opcionales (diaria y mensual)
ALTER TABLE "restaurants" ALTER COLUMN "monthly_goal" DROP DEFAULT;
ALTER TABLE "restaurants" ALTER COLUMN "monthly_goal" DROP NOT NULL;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "daily_goal" INTEGER;

-- Quitar el default artificial de $18M para que la meta sea opt-in
UPDATE "restaurants" SET "monthly_goal" = NULL WHERE "monthly_goal" = 18000000;
