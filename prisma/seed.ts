import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { seedCatalogs } from './seedCatalogs';

const prisma = new PrismaClient();

const PASSWORD = 'demo';

async function wipeAll() {
  await prisma.userReport.deleteMany();
  await prisma.deliveryReview.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.dispatch.deleteMany();
  await prisma.courierApplication.deleteMany();
  await prisma.promotionProduct.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.review.deleteMany();
  await prisma.order.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.productIngredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();
  // Catálogos no se borran: se re-siembran abajo
}

async function main() {
  console.log('Borrando todos los datos...');
  await wipeAll();

  console.log('Sembrando catálogos (comunas, vehículos, categorías)...');
  await seedCatalogs(prisma);

  const [comunas, vehicles, categories] = await Promise.all([
    prisma.comuna.count(),
    prisma.vehicleTypeCatalog.count(),
    prisma.menuCategoryTemplate.count(),
  ]);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await prisma.user.create({
    data: {
      id: 'usr-super',
      name: 'Super Admin',
      email: 'super@ffcore.co',
      password_hash: passwordHash,
      role: Role.superadmin,
      status: UserStatus.Activo,
      phone: '+573005550001',
    },
  });

  console.log('');
  console.log('Base lista — catálogos + superadmin');
  console.log('────────────────────────────────────');
  console.log(`Comunas:     ${comunas}`);
  console.log(`Vehículos:   ${vehicles}`);
  console.log(`Categorías:  ${categories}`);
  console.log('Email:       super@ffcore.co');
  console.log('Password:    demo');
  console.log('GET /api/v1/catalog/comunas');
  console.log('GET /api/v1/catalog/vehicle-types');
  console.log('GET /api/v1/catalog/menu-category-templates');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
