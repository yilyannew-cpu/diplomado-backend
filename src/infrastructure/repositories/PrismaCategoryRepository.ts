import {
  ICategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '../../application/ports/IProductRepository';
import { prisma } from '../database/prisma/client';
import { mapCategory } from '../database/prisma/mappers';

export class PrismaCategoryRepository implements ICategoryRepository {
  async listByRestaurant(restaurantId: string) {
    const records = await prisma.category.findMany({
      where: { restaurant_id: restaurantId },
      include: { _count: { select: { products: true } } },
      orderBy: { position: 'asc' },
    });

    return records.map((r) => ({
      ...mapCategory(r),
      productCount: r._count.products,
    }));
  }

  async findById(id: string) {
    const record = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!record) return null;
    return { ...mapCategory(record), productCount: record._count.products };
  }

  async create(data: CreateCategoryData) {
    const record = await prisma.category.create({
      data: {
        name: data.name,
        position: data.position,
        image: data.image ?? null,
        restaurant_id: data.restaurantId,
      },
    });
    return mapCategory(record);
  }

  async update(id: string, data: UpdateCategoryData) {
    const record = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        position: data.position,
        image: data.image,
      },
    });
    return mapCategory(record);
  }

  async delete(id: string) {
    await prisma.category.delete({ where: { id } });
  }

  async updateImage(id: string, imageUrl: string) {
    const record = await prisma.category.update({
      where: { id },
      data: { image: imageUrl },
    });
    return mapCategory(record);
  }

  async nameExistsInRestaurant(restaurantId: string, name: string, excludeId?: string) {
    const record = await prisma.category.findFirst({
      where: {
        restaurant_id: restaurantId,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    return !!record;
  }
}
