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

  // --- CATEGORIES & PRODUCTS ---
  const categories = [
    { name: 'Platos principales', position: 1 },
    { name: 'Acompañamientos', position: 2 },
    { name: 'Bebidas', position: 3 },
    { name: 'Postres', position: 4 },
    { name: 'Adiciones', position: 5 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  const platosId = (await prisma.category.findUnique({ where: { name: 'Platos principales' } }))!.id;
  const acompId = (await prisma.category.findUnique({ where: { name: 'Acompañamientos' } }))!.id;
  const bebidasId = (await prisma.category.findUnique({ where: { name: 'Bebidas' } }))!.id;
  const postresId = (await prisma.category.findUnique({ where: { name: 'Postres' } }))!.id;
  const adicionesId = (await prisma.category.findUnique({ where: { name: 'Adiciones' } }))!.id;

  const products = [
    {
      id: 'prod-01',
      name: 'Monster Bacon',
      price: 24900,
      category_id: platosId,
      description: 'Doble carne premium, tocino crujiente y queso cheddar fundido.',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      available: true,
      restaurant_id: restaurant.id,
    },
    {
      id: 'prod-02',
      name: 'La Paisa Smash',
      price: 28500,
      category_id: platosId,
      description: 'Carne Angus, chicharrón, plátano maduro y queso costeño.',
      image: 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=800&q=80',
      available: true,
      restaurant_id: restaurant.id,
    },
    {
      id: 'prod-03',
      name: 'Chicken Buffalo',
      price: 26900,
      category_id: platosId,
      description: 'Pollo crocante, salsa buffalo, blue cheese y apio.',
      image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80',
      available: false, // Este debe estar oculto en frontend
      restaurant_id: restaurant.id,
    },
    {
      id: 'prod-05',
      name: 'Papas Rústicas',
      price: 9500,
      category_id: acompId,
      description: 'Papas en gajos con piel, sal de mar y aioli de la casa.',
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
      available: true,
      restaurant_id: restaurant.id,
    },
    {
      id: 'prod-07',
      name: 'Limonada de Coco',
      price: 7500,
      category_id: bebidasId,
      description: 'Receta caribeña con leche de coco fresca.',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
      available: true,
      restaurant_id: restaurant.id,
    },
    {
      id: 'prod-08',
      name: 'Brownie de Chocolate',
      price: 11500,
      category_id: postresId,
      description: 'Brownie tibio con helado de vainilla bourbon.',
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
      available: true,
      restaurant_id: restaurant.id,
    },
    {
      id: 'prod-09',
      name: 'Queso cheddar extra',
      price: 3500,
      category_id: adicionesId,
      description: 'Porción adicional de queso cheddar fundido.',
      image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&q=80',
      available: true,
      restaurant_id: restaurant.id,
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: {},
      create: prod,
    });
  }

  console.log('Seed completado: 1 restaurante, 8 usuarios, 5 categorías, 7 productos');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

