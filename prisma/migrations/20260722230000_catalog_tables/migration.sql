-- Catálogos de dominio (comunas, vehículos, plantillas de categoría) + campos courier en users

CREATE TABLE IF NOT EXISTS "comunas" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "comunas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "comunas_code_key" ON "comunas"("code");

CREATE TABLE IF NOT EXISTS "vehicle_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "requires_plate" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_types_code_key" ON "vehicle_types"("code");

CREATE TABLE IF NOT EXISTS "menu_category_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "menu_category_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "menu_category_templates_name_key" ON "menu_category_templates"("name");

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vehicle_type_code" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vehicle_plate" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vehicle_description" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emergency_contact_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" TEXT;

-- Seed comunas Cúcuta
INSERT INTO "comunas" ("id", "code", "label", "position", "active") VALUES
  ('comuna-01', 'Centro', 'Comuna 1 · Centro', 1, true),
  ('comuna-02', 'Centro Oriental', 'Comuna 2 · Centro Oriental', 2, true),
  ('comuna-03', 'Oriental Oriental', 'Comuna 3 · Oriental Oriental', 3, true),
  ('comuna-04', 'Oriental Occidental', 'Comuna 4 · Oriental Occidental', 4, true),
  ('comuna-05', 'Occidental', 'Comuna 5 · Occidental', 5, true),
  ('comuna-06', 'Sur Occidental', 'Comuna 6 · Sur Occidental', 6, true),
  ('comuna-07', 'Sur Oriental', 'Comuna 7 · Sur Oriental', 7, true),
  ('comuna-08', 'Norte', 'Comuna 8 · Norte', 8, true),
  ('comuna-09', 'Atalaya', 'Comuna 9 · Atalaya', 9, true),
  ('comuna-10', 'La Libertad', 'Comuna 10 · La Libertad', 10, true)
ON CONFLICT ("code") DO UPDATE SET
  "label" = EXCLUDED."label",
  "position" = EXCLUDED."position",
  "active" = EXCLUDED."active";

INSERT INTO "vehicle_types" ("id", "code", "label", "position", "active", "requires_plate") VALUES
  ('vtype-moto', 'Moto', 'Motocicleta', 1, true, true),
  ('vtype-bici', 'Bici', 'Bicicleta', 2, true, false),
  ('vtype-auto', 'Automóvil', 'Automóvil', 3, true, true),
  ('vtype-otro', 'Otro', 'Otro', 4, true, false)
ON CONFLICT ("code") DO UPDATE SET
  "label" = EXCLUDED."label",
  "position" = EXCLUDED."position",
  "active" = EXCLUDED."active",
  "requires_plate" = EXCLUDED."requires_plate";

INSERT INTO "menu_category_templates" ("id", "name", "position", "active") VALUES
  ('mcat-entradas', 'Entradas', 1, true),
  ('mcat-principales', 'Platos principales', 2, true),
  ('mcat-acompanamientos', 'Acompañamientos', 3, true),
  ('mcat-bebidas', 'Bebidas', 4, true),
  ('mcat-postres', 'Postres', 5, true),
  ('mcat-adiciones', 'Adiciones', 6, true)
ON CONFLICT ("name") DO UPDATE SET
  "position" = EXCLUDED."position",
  "active" = EXCLUDED."active";
