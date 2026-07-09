import {
  IOrderRepository,
  CreateOrderData,
  ListRestaurantOrdersFilters,
  OrderWithProductNames,
} from '../../application/ports/IOrderRepository';
import { prisma } from '../database/prisma/client';
import { mapOrder, orderStatusToPrisma } from '../database/prisma/mappers';
import { OrderStatus } from '../../domain/enums';
import { NotFoundError } from '../../domain/errors';

const orderInclude = {
  items: { include: { product: { select: { name: true } } } },
};

export class PrismaOrderRepository implements IOrderRepository {
  async create(data: CreateOrderData & { code: string; total: number; deliveryFee: number; itemsWithPrice: { productId: string; quantity: number; unitPrice: number; customizations?: Record<string, unknown> }[] }) {
    const record = await prisma.order.create({
      data: {
        code: data.code,
        customer_name: data.customerName,
        address: data.address,
        phone: data.phone,
        notes: data.notes ?? null,
        zone: data.zone ?? null,
        total: data.total,
        delivery_fee: data.deliveryFee,
        restaurant_id: data.restaurantId,
        items: {
          create: data.itemsWithPrice.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            customizations: (item.customizations ?? {}) as object,
          })),
        },
      },
      include: orderInclude,
    });
    return mapOrder(record as any);
  }

  async findById(id: string) {
    const record = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    return record ? mapOrder(record as any) : null;
  }

  async findByCode(code: string) {
    const record = await prisma.order.findUnique({
      where: { code },
      include: orderInclude,
    });
    return record ? mapOrder(record as any) : null;
  }

  async listByRestaurant(filters: ListRestaurantOrdersFilters): Promise<OrderWithProductNames[]> {
    const where: Record<string, unknown> = { restaurant_id: filters.restaurantId };
    if (filters.statuses?.length) {
      where.status = { in: filters.statuses.map((s) => orderStatusToPrisma[s]) };
    }

    const records = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { created_at: 'desc' },
    });

    return records.map((record) => {
      const order = mapOrder(record as any);
      return {
        ...order,
        items: record.items.map((item) => ({
          ...order.items.find((i) => i.id === item.id)!,
          productName: item.product.name,
        })),
      };
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    const record = await prisma.order.update({
      where: { id },
      data: {
        status: orderStatusToPrisma[status],
        status_entered_at: new Date(),
      },
      include: orderInclude,
    });
    return mapOrder(record as any);
  }

  async assignCourier(id: string, courierId: string) {
    const record = await prisma.order.update({
      where: { id },
      data: { delivery_person_id: courierId },
      include: orderInclude,
    });
    return mapOrder(record as any);
  }

  async batchAssignCourier(orderIds: string[], courierId: string) {
    await prisma.order.updateMany({
      where: { id: { in: orderIds }, status: 'Listo' },
      data: { delivery_person_id: courierId },
    });

    const records = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: orderInclude,
    });
    return records.map((r) => mapOrder(r as any));
  }

  async dispatchOrders(orderIds: string[], restaurantId: string) {
    const now = new Date();
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        restaurant_id: restaurantId,
        status: 'Listo',
        delivery_person_id: { not: null },
      },
      include: orderInclude,
    });

    if (orders.length === 0) {
      throw new NotFoundError('No hay pedidos listos para despachar');
    }

    await prisma.$transaction(async (tx) => {
      for (const order of orders) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'EnCamino', status_entered_at: now },
        });
        await tx.dispatch.upsert({
          where: { order_id: order.id },
          create: {
            order_id: order.id,
            courier_id: order.delivery_person_id!,
            restaurant_id: restaurantId,
            dispatched_at: now,
          },
          update: { dispatched_at: now },
        });
      }
    });

    const updated = await prisma.order.findMany({
      where: { id: { in: orders.map((o) => o.id) } },
      include: orderInclude,
    });
    return updated.map((r) => mapOrder(r as any));
  }

  async listAvailableForDelivery(restaurantId?: string) {
    const where: Record<string, unknown> = { status: 'Listo' };
    if (restaurantId) where.restaurant_id = restaurantId;

    const records = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { created_at: 'asc' },
    });
    return records.map((r) => mapOrder(r as any));
  }

  async listByCourier(courierId: string) {
    const records = await prisma.order.findMany({
      where: { delivery_person_id: courierId },
      include: orderInclude,
      orderBy: { created_at: 'desc' },
    });
    return records.map((r) => mapOrder(r as any));
  }

  async countAll() {
    return prisma.order.count();
  }
}
