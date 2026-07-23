/**
 * Seed idempotente de catálogos (sin tsx).
 * Uso en producción/Docker:
 *   node scripts/ensure-catalogs.cjs
 */
const { PrismaClient } = require('@prisma/client');

const COMUNAS = [
  { id: 'comuna-01', code: 'Centro', label: 'Comuna 1 · Centro', position: 1 },
  { id: 'comuna-02', code: 'Centro Oriental', label: 'Comuna 2 · Centro Oriental', position: 2 },
  { id: 'comuna-03', code: 'Oriental Oriental', label: 'Comuna 3 · Oriental Oriental', position: 3 },
  { id: 'comuna-04', code: 'Oriental Occidental', label: 'Comuna 4 · Oriental Occidental', position: 4 },
  { id: 'comuna-05', code: 'Occidental', label: 'Comuna 5 · Occidental', position: 5 },
  { id: 'comuna-06', code: 'Sur Occidental', label: 'Comuna 6 · Sur Occidental', position: 6 },
  { id: 'comuna-07', code: 'Sur Oriental', label: 'Comuna 7 · Sur Oriental', position: 7 },
  { id: 'comuna-08', code: 'Norte', label: 'Comuna 8 · Norte', position: 8 },
  { id: 'comuna-09', code: 'Atalaya', label: 'Comuna 9 · Atalaya', position: 9 },
  { id: 'comuna-10', code: 'La Libertad', label: 'Comuna 10 · La Libertad', position: 10 },
];

const VEHICLE_TYPES = [
  { id: 'vtype-moto', code: 'Moto', label: 'Motocicleta', position: 1, requires_plate: true },
  { id: 'vtype-bici', code: 'Bici', label: 'Bicicleta', position: 2, requires_plate: false },
  { id: 'vtype-auto', code: 'Automóvil', label: 'Automóvil', position: 3, requires_plate: true },
  { id: 'vtype-otro', code: 'Otro', label: 'Otro', position: 4, requires_plate: false },
];

const MENU_CATEGORY_TEMPLATES = [
  { id: 'mcat-entradas', name: 'Entradas', position: 1 },
  { id: 'mcat-principales', name: 'Platos principales', position: 2 },
  { id: 'mcat-acompanamientos', name: 'Acompañamientos', position: 3 },
  { id: 'mcat-bebidas', name: 'Bebidas', position: 4 },
  { id: 'mcat-postres', name: 'Postres', position: 5 },
  { id: 'mcat-adiciones', name: 'Adiciones', position: 6 },
];

async function seedCatalogs(prisma) {
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

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedCatalogs(prisma);
    const [comunas, vehicles, categories] = await Promise.all([
      prisma.comuna.count(),
      prisma.vehicleTypeCatalog.count(),
      prisma.menuCategoryTemplate.count(),
    ]);
    console.log(
      `[catalogs] OK — comunas: ${comunas}, vehículos: ${vehicles}, categorías: ${categories}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('[catalogs] Error:', e);
  process.exit(1);
});
