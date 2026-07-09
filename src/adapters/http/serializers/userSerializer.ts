import { PublicUser } from '../../../domain/entities/User';

function toIsoDate(value: Date | null | undefined): string | null {
  if (!value || Number.isNaN(value.getTime())) {
    return null;
  }
  return value.toISOString();
}

export function serializeUser(user: PublicUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    vehicle: user.vehicle,
    document_id: user.documentId,
    avatar: user.avatar,
    restaurant_id: user.restaurantId,
    status: user.status,
    created_at: toIsoDate(user.createdAt),
    updated_at: toIsoDate(user.updatedAt),
  };
}

/** Respuesta de login / me — sin campos internos ni timestamps */
export function serializeUserPublic(user: PublicUser) {
  const base: Record<string, unknown> = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    status: user.status,
  };
  if (user.restaurantId) base.restaurant_id = user.restaurantId;
  if (user.vehicle) base.vehicle = user.vehicle;
  return base;
}
