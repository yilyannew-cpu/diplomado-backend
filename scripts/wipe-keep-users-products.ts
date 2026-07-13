/**
 * Limpia pedidos, reviews, promociones y reportes.
 * Conserva: users, products (+ restaurants, categories, ingredients/modifiers por FK).
 *
 * Uso:
 *   npx tsx scripts/wipe-keep-users-products.ts
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${name}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function safeDelete(table: string, fn: () => Promise<{ count: number }>) {
  if (!(await tableExists(table))) {
    console.log(`  skip ${table} (no existe)`);
    return 0;
  }
  const { count } = await fn();
  console.log(`  ${table}: ${count}`);
  return count;
}

async function safeCount(label: string, fn: () => Promise<number>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021') {
      return null;
    }
    throw e;
  }
}

async function counts() {
  return {
    users: await safeCount('users', () => prisma.user.count()),
    products: await safeCount('products', () => prisma.product.count()),
    restaurants: await safeCount('restaurants', () => prisma.restaurant.count()),
    categories: await safeCount('categories', () => prisma.category.count()),
    orders: await safeCount('orders', () => prisma.order.count()),
    promotions: await safeCount('promotions', () => prisma.promotion.count()),
    reviews: await safeCount('reviews', () => prisma.review.count()),
    delivery_reviews: await safeCount('delivery_reviews', () => prisma.deliveryReview.count()),
    user_reports: await safeCount('user_reports', () => prisma.userReport.count()),
  };
}

async function main() {
  console.log('ANTES', await counts());
  console.log('Eliminando...');

  await safeDelete('user_reports', () => prisma.userReport.deleteMany());
  await safeDelete('delivery_reviews', () => prisma.deliveryReview.deleteMany());
  await safeDelete('order_items', () => prisma.orderItem.deleteMany());
  await safeDelete('dispatches', () => prisma.dispatch.deleteMany());
  await safeDelete('orders', () => prisma.order.deleteMany());
  await safeDelete('promotion_products', () => prisma.promotionProduct.deleteMany());
  await safeDelete('promotions', () => prisma.promotion.deleteMany());
  await safeDelete('reviews', () => prisma.review.deleteMany());

  console.log('DESPUES', await counts());
  console.log('Listo — usuarios y productos intactos.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
