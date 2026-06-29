import { User as PrismaUser, Restaurant as PrismaRestaurant, Role as PrismaRole, UserStatus as PrismaUserStatus, RestaurantStatus as PrismaRestaurantStatus } from '@prisma/client';
import { User } from '../../../domain/entities/User';
import { Restaurant } from '../../../domain/entities/Restaurant';
import { Role, UserStatus, RestaurantStatus } from '../../../domain/enums';

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
  Rechazado: RestaurantStatus.RECHAZADO,
};

const restaurantStatusToPrisma: Record<RestaurantStatus, PrismaRestaurantStatus> = {
  [RestaurantStatus.ACTIVO]: 'Activo',
  [RestaurantStatus.PENDIENTE]: 'Pendiente',
  [RestaurantStatus.RECHAZADO]: 'Rechazado',
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
    accent: record.accent,
    initials: record.initials,
    status: restaurantStatusMap[record.status],
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export { roleToPrisma, statusToPrisma, restaurantStatusToPrisma };
