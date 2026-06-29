import { PrismaClient, Role, UserStatus, RestaurantStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('demo', 10);

  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'rest-ffcore' },
    update: {},
    create: {
      id: 'rest-ffcore',
      name: 'FFCore',
      tagline: 'Hamburguesas de autor',
      city: 'Medellín · El Poblado',
      address: 'Calle 10 #43-28',
      rating: 4.8,
      delivery_minutes: 25,
      accent: '#4f46e5',
      initials: 'BC',
      status: RestaurantStatus.Activo,
    },
  });

  const users = [
    {
      name: 'Laura Martínez',
      email: 'cliente@ffcore.co',
      role: Role.cliente,
      status: UserStatus.Activo,
      phone: '+57 310 555 0102',
    },
    {
      name: 'Juan Pérez',
      email: 'jp@ffcore.co',
      role: Role.cliente,
      status: UserStatus.Activo,
      phone: '+57 310 555 0103',
    },
    {
      name: 'Valentina Gómez',
      email: 'vale@ffcore.co',
      role: Role.cliente,
      status: UserStatus.Suspendido,
      phone: '+57 310 555 0104',
    },
    {
      name: 'Carlos Restrepo',
      email: 'admin@ffcore.co',
      role: Role.admin,
      status: UserStatus.Activo,
      phone: '+57 311 555 0211',
      restaurant_id: restaurant.id,
    },
    {
      name: 'María Poblado',
      email: 'poblado@ffcore.co',
      role: Role.admin,
      status: UserStatus.Activo,
      phone: '+57 311 555 0212',
      restaurant_id: restaurant.id,
    },
    {
      name: 'Super Admin',
      email: 'super@ffcore.co',
      role: Role.superadmin,
      status: UserStatus.Activo,
      phone: '+57 300 555 0001',
    },
    {
      name: 'Sebastián Domínguez',
      email: 'domi@ffcore.co',
      role: Role.domiciliario,
      status: UserStatus.Activo,
      phone: '+57 320 555 0301',
      vehicle: 'Moto AKT — PLA-23H',
      document_id: '1020304050',
    },
    {
      name: 'Seba Courier',
      email: 'seba@ffcore.co',
      role: Role.domiciliario,
      status: UserStatus.Activo,
      phone: '+57 320 555 0302',
      vehicle: 'Bici — BIK-01',
      document_id: '1030405060',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        password_hash: passwordHash,
      },
    });
  }

  console.log('Seed completado: 1 restaurante + 8 usuarios demo (password: demo)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
