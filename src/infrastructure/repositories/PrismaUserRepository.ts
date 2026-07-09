import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
  ListUsersFilters,
  PendingUserWithRestaurant,
} from '../../application/ports';
import { toPublicUser } from '../../domain/entities/User';
import { UserStatus } from '../../domain/enums';
import { prisma } from '../database/prisma/client';
import { mapUser, roleToPrisma, statusToPrisma } from '../database/prisma/mappers';

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string) {
    const record = await prisma.user.findUnique({ where: { id } });
    return record ? mapUser(record) : null;
  }

  async findByEmail(email: string) {
    const record = await prisma.user.findUnique({ where: { email } });
    return record ? mapUser(record) : null;
  }

  async emailExists(email: string) {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  }

  async create(data: CreateUserData) {
    const record = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash: data.passwordHash,
        role: roleToPrisma[data.role],
        phone: data.phone ?? null,
        vehicle: data.vehicle ?? null,
        document_id: data.documentId ?? null,
        status: statusToPrisma[data.status ?? UserStatus.PENDIENTE],
        restaurant_id: data.restaurantId ?? null,
      },
    });
    return mapUser(record);
  }

  async update(id: string, data: UpdateUserData) {
    const record = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.vehicle !== undefined && { vehicle: data.vehicle }),
        ...(data.documentId !== undefined && { document_id: data.documentId }),
        ...(data.role !== undefined && { role: roleToPrisma[data.role] }),
        ...(data.status !== undefined && { status: statusToPrisma[data.status] }),
        ...(data.restaurantId !== undefined && { restaurant_id: data.restaurantId }),
        ...(data.passwordHash !== undefined && { password_hash: data.passwordHash }),
      },
    });
    return mapUser(record);
  }

  async listPending(): Promise<PendingUserWithRestaurant[]> {
    const records = await prisma.user.findMany({
      where: { status: 'Pendiente' },
      include: { restaurant: true },
      orderBy: { created_at: 'desc' },
    });

    return records.map((record) => {
      const publicUser = toPublicUser(mapUser(record));
      return {
        ...publicUser,
        restaurant: record.restaurant
          ? {
              id: record.restaurant.id,
              name: record.restaurant.name,
              city: record.restaurant.city,
              address: record.restaurant.address,
              status: record.restaurant.status,
            }
          : null,
      };
    });
  }

  async list(filters: ListUsersFilters) {
    const where: Record<string, unknown> = {};

    if (filters.role) {
      where.role = roleToPrisma[filters.role];
    }
    if (filters.status) {
      where.status = statusToPrisma[filters.status];
    }
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { email: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.user.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return records.map((r) => toPublicUser(mapUser(r)));
  }
}
