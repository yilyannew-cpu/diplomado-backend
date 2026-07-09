import { PrismaClient, Role, UserStatus, RestaurantStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Limpia datos sin tocar el esquema (orden por dependencias FK)
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
      name: 'Carlos Restrepo',
      email: 'admin@ffcore.co',
      role: Role.admin,
      status: UserStatus.Activo,
      phone: '+57 311 555 0211',
      restaurant_id: restaurant.id,
    },
    {
      name: 'Sebastián Domínguez',
      email: 'domi@ffcore.co',
      role: Role.domiciliario,
      status: UserStatus.Activo,
      phone: '+57 313 555 0433',
      vehicle: 'Moto AKT — PLA-23H',
      document_id: '1035678901',
      restaurant_id: restaurant.id,
    },
    {
      name: 'Super Admin',
      email: 'super@ffcore.co',
      role: Role.superadmin,
      status: UserStatus.Activo,
      phone: '+57 300 555 0001',
    },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: {
        ...user,
        password_hash: passwordHash,
      },
    });
  }

  // --- CATEGORIES & PRODUCTS ---
  const categoryDefs = [
    { name: 'Entradas', position: 0, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Platos principales', position: 1, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
    { name: 'Acompañamientos', position: 2, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80' },
    { name: 'Bebidas', position: 3, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80' },
    { name: 'Postres', position: 4, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Adiciones', position: 5, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80' },
  ];

  const restaurantIds = [restaurant.id, paisaPollo.id, verdebrasa.id, dulcecaribe.id];
  const categoryMap = new Map<string, string>();

  for (const restId of restaurantIds) {
    for (const cat of categoryDefs) {
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          position: cat.position,
          image: cat.image,
          restaurant_id: restId,
        },
      });
      categoryMap.set(`${restId}:${cat.name}`, created.id);
    }
  }

  const platosId = categoryMap.get(`${restaurant.id}:Platos principales`)!;
  const acompId = categoryMap.get(`${restaurant.id}:Acompañamientos`)!;
  const bebidasId = categoryMap.get(`${dulcecaribe.id}:Bebidas`)!;
  const postresId = categoryMap.get(`${dulcecaribe.id}:Postres`)!;
  const adicionesId = categoryMap.get(`${restaurant.id}:Adiciones`)!;
  const paisaPlatosId = categoryMap.get(`${paisaPollo.id}:Platos principales`)!;
  const paisaAcompId = categoryMap.get(`${paisaPollo.id}:Acompañamientos`)!;
  const verdePlatosId = categoryMap.get(`${verdebrasa.id}:Platos principales`)!;

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
      category_id: paisaPlatosId,
      description: 'Pollo crocante, salsa buffalo, blue cheese y apio.',
      image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80',
      available: false, // Este debe estar oculto en frontend
      restaurant_id: paisaPollo.id,
    },
    {
      id: 'prod-04',
      name: 'Veggie Supreme',
      price: 22500,
      category_id: verdePlatosId,
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
      category_id: paisaAcompId,
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

  // --- REVIEWS ---
  const reviewSamples = [
    { rating: 5, comment: 'Excelente Monster Bacon', customer_name: 'Ana Gómez' },
    { rating: 4.5, comment: 'Muy buen servicio', customer_name: 'Luis Pérez' },
    { rating: 4, comment: 'Llegó caliente y a tiempo', customer_name: 'María López' },
  ];
  for (const r of reviewSamples) {
    await prisma.review.create({
      data: { ...r, restaurant_id: restaurant.id },
    });
  }

  // --- SAMPLE ORDERS ---
  const domiciliario = await prisma.user.findUnique({ where: { email: 'domi@ffcore.co' } });
  await prisma.order.create({
    data: {
      code: 'PED-101',
      customer_name: 'Juan Pablo Montoya',
      address: 'Calle 15 #11-45',
      phone: '+573155550544',
      notes: 'Torre B',
      zone: 'El Poblado',
      status: 'EnPreparacion',
      total: 52700,
      delivery_fee: 5000,
      restaurant_id: restaurant.id,
      items: {
        create: [{
          product_id: 'prod-02',
          quantity: 1,
          unit_price: 32700,
          customizations: {
            removed_ingredients: ['Cebolla grillé'],
            added_modifiers: { Adiciones: ['Tocino crujiente'] },
            extra_price: 4200,
          },
        }],
      },
    },
  });

  await prisma.order.create({
    data: {
      code: 'PED-102',
      customer_name: 'Andrés Quintero',
      address: 'Cra 7 #16-21',
      phone: '+573155550545',
      zone: 'San Luis',
      status: 'Listo',
      total: 57000,
      delivery_fee: 6000,
      restaurant_id: restaurant.id,
      delivery_person_id: domiciliario?.id,
      items: {
        create: [{
          product_id: 'prod-01',
          quantity: 2,
          unit_price: 24900,
        }],
      },
    },
  });

  // --- PROMOTION ---
  await prisma.promotion.create({
    data: {
      name: '2x1 Monster Bacon',
      discount_percent: 50,
      start_date: new Date('2025-07-01'),
      end_date: new Date('2026-12-31'),
      active: true,
      restaurant_id: restaurant.id,
      products: { create: [{ product_id: 'prod-01' }] },
    },
  });

  console.log('Seed completado: usuarios, restaurantes, categorías, productos, órdenes demo y promociones. Password: demo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

