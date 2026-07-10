import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = 'demo';

async function wipeAll() {
  await prisma.userReport.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.dispatch.deleteMany();
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
}

async function main() {
  console.log('Borrando todos los datos...');
  await wipeAll();

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
  console.log('Base de datos vacía — solo superadmin');
  console.log('────────────────────────────────────');
  console.log('Email:    super@ffcore.co');
  console.log('Password: demo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
