import {
  ActiveCourier,
  DashboardMetrics,
  IOperationsRepository,
  OperationsMetrics,
  OrderSummary,
  SystemStatus,
} from '../../application/ports/operations';
import { CourierAvailability, OrderStatus, Role, ServiceHealthStatus, UserStatus, RestaurantStatus } from '../../domain/enums';
import { prisma } from '../database/prisma/client';
import { roleToPrisma, statusToPrisma, restaurantStatusToPrisma } from '../database/prisma/mappers';

const DEMO_ORDERS: OrderSummary[] = [
  {
    id: 'ord-001',
    order_number: 'FF-1042',
    status: OrderStatus.EN_CAMINO,
    restaurant_name: 'FFCore',
    customer_name: 'Laura Martínez',
    courier_name: 'Sebastián Domínguez',
    total_cop: 45000,
    created_at: hoursAgo(1.2),
    estimated_delivery_at: minutesFromNow(18),
  },
  {
    id: 'ord-002',
    order_number: 'FF-1041',
    status: OrderStatus.EN_PREPARACION,
    restaurant_name: 'FFCore',
    customer_name: 'Pedro Gómez',
    courier_name: null,
    total_cop: 62000,
    created_at: hoursAgo(0.5),
    estimated_delivery_at: minutesFromNow(35),
  },
  {
    id: 'ord-003',
    order_number: 'FF-1040',
    status: OrderStatus.EN_CAMINO,
    restaurant_name: 'FFCore',
    customer_name: 'Ana Ruiz',
    courier_name: 'Sebastián Domínguez',
    total_cop: 38500,
    created_at: hoursAgo(0.8),
    estimated_delivery_at: minutesFromNow(12),
  },
  {
    id: 'ord-004',
    order_number: 'FF-1039',
    status: OrderStatus.RECIBIDO,
    restaurant_name: 'FFCore',
    customer_name: 'Carlos Díaz',
    courier_name: null,
    total_cop: 51000,
    created_at: hoursAgo(0.2),
    estimated_delivery_at: null,
  },
  {
    id: 'ord-005',
    order_number: 'FF-1038',
    status: OrderStatus.EN_PREPARACION,
    restaurant_name: 'FFCore',
    customer_name: 'María López',
    courier_name: null,
    total_cop: 72000,
    created_at: hoursAgo(0.35),
    estimated_delivery_at: minutesFromNow(28),
  },
];

const ACTIVE_ORDER_STATUSES = new Set<OrderStatus>([
  OrderStatus.RECIBIDO,
  OrderStatus.EN_PREPARACION,
  OrderStatus.LISTO,
  OrderStatus.EN_CAMINO,
]);

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export class PrismaOperationsRepository implements IOperationsRepository {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [activeCouriers, activeRestaurants, registeredClients] = await Promise.all([
      prisma.user.count({
        where: { role: roleToPrisma[Role.DOMICILIARIO], status: statusToPrisma[UserStatus.ACTIVO] },
      }),
      prisma.restaurant.count({
        where: { status: restaurantStatusToPrisma[RestaurantStatus.ACTIVO] },
      }),
      prisma.user.count({
        where: { role: roleToPrisma[Role.CLIENTE], status: statusToPrisma[UserStatus.ACTIVO] },
      }),
    ]);

    const salesYesterdayCop = 1_116_000;
    const salesTodayCop = 1_250_000;
    const salesDeltaPercent =
      salesYesterdayCop > 0
        ? Math.round(((salesTodayCop - salesYesterdayCop) / salesYesterdayCop) * 1000) / 10
        : 0;

    return {
      sales_today_cop: salesTodayCop,
      sales_yesterday_cop: salesYesterdayCop,
      sales_delta_percent: salesDeltaPercent,
      orders_today: 47,
      active_couriers: activeCouriers,
      active_restaurants: activeRestaurants,
      registered_clients: registeredClients,
    };
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const services = [
      { name: 'API Pedidos', status: ServiceHealthStatus.OPERATIONAL, latency_ms: 45 },
      { name: 'Pagos', status: ServiceHealthStatus.OPERATIONAL, latency_ms: 120 },
      { name: 'Push', status: ServiceHealthStatus.DEGRADED, latency_ms: 200 },
      { name: 'Mapas', status: ServiceHealthStatus.OPERATIONAL, latency_ms: 80 },
    ];

    const overall = services.some((s) => s.status === ServiceHealthStatus.DOWN)
      ? ServiceHealthStatus.DOWN
      : services.some((s) => s.status === ServiceHealthStatus.DEGRADED)
        ? ServiceHealthStatus.DEGRADED
        : ServiceHealthStatus.OPERATIONAL;

    return { overall, services };
  }

  async listOrders(status?: OrderStatus): Promise<OrderSummary[]> {
    let orders = DEMO_ORDERS;

    if (status) {
      orders = orders.filter((order) => order.status === status);
    } else {
      orders = orders.filter((order) => ACTIVE_ORDER_STATUSES.has(order.status));
    }

    return orders.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async listActiveCouriers(): Promise<ActiveCourier[]> {
    const couriers = await prisma.user.findMany({
      where: {
        role: roleToPrisma[Role.DOMICILIARIO],
        status: statusToPrisma[UserStatus.ACTIVO],
      },
      orderBy: { name: 'asc' },
    });

    const enRutaNames = new Set(
      DEMO_ORDERS.filter((o) => o.status === OrderStatus.EN_CAMINO && o.courier_name)
        .map((o) => o.courier_name as string)
    );

    return couriers.map((courier, index) => {
      const onRoute = enRutaNames.has(courier.name);
      const activeOrders = DEMO_ORDERS.filter(
        (o) => o.courier_name === courier.name && o.status === OrderStatus.EN_CAMINO
      ).length;

      return {
        id: courier.id,
        name: courier.name,
        email: courier.email,
        phone: courier.phone,
        vehicle: courier.vehicle,
        availability: onRoute
          ? CourierAvailability.EN_RUTA
          : index === 0 && couriers.length > 0
            ? CourierAvailability.DISPONIBLE
            : CourierAvailability.OFFLINE,
        active_orders: activeOrders,
      };
    });
  }

  async getOperationsMetrics(): Promise<OperationsMetrics> {
    const activeOrders = DEMO_ORDERS.filter((o) => ACTIVE_ORDER_STATUSES.has(o.status));
    const couriers = await this.listActiveCouriers();

    return {
      orders_in_progress: activeOrders.length,
      orders_en_camino: activeOrders.filter((o) => o.status === OrderStatus.EN_CAMINO).length,
      orders_pendientes_asignacion: activeOrders.filter(
        (o) => o.status === OrderStatus.RECIBIDO && !o.courier_name
      ).length,
      avg_delivery_minutes: 28,
      couriers_available: couriers.filter((c) => c.availability === CourierAvailability.DISPONIBLE)
        .length,
      couriers_en_ruta: couriers.filter((c) => c.availability === CourierAvailability.EN_RUTA).length,
    };
  }
}
