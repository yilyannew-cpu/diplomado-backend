import {
  IOrderRepository,
  CreateOrderData,
} from '../../application/ports/IOrderRepository';
import { prisma } from '../database/prisma/client';
import { mapOrder, orderStatusToPrisma } from '../database/prisma/mappers';
import { OrderStatus } from '../../domain/enums';

export class PrismaOrderRepository implements IOrderRepository {
  async create(data: CreateOrderData & { code: string; total: number; deliveryFee: number; itemsWithPrice: { productId: string; quantity: number; unitPrice: number }[] }) {
    const record = await prisma.order.create({
      data: {
        code: data.code,
        customer_name: data.customerName,
        address: data.address,
        phone: data.phone,
        total: data.total,
        delivery_fee: data.deliveryFee,
        restaurant_id: data.restaurantId,
        items: {
          create: data.itemsWithPrice.map(item => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
    return mapOrder(record);
  }

  async findByCode(code: string) {
    const record = await prisma.order.findUnique({
      where: { code },
      include: { items: true },
    });
    return record ? mapOrder(record) : null;
  }

  async listByRestaurant(restaurantId: string) {
    const records = await prisma.order.findMany({
      where: { restaurant_id: restaurantId },
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });
    return records.map(mapOrder);
  }

  async updateStatus(id: string, status: OrderStatus) {
    const record = await prisma.order.update({
      where: { id },
      data: { status: orderStatusToPrisma[status] },
      include: { items: true },
    });
    return mapOrder(record);
  }

  async assignCourier(id: string, courierId: string) {
    const record = await prisma.order.update({
      where: { id },
      data: { delivery_person_id: courierId, status: 'EnCamino' },
      include: { items: true },
    });
    return mapOrder(record);
  }

  async countAll() {
    return prisma.order.count();
  }
}
