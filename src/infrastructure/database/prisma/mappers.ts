import { User as PrismaUser, Restaurant as PrismaRestaurant, Role as PrismaRole, UserStatus as PrismaUserStatus, RestaurantStatus as PrismaRestaurantStatus, OrderStatus as PrismaOrderStatus, Category as PrismaCategory, Product as PrismaProduct, Order as PrismaOrder, OrderItem as PrismaOrderItem } from '@prisma/client';
import { User } from '../../../domain/entities/User';
import { Restaurant } from '../../../domain/entities/Restaurant';
import { Category } from '../../../domain/entities/Category';
import { Product, ProductWithCategory } from '../../../domain/entities/Product';
import { Order, OrderItem } from '../../../domain/entities/Order';
import { Role, UserStatus, RestaurantStatus, OrderStatus } from '../../../domain/enums';

const roleMap: Record<PrismaRole, Role> = {
  cliente: Role.CLIENTE,
  admin: Role.ADMIN,
  domiciliario: Role.DOMICILIARIO,
  superadmin: Role.SUPERADMIN,
};

const roleToPrisma: Record<Role, PrismaRole> = {
  [Role.CLIENTE]: 'cliente',
  [Role.ADMIN]: 'admin',
  [Role.DOMICILIARIO]: 'domiciliario',
  [Role.SUPERADMIN]: 'superadmin',
};

const statusMap: Record<PrismaUserStatus, UserStatus> = {
  Activo: UserStatus.ACTIVO,
  Pendiente: UserStatus.PENDIENTE,
  Suspendido: UserStatus.SUSPENDIDO,
  Rechazado: UserStatus.RECHAZADO,
};

const statusToPrisma: Record<UserStatus, PrismaUserStatus> = {
  [UserStatus.ACTIVO]: 'Activo',
  [UserStatus.PENDIENTE]: 'Pendiente',
  [UserStatus.SUSPENDIDO]: 'Suspendido',
  [UserStatus.RECHAZADO]: 'Rechazado',
};

const restaurantStatusMap: Record<PrismaRestaurantStatus, RestaurantStatus> = {
  Activo: RestaurantStatus.ACTIVO,
  Pendiente: RestaurantStatus.PENDIENTE,
  Suspendido: RestaurantStatus.SUSPENDIDO,
  Rechazado: RestaurantStatus.RECHAZADO,
};

const restaurantStatusToPrisma: Record<RestaurantStatus, PrismaRestaurantStatus> = {
  [RestaurantStatus.ACTIVO]: 'Activo',
  [RestaurantStatus.PENDIENTE]: 'Pendiente',
  [RestaurantStatus.SUSPENDIDO]: 'Suspendido',
  [RestaurantStatus.RECHAZADO]: 'Rechazado',
};

const orderStatusMap: Record<PrismaOrderStatus, OrderStatus> = {
  Recibido: OrderStatus.RECIBIDO,
  EnPreparacion: OrderStatus.EN_PREPARACION,
  Listo: OrderStatus.LISTO,
  EnCamino: OrderStatus.EN_CAMINO,
  Entregado: OrderStatus.ENTREGADO,
  Cancelado: OrderStatus.CANCELADO,
};

const orderStatusToPrisma: Record<OrderStatus, PrismaOrderStatus> = {
  [OrderStatus.RECIBIDO]: 'Recibido',
  [OrderStatus.EN_PREPARACION]: 'EnPreparacion',
  [OrderStatus.LISTO]: 'Listo',
  [OrderStatus.EN_CAMINO]: 'EnCamino',
  [OrderStatus.ENTREGADO]: 'Entregado',
  [OrderStatus.CANCELADO]: 'Cancelado',
};

