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
      initials: 'FC',
      status: RestaurantStatus.Activo,
    },
  });

  const paisaPollo = await prisma.restaurant.upsert({
    where: { id: 'rest-paisapollo' },
    update: {},
    create: {
      id: 'rest-paisapollo',
      name: 'Paisa Pollo',
      tagline: 'Pollo crocante & buffalo',
      city: 'Cúcuta · Centro',
      address: 'Avenida 4 #11-30 Centro',
      rating: 4.6,
      delivery_minutes: 30,
      accent: '#d97706',
      initials: 'PP',
      status: RestaurantStatus.Activo,
    },
  });

  const verdebrasa = await prisma.restaurant.upsert({
    where: { id: 'rest-verdebrasa' },
    update: {},
    create: {
      id: 'rest-verdebrasa',
      name: 'Verde & Brasa',
      tagline: 'Cocina vegetal a la brasa',
      city: 'Cúcuta · Atalaya',
      address: 'Calle 5 #0-10 Atalaya',
      rating: 4.7,
      delivery_minutes: 35,
      accent: '#16a34a',
      initials: 'VB',
      status: RestaurantStatus.Activo,
    },
  });

  const dulcecaribe = await prisma.restaurant.upsert({
    where: { id: 'rest-dulcecaribe' },
    update: {},
    create: {
      id: 'rest-dulcecaribe',
      name: 'Dulce Caribe',
      tagline: 'Postres y bebidas tropicales',
      city: 'Cúcuta · San Luis',
      address: 'Calle 1 #3-15 San Luis',
      rating: 4.9,
      delivery_minutes: 20,
      accent: '#db2777',
      initials: 'DC',
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
      restaurant_id: paisaPollo.id,
    },
    {
      id: 'prod-04',
      name: 'Veggie Supreme',
      price: 22500,
      category_id: platosId,
      description: 'Medallón de garbanzo, aguacate, rúgula y mayo de chipotle.',
      image: 'https://images.unsplash.com/photo-1525059696034-4967a729002e?auto=format&fit=crop&w=800&q=80',
      available: true,
      restaurant_id: verdebrasa.id,
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
      id: 'prod-06',
      name: 'Aros de Cebolla',
      price: 8900,
      category_id: acompId,
      description: 'Cebolla dulce empanizada en panko crocante.',
      image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=80',
      available: true,
      restaurant_id: paisaPollo.id,
    },
    {
      id: 'prod-07',
      name: 'Limonada de Coco',
      price: 7500,
      category_id: bebidasId,
      description: 'Receta caribeña con leche de coco fresca.',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
      available: true,
      restaurant_id: dulcecaribe.id,
    },
    {
      id: 'prod-08',
      name: 'Brownie de Chocolate',
      price: 11500,
      category_id: postresId,
      description: 'Brownie tibio con helado de vainilla bourbon.',
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
      available: true,
      restaurant_id: dulcecaribe.id,
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
    {
      id: 'prod-10',
      name: 'Tocino crujiente',
      price: 4200,
      category_id: adicionesId,
      description: 'Dos tiras de tocino ahumado extra crocante.',
      image: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?auto=format&fit=crop&w=800&q=80',
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

  // --- INGREDIENTS & MODIFIERS ---
  const ingredients = ['Pan Brioche', 'Carne de Res (150g)', 'Queso Cheddar', 'Tocino', 'Salsa de la casa', 'Tomate', 'Cebolla Grillé'];
  const createdIngredients = [];
  for (const ing of ingredients) {
    const created = await prisma.ingredient.upsert({
      where: { id: `ing-${ing.replace(/\s+/g, '-').toLowerCase()}` },
      update: {},
      create: { id: `ing-${ing.replace(/\s+/g, '-').toLowerCase()}`, name: ing },
    });
    createdIngredients.push(created);
  }

  // Link ingredients to Monster Bacon
  for (const ing of createdIngredients) {
    await prisma.productIngredient.upsert({
      where: { product_id_ingredient_id: { product_id: 'prod-01', ingredient_id: ing.id } },
      update: {},
      create: { product_id: 'prod-01', ingredient_id: ing.id },
    });
  }

  // Add a ModifierGroup: Término de la carne
  const termGroup = await prisma.modifierGroup.upsert({
    where: { id: 'modg-termino-01' },
    update: {},
    create: {
      id: 'modg-termino-01',
      name: 'Término de la carne',
      product_id: 'prod-01',
      min_selections: 1,
      max_selections: 1,
    },
  });

  const terminos = ['Medio', 'Tres Cuartos', 'Bien Asada'];
  for (let i=0; i<terminos.length; i++) {
    await prisma.modifierOption.upsert({
      where: { id: `modo-term-${i}` },
      update: {},
      create: {
        id: `modo-term-${i}`,
        name: terminos[i],
        price_extra: 0,
        group_id: termGroup.id,
      },
    });
  }

  // Add a ModifierGroup: Extras
  const extrasGroup = await prisma.modifierGroup.upsert({
    where: { id: 'modg-extras-01' },
    update: {},
    create: {
      id: 'modg-extras-01',
      name: 'Adiciona Extras',
      product_id: 'prod-01',
      min_selections: 0,
      max_selections: 3,
    },
  });

  const extras = [
    { name: 'Tocino Crujiente', price: 3500 },
    { name: 'Queso Cheddar', price: 2500 },
    { name: 'Papas a la francesa pequeñas', price: 4000 },
  ];
  for (let i=0; i<extras.length; i++) {
    await prisma.modifierOption.upsert({
      where: { id: `modo-extra-${i}` },
      update: {},
      create: {
        id: `modo-extra-${i}`,
        name: extras[i].name,
        price_extra: extras[i].price,
        group_id: extrasGroup.id,
      },
    });
  }

  console.log('Seed completado: con ingredientes y modificadores para Monster Bacon');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

