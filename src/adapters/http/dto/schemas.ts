import { z } from 'zod';
import { Role, UserStatus, OrderStatus } from '../../../domain/enums';
import { isCucutaComuna } from '../../../domain/constants/cucutaComunas';

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[a-zA-Z]/, 'La contraseña debe incluir al menos una letra')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número');

const phoneSchema = z
  .string()
  .min(10, 'El teléfono debe tener al menos 10 dígitos')
  .refine((v) => /\+?57/.test(v) || /\d{10,}/.test(v.replace(/\D/g, '')), {
    message: 'Formato de teléfono inválido. Use +57...',
  });

/** http(s), /uploads/... o data:image (persistente en Neon tras redeploy de Render). */
const imageUrlSchema = z
  .string()
  .min(1)
  .refine(
    (v) =>
      v.startsWith('data:image/') ||
      v.startsWith('/uploads/') ||
      /^https?:\/\//i.test(v),
    { message: 'URL de imagen inválida' }
  );

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const registerClientSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email('Email inválido'),
    password: passwordSchema,
    password_confirmation: z.string(),
    phone: phoneSchema,
    comuna: z
      .string()
      .min(1, 'Selecciona una comuna')
      .refine(isCucutaComuna, { message: 'Selecciona una comuna válida' }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  });

export const registerRestaurantSchema = z
  .object({
    owner_name: z.string().min(2).max(100),
    email: z.string().email('Email inválido'),
    password: passwordSchema,
    password_confirmation: z.string(),
    phone: phoneSchema,
    restaurant_name: z.string().min(2).max(120),
    tagline: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    address: z.string().min(1).max(255),
    delivery_minutes: z.number().int().min(10).max(120).optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  });

const vehicleTypeEnum = z.enum(['Moto', 'Bici', 'Automóvil', 'Otro']);

export const registerCourierSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email('Email inválido'),
    password: passwordSchema,
    password_confirmation: z.string(),
    phone: phoneSchema,
    document_id: z.string().min(6).max(20),
    vehicle_type: vehicleTypeEnum,
    vehicle_plate: z.string().min(1).max(20),
    vehicle_description: z.string().max(100).optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  });

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email('Email inválido'),
  password: passwordSchema,
  role: z.nativeEnum(Role),
  phone: z.string().optional(),
  vehicle: z.string().optional(),
  restaurant_id: z.string().min(1).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().nullable().optional(),
  vehicle: z.string().nullable().optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  restaurant_id: z.string().min(1).nullable().optional(),
});

export const rejectUserSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const updateProfileSchema = z
  .object({
    email: z.string().email('Email inválido').optional(),
    phone: phoneSchema.optional(),
    comuna: z
      .string()
      .min(1, 'Selecciona una comuna')
      .refine(isCucutaComuna, { message: 'Selecciona una comuna válida' })
      .optional(),
  })
  .refine(
    (data) => data.email !== undefined || data.phone !== undefined || data.comuna !== undefined,
    { message: 'Debe enviar al menos email, teléfono o comuna' },
  );

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'La contraseña actual es requerida'),
    password: passwordSchema,
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  });

export const listUsersQuerySchema = z.object({
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  q: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const listOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
});

export const restaurantIdParamSchema = z.object({
  restaurantId: z.string().min(1),
});

export const categoryIdParamSchema = z.object({
  categoryId: z.string().uuid('ID inválido'),
});

export const promotionIdParamSchema = z.object({
  promotionId: z.string().uuid('ID inválido'),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  tagline: z.string().max(200).nullable().optional(),
  city: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(255).optional(),
  delivery_minutes: z.number().int().min(10).max(120).optional(),
  /** null = sin meta (opcional). */
  monthly_goal: z.union([z.number().int().min(0), z.null()]).optional(),
  daily_goal: z.union([z.number().int().min(0), z.null()]).optional(),
  accent: z.string().max(20).optional(),
  logo: imageUrlSchema.nullable().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  position: z.number().int().min(0).optional(),
  image: imageUrlSchema.nullable().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(80).optional(),
  position: z.number().int().min(0).optional(),
  image: imageUrlSchema.nullable().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(1).max(500),
  price: z.number().int().min(0),
  image: imageUrlSchema,
  category_id: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  restaurant_id: z.string().min(1).optional(),
  restaurantId: z.string().min(1).optional(),
  available: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().min(1).max(500).optional(),
  price: z.number().int().min(0).optional(),
  image: imageUrlSchema.optional(),
  category_id: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  available: z.boolean().optional(),
});

