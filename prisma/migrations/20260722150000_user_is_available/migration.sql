-- Disponibilidad de turno del domiciliario (interruptor Buscando / Desconectado)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_available" BOOLEAN NOT NULL DEFAULT false;
