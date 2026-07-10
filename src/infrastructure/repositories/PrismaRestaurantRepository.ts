import {
  IRestaurantRepository,
  CreateRestaurantData,
  UpdateRestaurantData,
} from '../../application/ports';
import { CreateUserData } from '../../application/ports';
import { RestaurantStatus } from '../../domain/enums';
import { prisma } from '../database/prisma/client';
import { mapRestaurant, mapUser, restaurantStatusToPrisma } from '../database/prisma/mappers';
import { roleToPrisma, statusToPrisma } from '../database/prisma/mappers';

export class PrismaRestaurantRepository implements IRestaurantRepository {
  async findById(id: string) {
    const record = await prisma.restaurant.findUnique({ where: { id } });
    return record ? mapRestaurant(record) : null;
  }

  async listAll() {
    const records = await prisma.restaurant.findMany({
      orderBy: { created_at: 'desc' }
    });
    return records.map(mapRestaurant);
  }

  async listActiveForClient() {
    const records = await prisma.restaurant.findMany({
      where: {
        status: 'Activo',
        NOT: {
          users: {
            some: { role: 'admin', status: 'Suspendido' },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return records.map(mapRestaurant);
  }

  async create(data: CreateRestaurantData) {
    const record = await prisma.restaurant.create({
      data: {
        name: data.name,
        tagline: data.tagline ?? null,
        city: data.city,
        address: data.address,
        delivery_minutes: data.deliveryMinutes ?? 30,
        initials: data.initials,
        status: data.status ? restaurantStatusToPrisma[data.status] : 'Pendiente',
      },
    });
    return mapRestaurant(record);
  }

  async updateStatus(id: string, status: RestaurantStatus) {
    const record = await prisma.restaurant.update({
      where: { id },
      data: { status: restaurantStatusToPrisma[status] },
    });
    return mapRestaurant(record);
  }

  async update(id: string, data: UpdateRestaurantData) {
    const record = await prisma.restaurant.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.tagline !== undefined && { tagline: data.tagline }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.deliveryMinutes !== undefined && { delivery_minutes: data.deliveryMinutes }),
        ...(data.monthlyGoal !== undefined && { monthly_goal: data.monthlyGoal }),
        ...(data.accent !== undefined && { accent: data.accent }),
        ...(data.logo !== undefined && { logo: data.logo }),
      },
    });
    return mapRestaurant(record);
  }

  async createWithAdminUser(
    restaurantData: CreateRestaurantData,
    userData: Omit<CreateUserData, 'restaurantId'>
  ) {
    return prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantData.name,
          tagline: restaurantData.tagline ?? null,
          city: restaurantData.city,
          address: restaurantData.address,
          delivery_minutes: restaurantData.deliveryMinutes ?? 30,
          initials: restaurantData.initials,
          status: restaurantData.status
            ? restaurantStatusToPrisma[restaurantData.status]
            : 'Pendiente',
        },
      });

      const user = await tx.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password_hash: userData.passwordHash,
          role: roleToPrisma[userData.role],
          phone: userData.phone ?? null,
          status: userData.status ? statusToPrisma[userData.status] : 'Pendiente',
          restaurant_id: restaurant.id,
        },
      });

      return {
        user: mapUser(user),
        restaurant: mapRestaurant(restaurant),
      };
    });
  }
}