export const productIngredientsSchema = z.object({
  ingredients: z.array(z.object({
    name: z.string().min(1),
    available: z.boolean(),
  })),
});

export const productModifierGroupsSchema = z.object({
  modifier_groups: z.array(z.object({
    name: z.string().min(1),
    min_selections: z.number().int().min(0),
    max_selections: z.number().int().min(0),
    options: z.array(z.object({
      name: z.string().min(1),
      price_extra: z.number().int().min(0),
      available: z.boolean(),
    })),
  })).optional(),
  modifierGroups: z.array(z.object({
    name: z.string().min(1),
    min_selections: z.number().int().min(0),
    max_selections: z.number().int().min(0),
    options: z.array(z.object({
      name: z.string().min(1),
      price_extra: z.number().int().min(0),
      available: z.boolean(),
    })),
  })).optional(),
});

export const createPromotionSchema = z.object({
  name: z.string().min(2).max(120),
  discount_percent: z.number().int().min(1).max(90),
  product_ids: z.array(z.string().uuid()).min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  active: z.boolean().optional(),
});

export const updatePromotionSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  discount_percent: z.number().int().min(1).max(90).optional(),
  product_ids: z.array(z.string().uuid()).min(1).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  active: z.boolean().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const assignCourierSchema = z.object({
  courier_id: z.string().uuid().optional(),
  courierId: z.string().uuid().optional(),
}).refine((d) => d.courier_id || d.courierId, { message: 'courier_id es requerido' });

export const batchOrdersSchema = z.object({
  order_ids: z.array(z.string().uuid()).min(1).optional(),
  orderIds: z.array(z.string().uuid()).min(1).optional(),
  courier_id: z.string().uuid().optional(),
  courierId: z.string().uuid().optional(),
}).refine((d) => (d.order_ids?.length || d.orderIds?.length), { message: 'order_ids es requerido' })
  .refine((d) => d.courier_id || d.courierId, { message: 'courier_id es requerido' });

export const batchDispatchSchema = z.object({
  order_ids: z.array(z.string().uuid()).min(1).optional(),
  orderIds: z.array(z.string().uuid()).min(1).optional(),
  restaurant_id: z.string().min(1).optional(),
  restaurantId: z.string().min(1).optional(),
}).refine((d) => (d.order_ids?.length || d.orderIds?.length), { message: 'order_ids es requerido' });

export const restaurantOrdersQuerySchema = z.object({
  status: z.string().optional(),
});

export const reviewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const salesReportQuerySchema = z.object({
  preset: z.enum(['today', 'week', 'month', 'year', 'custom']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const dateRangeQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const dispatchQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  period: z.enum(['today', 'month', 'year']).optional(),
});

export const couriersAvailableQuerySchema = z.object({
  batch_size: z.coerce.number().int().min(1).max(10).optional(),
});

const orderCustomizationSchema = z
  .object({
    addition_ids: z.array(z.string().min(1)).optional(),
    side_ids: z.array(z.string().min(1)).optional(),
    drink_ids: z.array(z.string().min(1)).optional(),
    special_instructions: z.string().max(500).optional(),
    /** Informativo; el servidor recalcula. */
    extra_price: z.number().int().min(0).optional(),
    /** Compatibilidad pedidos antiguos */
    removed_ingredients: z.array(z.string()).optional(),
    added_modifiers: z.record(z.array(z.string())).optional(),
  })
  .optional();

const orderItemSchema = z.object({
  product_id: z.string().min(1, 'product_id es requerido'),
  quantity: z.number().int().min(1).max(50),
  customizations: orderCustomizationSchema,
});

export const createOrderSchema = z.object({
  customer_name: z.string().min(2).max(100),
  address: z.string().min(5).max(255),
  phone: phoneSchema,
  notes: z.string().max(500).optional(),
  zone: z.string().max(100).optional(),
  restaurant_id: z.string().min(1),
  /** Tarifa por km de ruta (COP). Mín. 4500; múltiplo de 100. */
  delivery_fee: z
    .number()
    .int()
    .min(4500)
    .max(200000)
    .refine((n) => n % 100 === 0, { message: 'delivery_fee debe ser múltiplo de 100' })
    .optional(),
  items: z.array(orderItemSchema).min(1, 'Debe incluir al menos un producto'),
});

export const orderTrackParamSchema = z.object({
  code: z.string().regex(/^PED-\d+$/, 'Código de pedido inválido (ej. PED-101)'),
});

export const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
  customer_name: z.string().min(2).max(100),
});
