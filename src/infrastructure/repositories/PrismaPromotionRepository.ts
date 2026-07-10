import {
  IPromotionRepository,
  CreatePromotionData,
  UpdatePromotionData,
  Promotion,
} from '../../application/ports/IPromotionRepository';
import { prisma } from '../database/prisma/client';

function mapPromotion(record: {
  id: string;
  name: string;
  discount_percent: number;
  start_date: Date;
  end_date: Date;
  active: boolean;
  restaurant_id: string;
  products: { product_id: string }[];
}): Promotion {
  return {
    id: record.id,
    name: record.name,
    discountPercent: record.discount_percent,
    startDate: record.start_date,
    endDate: record.end_date,
    active: record.active,
    restaurantId: record.restaurant_id,
    productIds: record.products.map((p) => p.product_id),
  };
}

const includeProducts = { products: { select: { product_id: true } } };

export class PrismaPromotionRepository implements IPromotionRepository {
  async listByRestaurant(restaurantId: string) {
    const records = await prisma.promotion.findMany({
      where: { restaurant_id: restaurantId },
      include: includeProducts,
      orderBy: { created_at: 'desc' },
    });
    return records.map(mapPromotion);
  }

  async listActiveByRestaurant(restaurantId: string) {
    const now = new Date();
    const records = await prisma.promotion.findMany({
      where: {
        restaurant_id: restaurantId,
        active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
      include: includeProducts,
      orderBy: { created_at: 'desc' },
    });
    return records.map(mapPromotion);
  }

  async findById(id: string) {
    const record = await prisma.promotion.findUnique({
      where: { id },
      include: includeProducts,
    });
    return record ? mapPromotion(record) : null;
  }

  async create(data: CreatePromotionData) {
    const record = await prisma.promotion.create({
      data: {
        name: data.name,
        discount_percent: data.discountPercent,
        start_date: data.startDate,
        end_date: data.endDate,
        active: data.active ?? true,
        restaurant_id: data.restaurantId,
        products: {
          create: data.productIds.map((productId) => ({ product_id: productId })),
        },
      },
      include: includeProducts,
    });
    return mapPromotion(record);
  }

  async update(id: string, data: UpdatePromotionData) {
    if (data.productIds) {
      await prisma.promotionProduct.deleteMany({ where: { promotion_id: id } });
      await prisma.promotionProduct.createMany({
        data: data.productIds.map((productId) => ({ promotion_id: id, product_id: productId })),
      });
    }

    const record = await prisma.promotion.update({
      where: { id },
      data: {
        name: data.name,
        discount_percent: data.discountPercent,
        start_date: data.startDate,
        end_date: data.endDate,
        active: data.active,
      },
      include: includeProducts,
    });
    return mapPromotion(record);
  }

  async delete(id: string) {
    await prisma.promotion.delete({ where: { id } });
  }

  async countActive(restaurantId: string) {
    const now = new Date();
    return prisma.promotion.count({
      where: {
        restaurant_id: restaurantId,
        active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
    });
  }
}
