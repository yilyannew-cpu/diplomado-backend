import {
  IOrderRepository,
  CreateOrderData,
  ListRestaurantOrdersFilters,
  OrderWithProductNames,
} from '../../application/ports/IOrderRepository';
import { prisma } from '../database/prisma/client';
import { mapOrder, orderStatusToPrisma } from '../database/prisma/mappers';
import { OrderStatus } from '../../domain/enums';
import { NotFoundError, DomainError, ForbiddenError } from '../../domain/errors';

const orderInclude = {
  items: { include: { product: { select: { name: true, image: true } } } },
  delivery_person: { select: { id: true, name: true, phone: true, avatar: true } },
};

type OrderRecordWithIncludes = {
  items: Array<{
    id: string;
    product: { name: string; image: string | null };
  } & Record<string, unknown>>;
} & Record<string, unknown>;

function mapOrderWithProductNames(record: OrderRecordWithIncludes): OrderWithProductNames {
  const order = mapOrder(record as any);
  return {
    ...order,
    items: record.items.map((item) => ({
      ...order.items.find((i) => i.id === item.id)!,
      productName: item.product.name,
      productImage: item.product.image ?? null,
    })),
  };
}

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
    return mapOrderWithProductNames(record as any);
  }

  async findById(id: string) {
    const record = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    return record ? mapOrderWithProductNames(record as any) : null;
  }

  async findByCode(code: string) {
    const record = await prisma.order.findUnique({
      where: { code },
      include: orderInclude,
    });
    if (!record) return null;
    return mapOrderWithProductNames(record as any);
  }

  async findLatestActiveByPhone(phone: string) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) return null;

    const records = await prisma.order.findMany({
      where: {
        status: {
          notIn: [
            orderStatusToPrisma[OrderStatus.ENTREGADO],
            orderStatusToPrisma[OrderStatus.CANCELADO],
          ],
        },
      },
      orderBy: { created_at: 'desc' },
      take: 80,
      include: orderInclude,
    });

    const last10 = digits.slice(-10);
    const match = records.find((record) => {
      const orderDigits = record.phone.replace(/\D/g, '');
      return (
        orderDigits === digits ||
        orderDigits.endsWith(last10) ||
        digits.endsWith(orderDigits.slice(-10))
      );
    });

    if (!match) return null;
    return mapOrderWithProductNames(match as any);
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

    return records.map((record) => mapOrderWithProductNames(record as any));
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
    return mapOrderWithProductNames(record as any);
  }

  async rejectPayment(id: string, observation: string) {
    const record = await prisma.order.update({
      where: { id },
      data: { 
        status: 'Cancelado',
        payment_observation: observation,
        payment_status: 'Failed',
        status_entered_at: new Date(),
      },
      include: orderInclude,
    });
    return mapOrderWithProductNames(record as any);
  }

  async assignCourier(id: string, courierId: string) {
    const record = await prisma.order.update({
      where: { id },
      data: { delivery_person_id: courierId },
      include: orderInclude,
    });
    return mapOrderWithProductNames(record as any);
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
    return records.map((r) => mapOrderWithProductNames(r as any));
  }

  /**
   * Entrega operativa al domiciliario: el pedido sigue en Listo + asignado.
   * EnCamino lo marca solo el domiciliario con start-delivery (botón "En camino"),
   * para que el cliente vea el cambio cuando realmente sale a ruta.
   */
  async dispatchOrders(orderIds: string[], restaurantId: string) {
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
      throw new NotFoundError('No hay pedidos listos con domiciliario asignado');
    }

    return orders.map((r) => mapOrderWithProductNames(r as any));
  }

  async listAvailableForDelivery(restaurantId?: string) {
    const where: Record<string, unknown> = {
      status: 'Listo',
      delivery_person_id: null,
    };
    if (restaurantId) where.restaurant_id = restaurantId;

    const records = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { created_at: 'asc' },
    });
    return records.map((r) => mapOrderWithProductNames(r as any));
  }

  async listByCourier(courierId: string) {
    const records = await prisma.order.findMany({
      where: { delivery_person_id: courierId },
      include: orderInclude,
      orderBy: { created_at: 'desc' },
    });
    return records.map((r) => mapOrderWithProductNames(r as any));
  }

  async countInRouteByCourier(courierId: string) {
    return prisma.order.count({
      where: {
        delivery_person_id: courierId,
        status: { in: ['EnCamino', 'Listo'] },
      },
    });
  }

  async startDeliveryByCourier(orderId: string, courierId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundError('Pedido no encontrado');
    if (order.status !== 'Listo') {
      throw new DomainError('INVALID_ORDER_STATUS', 'El pedido no está listo para salir');
    }
    if (order.delivery_person_id !== courierId) {
      throw new ForbiddenError('FORBIDDEN_ORDER', 'Este pedido no está asignado a ti');
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'EnCamino', status_entered_at: now },
      });
      await tx.dispatch.upsert({
        where: { order_id: orderId },
        create: {
          order_id: orderId,
          courier_id: courierId,
          restaurant_id: order.restaurant_id,
          dispatched_at: now,
        },
        update: { dispatched_at: now },
      });
    });

    const updated = await prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    return mapOrderWithProductNames(updated as any);
  }

  async completeDeliveryByCourier(orderId: string, courierId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundError('Pedido no encontrado');
    if (order.status !== 'EnCamino') {
      throw new DomainError('INVALID_ORDER_STATUS', 'El pedido no está en camino');
    }
    if (order.delivery_person_id !== courierId) {
      throw new ForbiddenError('FORBIDDEN_ORDER', 'Este pedido no está asignado a ti');
    }

    const record = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'Entregado',
        status_entered_at: new Date(),
      },
      include: orderInclude,
    });
    return mapOrderWithProductNames(record as any);
  }

  async countAll() {
    return prisma.order.count();
  }
}
