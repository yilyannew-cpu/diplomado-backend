/**
 * Garantiza catálogos en BD (selects del front).
 * Ejecutar tras migrate: npx tsx prisma/ensureCatalogs.ts
 */
import { PrismaClient } from '@prisma/client';
import { seedCatalogs } from './seedCatalogs';

const prisma = new PrismaClient();

async function main() {
  await seedCatalogs(prisma);
  const [comunas, vehicles, categories] = await Promise.all([
    prisma.comuna.count(),
    prisma.vehicleTypeCatalog.count(),
    prisma.menuCategoryTemplate.count(),
  ]);
  console.log(
    `[catalogs] OK — comunas: ${comunas}, vehículos: ${vehicles}, categorías: ${categories}`,
  );
}

main()
  .catch((e) => {
    console.error('[catalogs] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
