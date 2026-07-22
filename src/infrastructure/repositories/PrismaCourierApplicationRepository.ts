import { ICourierApplicationRepository } from '../../application/ports';
import { CourierApplication } from '../../domain/entities/CourierApplication';
import { ApplicationStatus } from '../../domain/enums';
import { prisma } from '../database/prisma/client';

function toDomain(row: {
  id: string;
  courier_id: string;
  restaurant_id: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  courier?: { name: string } | null;
  restaurant?: { name: string } | null;
}): CourierApplication {
  return {
    id: row.id,
    courierId: row.courier_id,
    restaurantId: row.restaurant_id,
    status: row.status as ApplicationStatus,
    courierName: row.courier?.name ?? undefined,
    restaurantName: row.restaurant?.name ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const includeRelations = {
  courier: { select: { name: true } },
  restaurant: { select: { name: true } },
} as const;

export class PrismaCourierApplicationRepository implements ICourierApplicationRepository {
  async create(courierId: string, restaurantId: string): Promise<CourierApplication> {
    const row = await prisma.courierApplication.create({
      data: { courier_id: courierId, restaurant_id: restaurantId },
      include: includeRelations,
    });
    return toDomain(row);
  }

  async findById(id: string): Promise<CourierApplication | null> {
    const row = await prisma.courierApplication.findUnique({
      where: { id },
      include: includeRelations,
    });
    return row ? toDomain(row) : null;
  }

  async findExisting(courierId: string, restaurantId: string): Promise<CourierApplication | null> {
    const row = await prisma.courierApplication.findUnique({
      where: { courier_id_restaurant_id: { courier_id: courierId, restaurant_id: restaurantId } },
      include: includeRelations,
    });
    return row ? toDomain(row) : null;
  }

  async updateStatus(id: string, status: ApplicationStatus): Promise<CourierApplication> {
    const row = await prisma.courierApplication.update({
      where: { id },
      data: { status },
      include: includeRelations,
    });
    return toDomain(row);
  }

  async listByRestaurant(restaurantId: string): Promise<CourierApplication[]> {
    const rows = await prisma.courierApplication.findMany({
      where: { restaurant_id: restaurantId },
      include: includeRelations,
      orderBy: { created_at: 'desc' },
    });
    return rows.map(toDomain);
  }

  async listByCourier(courierId: string): Promise<CourierApplication[]> {
    const rows = await prisma.courierApplication.findMany({
      where: { courier_id: courierId },
      include: includeRelations,
      orderBy: { created_at: 'desc' },
    });
    return rows.map(toDomain);
  }
}
