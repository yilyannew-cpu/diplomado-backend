import type { PrismaClient } from '@prisma/client';
import { COMUNAS, VEHICLE_TYPES, MENU_CATEGORY_TEMPLATES } from './catalogSeedData';

/**
 * Upsert idempotente de catálogos (comunas, vehículos, plantillas de menú).
 * Seguro en cada arranque / migrate: no borra usuarios ni pedidos.
 */
export async function seedCatalogs(prisma: PrismaClient): Promise<void> {
  for (const row of COMUNAS) {
    await prisma.comuna.upsert({
      where: { code: row.code },
      create: { ...row, active: true },
      update: { label: row.label, position: row.position, active: true },
    });
  }

  for (const row of VEHICLE_TYPES) {
    await prisma.vehicleTypeCatalog.upsert({
      where: { code: row.code },
      create: { ...row, active: true },
      update: {
        label: row.label,
        position: row.position,
        requires_plate: row.requires_plate,
        active: true,
      },
    });
  }

  for (const row of MENU_CATEGORY_TEMPLATES) {
    await prisma.menuCategoryTemplate.upsert({
      where: { name: row.name },
      create: { ...row, active: true },
      update: { position: row.position, active: true },
    });
  }
}
