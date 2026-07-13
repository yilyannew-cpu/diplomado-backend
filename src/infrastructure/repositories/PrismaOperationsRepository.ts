import {
  ActiveCourier,
  DashboardMetrics,
  IOperationsRepository,
  OperationsMetrics,
  OrderSummary,
  SystemStatus,
} from '../../application/ports/operations';
import {
  CourierAvailability,
  OrderStatus,
  Role,
  ServiceHealthStatus,
  UserStatus,
  RestaurantStatus,
} from '../../domain/enums';
import { prisma } from '../database/prisma/client';
import {
  roleToPrisma,
  statusToPrisma,
  restaurantStatusToPrisma,
  orderStatusToPrisma,
  orderStatusMap,
} from '../database/prisma/mappers';

const ACTIVE_ORDER_STATUSES = [
  OrderStatus.RECIBIDO,
  OrderStatus.EN_PREPARACION,
  OrderStatus.LISTO,
  OrderStatus.EN_CAMINO,
] as const;

function startOfDay(d = new Date()) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(d = new Date()) {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
}

function dayRange(offsetDays: number) {
  const base = new Date();
  base.setDate(base.getDate() + offsetDays);
  return { gte: startOfDay(base), lte: endOfDay(base) };
}

export class PrismaOperationsRepository implements IOperationsRepository {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const today = dayRange(0);
    const yesterday = dayRange(-1);

