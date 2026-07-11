/**
 * Limpia solo pedidos (orders) y tablas dependientes.
 * Conserva usuarios, restaurantes, productos, categorías, etc.
 *
 * Uso:
 *   DATABASE_URL="..." npx tsx scripts/wipe-orders.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.order.count();
  console.log(`Pedidos actuales: ${before}`);

  const deletedItems = await prisma.orderItem.deleteMany();
  const deletedDispatches = await prisma.dispatch.deleteMany();
  const deletedOrders = await prisma.order.deleteMany();

  console.log(`order_items eliminados: ${deletedItems.count}`);
  console.log(`dispatches eliminados: ${deletedDispatches.count}`);
  console.log(`orders eliminados: ${deletedOrders.count}`);
  console.log('Listo — Kanban vacío. Puedes crear pedidos con POST /orders.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