export function mapUser(record: PrismaUser): User {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    passwordHash: record.password_hash,
    role: roleMap[record.role],
    phone: record.phone,
    vehicle: record.vehicle,
    documentId: record.document_id,
    avatar: record.avatar,
    comuna: (record as { comuna?: string | null }).comuna ?? null,
    status: statusMap[record.status],
    restaurantId: record.restaurant_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapRestaurant(record: PrismaRestaurant): Restaurant {
  return {
    id: record.id,
    name: record.name,
    tagline: record.tagline,
    city: record.city,
    address: record.address,
    rating: record.rating,
    deliveryMinutes: record.delivery_minutes,
    monthlyGoal: record.monthly_goal ?? null,
    dailyGoal: (record as { daily_goal?: number | null }).daily_goal ?? null,
    accent: record.accent,
    initials: record.initials,
    logo: (record as { logo?: string | null }).logo ?? null,
    status: restaurantStatusMap[record.status],
    
    // Payment config
    nequiNumber: record.nequi_number,
    nequiOwner: record.nequi_owner,
    brebKey: record.breb_key,
    brebOwner: record.breb_owner,
    brebQrUrl: record.breb_qr_url,

    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapCategory(record: PrismaCategory): Category {
  return {
    id: record.id,
    name: record.name,
    position: record.position,
    image: record.image,
    restaurantId: record.restaurant_id,
  };
}

import { Ingredient, ModifierGroup, ModifierOption } from '../../../domain/entities/Product';
import { 
  Ingredient as PrismaIngredient,
  ModifierGroup as PrismaModifierGroup,
  ModifierOption as PrismaModifierOption,
  ProductIngredient as PrismaProductIngredient
} from '@prisma/client';

export function mapIngredient(record: PrismaIngredient): Ingredient {
  return {
    id: record.id,
    name: record.name,
    available: record.available,
  };
}

export function mapModifierOption(record: PrismaModifierOption): ModifierOption {
  return {
    id: record.id,
    name: record.name,
    priceExtra: record.price_extra,
    available: record.available,
    groupId: record.group_id,
  };
}

export function mapModifierGroup(record: PrismaModifierGroup & { options?: PrismaModifierOption[] }): ModifierGroup {
  return {
    id: record.id,
    name: record.name,
    productId: record.product_id,
    minSelections: record.min_selections,
    maxSelections: record.max_selections,
    options: record.options ? record.options.map(mapModifierOption) : [],
  };
}

type FullPrismaProduct = PrismaProduct & { 
  ingredients?: (PrismaProductIngredient & { ingredient: PrismaIngredient })[];
  modifier_groups?: (PrismaModifierGroup & { options: PrismaModifierOption[] })[];
};

export function mapProduct(record: FullPrismaProduct): Product {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    price: record.price,
    image: record.image,
    available: record.available,
    categoryId: record.category_id,
    restaurantId: record.restaurant_id,
    ingredients: record.ingredients?.map(pi => mapIngredient(pi.ingredient)),
    modifierGroups: record.modifier_groups?.map(mapModifierGroup),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapProductWithCategory(record: FullPrismaProduct & { category: PrismaCategory }): ProductWithCategory {
  return {
    ...mapProduct(record),
    categoryName: record.category.name,
  };
}

export function mapOrderItem(record: PrismaOrderItem): OrderItem {
  return {
    id: record.id,
    quantity: record.quantity,
    unitPrice: record.unit_price,
    orderId: record.order_id,
    productId: record.product_id,
    customizations: record.customizations ? (record.customizations as Record<string, any>) : undefined,
  };
}


export function mapOrder(
  record: PrismaOrder & {
    items: PrismaOrderItem[];
    delivery_person?: { id: string; name: string; phone: string | null } | null;
  },
): Order {
  return {
    id: record.id,
    code: record.code,
    customerName: record.customer_name,
    address: record.address,
    phone: record.phone,
    notes: record.notes,
    zone: record.zone,
    status: orderStatusMap[record.status],
    statusEnteredAt: record.status_entered_at,
    paymentMethod: record.payment_method,
    paymentStatus: record.payment_status,
    paymentObservation: record.payment_observation,
    total: record.total,
    deliveryFee: record.delivery_fee,
    restaurantId: record.restaurant_id,
    deliveryPersonId: record.delivery_person_id,
    courierName: record.delivery_person?.name ?? null,
    courierPhone: record.delivery_person?.phone ?? null,
    items: record.items.map(mapOrderItem),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export {
  roleToPrisma,
  statusToPrisma,
  restaurantStatusToPrisma,
  orderStatusToPrisma,
  orderStatusMap,
};