    const [
      todayAgg,
      yesterdayAgg,
      activeCouriers,
      activeRestaurants,
      registeredClients,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: {
          created_at: today,
          status: { not: orderStatusToPrisma[OrderStatus.CANCELADO] },
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: {
          created_at: yesterday,
          status: { not: orderStatusToPrisma[OrderStatus.CANCELADO] },
        },
        _sum: { total: true },
      }),
      prisma.user.count({
        where: {
          role: roleToPrisma[Role.DOMICILIARIO],
          status: statusToPrisma[UserStatus.ACTIVO],
        },
      }),
      prisma.restaurant.count({
        where: { status: restaurantStatusToPrisma[RestaurantStatus.ACTIVO] },
      }),
      prisma.user.count({
        where: {
          role: roleToPrisma[Role.CLIENTE],
          status: statusToPrisma[UserStatus.ACTIVO],
        },
      }),
    ]);

    const salesTodayCop = todayAgg._sum.total ?? 0;
    const salesYesterdayCop = yesterdayAgg._sum.total ?? 0;
    const salesDeltaPercent =
      salesYesterdayCop > 0
        ? Math.round(((salesTodayCop - salesYesterdayCop) / salesYesterdayCop) * 1000) / 10
        : salesTodayCop > 0
          ? 100
          : 0;

    return {
      sales_today_cop: salesTodayCop,
      sales_yesterday_cop: salesYesterdayCop,
      sales_delta_percent: salesDeltaPercent,
      orders_today: todayAgg._count,
      active_couriers: activeCouriers,
      active_restaurants: activeRestaurants,
      registered_clients: registeredClients,
    };
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const started = Date.now();
    let apiLatency = 0;
    let apiStatus = ServiceHealthStatus.OPERATIONAL;

    try {
      await prisma.$queryRaw`SELECT 1`;
      apiLatency = Date.now() - started;
    } catch {
      apiLatency = Date.now() - started;
      apiStatus = ServiceHealthStatus.DOWN;
    }

    const services = [
      { name: 'API Pedidos', status: apiStatus, latency_ms: apiLatency },
      { name: 'Pagos', status: ServiceHealthStatus.OPERATIONAL, latency_ms: apiLatency },
      { name: 'Push', status: ServiceHealthStatus.OPERATIONAL, latency_ms: apiLatency },
      { name: 'Mapas', status: ServiceHealthStatus.OPERATIONAL, latency_ms: apiLatency },
    ];

    const overall = services.some((s) => s.status === ServiceHealthStatus.DOWN)
      ? ServiceHealthStatus.DOWN
      : services.some((s) => s.status === ServiceHealthStatus.DEGRADED)
        ? ServiceHealthStatus.DEGRADED
        : ServiceHealthStatus.OPERATIONAL;

    return { overall, services };
  }

  async listOrders(status?: OrderStatus): Promise<OrderSummary[]> {
    const where = status
      ? { status: orderStatusToPrisma[status] }
      : {
          status: {
            in: ACTIVE_ORDER_STATUSES.map((s) => orderStatusToPrisma[s]),
          },
        };

    const orders = await prisma.order.findMany({
      where,
      include: {
        restaurant: { select: { name: true } },
        delivery_person: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    return orders.map((order) => ({
      id: order.id,
      order_number: order.code,
      status: orderStatusMap[order.status],
      restaurant_name: order.restaurant.name,
      customer_name: order.customer_name,
      courier_name: order.delivery_person?.name ?? null,
      total_cop: order.total,
      created_at: order.created_at.toISOString(),
      estimated_delivery_at: null,
    }));
  }

  async listActiveCouriers(): Promise<ActiveCourier[]> {
    const couriers = await prisma.user.findMany({
      where: {
        role: roleToPrisma[Role.DOMICILIARIO],
        status: statusToPrisma[UserStatus.ACTIVO],
      },
      orderBy: { name: 'asc' },
    });

    if (couriers.length === 0) return [];

    const activeOrders = await prisma.order.findMany({
      where: {
        delivery_person_id: { in: couriers.map((c) => c.id) },
        status: {
          in: [
            orderStatusToPrisma[OrderStatus.LISTO],
            orderStatusToPrisma[OrderStatus.EN_CAMINO],
          ],
        },
      },
      select: {
        delivery_person_id: true,
        status: true,
      },
    });

    const loadByCourier = new Map<string, { listo: number; enCamino: number }>();
    for (const order of activeOrders) {
      const id = order.delivery_person_id!;
      const cur = loadByCourier.get(id) ?? { listo: 0, enCamino: 0 };
      if (order.status === orderStatusToPrisma[OrderStatus.EN_CAMINO]) cur.enCamino += 1;
      else cur.listo += 1;
      loadByCourier.set(id, cur);
    }

    return couriers.map((courier) => {
      const load = loadByCourier.get(courier.id) ?? { listo: 0, enCamino: 0 };
      const active = load.listo + load.enCamino;
      // Disponible solo si no tiene pedidos Listo ni EnCamino.
      // EnCamino = ya salió; Listo asignado = aún no libre para otros restaurantes.
      const availability =
        active === 0
          ? CourierAvailability.DISPONIBLE
          : CourierAvailability.EN_RUTA;

      return {
        id: courier.id,
        name: courier.name,
        email: courier.email,
        phone: courier.phone,
        vehicle: courier.vehicle,
        availability,
        active_orders: active,
      };
    });
  }

  async getOperationsMetrics(): Promise<OperationsMetrics> {
    const activeStatuses = ACTIVE_ORDER_STATUSES.map((s) => orderStatusToPrisma[s]);

    const [activeOrders, couriers, deliveredToday] = await Promise.all([
      prisma.order.findMany({
        where: { status: { in: activeStatuses } },
        select: {
          status: true,
          delivery_person_id: true,
        },
      }),
      this.listActiveCouriers(),
      prisma.order.findMany({
        where: {
          status: orderStatusToPrisma[OrderStatus.ENTREGADO],
          created_at: dayRange(0),
        },
        select: { created_at: true, updated_at: true },
      }),
    ]);

    const avgDeliveryMinutes =
      deliveredToday.length === 0
        ? 0
        : Math.round(
            deliveredToday.reduce((sum, o) => {
              const mins = (o.updated_at.getTime() - o.created_at.getTime()) / 60_000;
              return sum + Math.max(0, mins);
            }, 0) / deliveredToday.length
          );

    return {
      orders_in_progress: activeOrders.length,
      orders_en_camino: activeOrders.filter(
        (o) => o.status === orderStatusToPrisma[OrderStatus.EN_CAMINO]
      ).length,
      orders_pendientes_asignacion: activeOrders.filter(
        (o) =>
          o.status === orderStatusToPrisma[OrderStatus.RECIBIDO] && !o.delivery_person_id
      ).length,
      avg_delivery_minutes: avgDeliveryMinutes,
      couriers_available: couriers.filter(
        (c) => c.availability === CourierAvailability.DISPONIBLE
      ).length,
      couriers_en_ruta: couriers.filter((c) => c.availability === CourierAvailability.EN_RUTA)
        .length,
    };
  }
}
