import {
  IProductRepository,
  CreateProductData,
  UpdateProductData,
  ListProductsFilters,
} from '../../application/ports/IProductRepository';
import { prisma } from '../database/prisma/client';
import { mapProduct, mapProductWithCategory } from '../database/prisma/mappers';

export class PrismaProductRepository implements IProductRepository {
  async list(filters: ListProductsFilters) {
    const where: any = {};
    if (filters.restaurantId) where.restaurant_id = filters.restaurantId;
    if (filters.categoryId) where.category_id = filters.categoryId;
    if (filters.onlyAvailable !== undefined) where.available = filters.onlyAvailable;

    const records = await prisma.product.findMany({
      where,
      include: { 
        category: true,
        ingredients: { include: { ingredient: true } },
        modifier_groups: { include: { options: true } }
      },
      orderBy: { created_at: 'desc' },
    });

    return records.map(mapProductWithCategory);
  }

  async findById(id: string) {
    const record = await prisma.product.findUnique({
      where: { id },
      include: { 
        category: true,
        ingredients: { include: { ingredient: true } },
        modifier_groups: { include: { options: true } }
      },
    });
    return record ? mapProductWithCategory(record as any) : null;
  }

  async create(data: CreateProductData) {
    const record = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        available: data.available ?? true,
        category_id: data.categoryId,
        restaurant_id: data.restaurantId,
      },
    });
    return mapProduct(record as any);
  }

  async update(id: string, data: UpdateProductData) {
    const record = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        available: data.available,
        category_id: data.categoryId,
      },
    });
    return mapProduct(record as any);
  }

  async toggleAvailability(id: string) {
    const current = await prisma.product.findUnique({ where: { id }, select: { available: true } });
    if (!current) throw new Error('Product not found');
    
    const record = await prisma.product.update({
      where: { id },
      data: { available: !current.available },
    });
    return mapProduct(record as any);
  }
}
