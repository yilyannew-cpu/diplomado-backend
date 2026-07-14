import { PublicUser } from '../../../domain/entities/User';
import { ListedPublicUser } from '../../../application/ports';

function toIsoDate(value: Date | null | undefined): string | null {
  if (!value || Number.isNaN(value.getTime())) {
    return null;
  }
  return value.toISOString();
}

export function serializeUser(user: PublicUser | ListedPublicUser) {
  const listed = user as ListedPublicUser;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    vehicle: user.vehicle,
    document_id: user.documentId,
    avatar: user.avatar,
    comuna: user.comuna,
    restaurant_id: user.restaurantId,
    restaurant_name: listed.restaurantName ?? null,
    restaurant_logo: listed.restaurantLogo ?? null,
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
    avatar: user.avatar ?? null,
    status: user.status,
  };
  if (user.restaurantId) base.restaurant_id = user.restaurantId;
  if (user.vehicle) base.vehicle = user.vehicle;
  if (user.documentId) base.document_id = user.documentId;
  base.comuna = user.comuna ?? null;
  return base;
}
