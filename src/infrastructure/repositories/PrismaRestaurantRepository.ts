import {
  IRestaurantRepository,
  CreateRestaurantData,
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
