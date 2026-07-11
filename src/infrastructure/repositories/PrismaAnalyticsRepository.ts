import { IAnalyticsRepository, ActiveDeliveryGroup } from '../../application/ports/IAnalyticsRepository';
import { prisma } from '../database/prisma/client';

const APP_COMMISSION_RATE = 0.05;

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

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(d = new Date()) {
  return new Date(d.getFullYear(), 0, 1);
}

/** Ventas del restaurante = total cobrado − domicilio (el domicilio es del repartidor). */
function restaurantProductSales(total: number, deliveryFee: number): number {
  return Math.max(0, total - deliveryFee);
}

export class PrismaAnalyticsRepository implements IAnalyticsRepository {
  async getDashboard(restaurantId: string) {
    const todayStart = startOfDay();
    const todayEnd = endOfDay();
    const monthStart = startOfMonth();
    const monthEnd = endOfMonth();

    const restaurant = await prisma.restaurant.findUniqueOrThrow({
      where: { id: restaurantId },
    });

    const [todayOrders, monthOrders, salesByCategoryRaw, topProductsRaw, activePromos, reviewAgg] =
      await Promise.all([
        prisma.order.aggregate({
          where: {
            restaurant_id: restaurantId,
            created_at: { gte: todayStart, lte: todayEnd },
            status: { not: 'Cancelado' },
          },
          _sum: { total: true, delivery_fee: true },
          _count: true,
        }),
        prisma.order.aggregate({
          where: {
            restaurant_id: restaurantId,
            created_at: { gte: monthStart, lte: monthEnd },
            status: { not: 'Cancelado' },
          },
          _sum: { total: true, delivery_fee: true },
        }),
        prisma.orderItem.findMany({
          where: {
            order: {
              restaurant_id: restaurantId,
              created_at: { gte: monthStart, lte: monthEnd },
              status: { not: 'Cancelado' },
            },
          },
          include: {
            product: {
              include: { category: true },
            },
          },
        }),
        prisma.orderItem.groupBy({
          by: ['product_id'],
          where: {
            order: {
              restaurant_id: restaurantId,
              created_at: { gte: monthStart, lte: monthEnd },
              status: { not: 'Cancelado' },
            },
          },
          _sum: { quantity: true },
        }),
        prisma.promotion.count({
          where: {
            restaurant_id: restaurantId,
            active: true,
            start_date: { lte: new Date() },
            end_date: { gte: new Date() },
          },
        }),
        prisma.review.aggregate({
          where: { restaurant_id: restaurantId },
          _avg: { rating: true },
          _count: true,
        }),
      ]);

    const categoryTotals = new Map<string, { name: string; image: string | null; total: number }>();
    for (const item of salesByCategoryRaw) {
      const cat = item.product.category;
      const existing = categoryTotals.get(cat.id) ?? {
        name: cat.name,
        image: cat.image,
        total: 0,
      };
      existing.total += item.unit_price * item.quantity;
      categoryTotals.set(cat.id, existing);
    }

    const productIds = topProductsRaw.map((p) => p.product_id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const topProducts = topProductsRaw
      .map((p) => {
        const product = productMap.get(p.product_id);
        const qty = p._sum.quantity ?? 0;
        return {
          productId: p.product_id,
          name: product?.name ?? 'Desconocido',
          quantitySold: qty,
          revenue: qty * (product?.price ?? 0),
        };
      })
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    const salesToday = restaurantProductSales(
      todayOrders._sum.total ?? 0,
      todayOrders._sum.delivery_fee ?? 0,
    );
    const monthlySales = restaurantProductSales(
      monthOrders._sum.total ?? 0,
      monthOrders._sum.delivery_fee ?? 0,
    );
    const monthlyGoal = restaurant.monthly_goal ?? null;
    const dailyGoal =
      (restaurant as { daily_goal?: number | null }).daily_goal ?? null;

    return {
      salesToday,
      ordersToday: todayOrders._count,
      monthlySales,
      monthlyGoal,
      dailyGoal,
      goalProgressPercent:
        monthlyGoal != null && monthlyGoal > 0
          ? Math.round((monthlySales / monthlyGoal) * 1000) / 10
          : null,
      dailyGoalProgressPercent:
        dailyGoal != null && dailyGoal > 0
          ? Math.round((salesToday / dailyGoal) * 1000) / 10
          : null,
      salesByCategory: Array.from(categoryTotals.entries()).map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        image: data.image,
        total: data.total,
      })),
      topProducts,
      activePromotionsCount: activePromos,
      averageRating: Math.round((reviewAgg._avg.rating ?? restaurant.rating) * 10) / 10,
      reviewCount: reviewAgg._count,
    };
  }

  async getSalesReport(restaurantId: string, from: Date, to: Date) {
    const orders = await prisma.order.findMany({
      where: {
        restaurant_id: restaurantId,
        created_at: { gte: from, lte: to },
        status: { in: ['Entregado', 'EnCamino', 'Listo', 'EnPreparacion', 'Recibido'] },
      },
    });

    const delivered = orders.filter((o) => o.status === 'Entregado');
    const grossSales = orders.reduce(
      (sum, o) => sum + restaurantProductSales(o.total, o.delivery_fee),
      0,
    );
    const courierPayout = delivered.reduce((sum, o) => sum + o.delivery_fee, 0);
    const appCommissions = Math.round(grossSales * APP_COMMISSION_RATE);
    // grossSales ya excluye domicilio; no restar courierPayout otra vez
    const netProfit = grossSales;
    const realNetProfit = netProfit - appCommissions;

    return {
      period: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      },
      grossSales,
      courierPayout,
      deliveredOrders: delivered.length,
      netProfit,
      appCommissions,
      realNetProfit,
      marginPercent: grossSales > 0 ? Math.round((realNetProfit / grossSales) * 1000) / 10 : 0,
    };
  }

  async getMonthlySales(restaurantId: string, year: number) {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const results = await Promise.all(
      months.map(async (month) => {
        const from = new Date(year, month, 1);
        const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
        const agg = await prisma.order.aggregate({
          where: {
            restaurant_id: restaurantId,
            created_at: { gte: from, lte: to },
            status: { not: 'Cancelado' },
          },
          _sum: { total: true, delivery_fee: true },
          _count: true,
        });
        return {
          month: month + 1,
          label: labels[month],
          grossSales: restaurantProductSales(agg._sum.total ?? 0, agg._sum.delivery_fee ?? 0),
          orders: agg._count,
        };
      })
    );

    return results;
  }

  async getCourierPayouts(restaurantId: string, from: Date, to: Date) {
    const orders = await prisma.order.findMany({
      where: {
        restaurant_id: restaurantId,
        status: 'Entregado',
        updated_at: { gte: from, lte: to },
        delivery_person_id: { not: null },
      },
      include: { delivery_person: { select: { id: true, name: true } } },
    });

    const byCourier = new Map<string, { name: string; orders: number; payout: number }>();
    for (const order of orders) {
      const courierId = order.delivery_person_id!;
      const existing = byCourier.get(courierId) ?? {
        name: order.delivery_person!.name,
        orders: 0,
        payout: 0,
      };
      existing.orders += 1;
      existing.payout += order.delivery_fee;
      byCourier.set(courierId, existing);
    }

    return Array.from(byCourier.entries()).map(([courierId, data]) => ({
      courierId,
      courierName: data.name,
      ordersDelivered: data.orders,
      totalPayout: data.payout,
    }));
  }

  async exportSalesCsv(restaurantId: string, from: Date, to: Date) {
    const orders = await prisma.order.findMany({
      where: {
        restaurant_id: restaurantId,
        created_at: { gte: from, lte: to },
      },
      orderBy: { created_at: 'asc' },
    });

    const header = 'codigo,cliente,total,domicilio,estado,fecha\n';
    const rows = orders
      .map(
        (o) =>
          `${o.code},"${o.customer_name}",${o.total},${o.delivery_fee},${o.status},${o.created_at.toISOString()}`
      )
      .join('\n');
    return header + rows;
  }

  async listReviews(restaurantId: string, limit: number, offset: number) {
    const [data, total] = await Promise.all([
      prisma.review.findMany({
        where: { restaurant_id: restaurantId },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.review.count({ where: { restaurant_id: restaurantId } }),
    ]);

    return {
      data: data.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        customerName: r.customer_name,
        createdAt: r.created_at,
      })),
      total,
    };
  }

  async createReview(
    restaurantId: string,
    data: { rating: number; comment?: string; customerName: string }
  ) {
    const record = await prisma.review.create({
      data: {
        restaurant_id: restaurantId,
        rating: data.rating,
        comment: data.comment ?? null,
        customer_name: data.customerName,
      },
    });

    return {
      id: record.id,
      rating: record.rating,
      comment: record.comment,
      customerName: record.customer_name,
      createdAt: record.created_at,
    };
  }

  async getActiveDeliveries(restaurantId: string) {
    const orders = await prisma.order.findMany({
      where: {
        restaurant_id: restaurantId,
        status: 'EnCamino',
        delivery_person_id: { not: null },
      },
      include: { delivery_person: { select: { id: true, name: true, vehicle: true } } },
      orderBy: { updated_at: 'desc' },
    });

    const groups = new Map<string, {
      courierId: string;
      courierName: string;
      vehicle: string | null;
      orders: ActiveDeliveryGroup['orders'];
      totalDeliveryPay: number;
      zones: Set<string>;
    }>();

    for (const order of orders) {
      const courierId = order.delivery_person_id!;
      const existing = groups.get(courierId) ?? {
        courierId,
        courierName: order.delivery_person!.name,
        vehicle: order.delivery_person!.vehicle,
        orders: [],
        totalDeliveryPay: 0,
        zones: new Set<string>(),
      };
      existing.orders.push({
        orderId: order.code,
        customerName: order.customer_name,
        address: order.address,
        zone: order.zone,
        status: order.status,
        deliveryFee: order.delivery_fee,
      });
      existing.totalDeliveryPay += order.delivery_fee;
      if (order.zone) existing.zones.add(order.zone);
      groups.set(courierId, existing);
    }

    return Array.from(groups.values()).map((g) => ({
      courierId: g.courierId,
      courierName: g.courierName,
      vehicle: g.vehicle,
      averageRating: 4.8,
      orders: g.orders,
      totalDeliveryPay: g.totalDeliveryPay,
      zones: Array.from(g.zones),
    }));
  }

  async listDispatches(restaurantId: string, from: Date, to: Date) {
    const dispatches = await prisma.dispatch.findMany({
      where: {
        restaurant_id: restaurantId,
        dispatched_at: { gte: from, lte: to },
      },
      include: {
        order: true,
        courier: { select: { id: true, name: true } },
      },
      orderBy: { dispatched_at: 'desc' },
    });

    return dispatches.map((d) => ({
      orderId: d.order.code,
      customerName: d.order.customer_name,
      total: d.order.total,
      deliveryFee: d.order.delivery_fee,
      courierId: d.courier.id,
      courierName: d.courier.name,
      dispatchedAt: d.dispatched_at,
    }));
  }

  async getDispatchSummary(restaurantId: string, period: 'today' | 'month' | 'year') {
    const now = new Date();
    let from: Date;
    let to: Date = endOfDay(now);

    if (period === 'today') {
      from = startOfDay(now);
    } else if (period === 'month') {
      from = startOfMonth(now);
      to = endOfMonth(now);
    } else {
      from = startOfYear(now);
      to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    const [today, month, year] = await Promise.all([
      prisma.dispatch.count({
        where: { restaurant_id: restaurantId, dispatched_at: { gte: startOfDay(), lte: endOfDay() } },
      }),
      prisma.dispatch.count({
        where: { restaurant_id: restaurantId, dispatched_at: { gte: startOfMonth(), lte: endOfMonth() } },
      }),
      prisma.dispatch.count({
        where: { restaurant_id: restaurantId, dispatched_at: { gte: startOfYear() } },
      }),
    ]);

    return { today, month, year };
  }

  async listAvailableCouriers(restaurantId: string, batchSize: number) {
    const couriers = await prisma.user.findMany({
      where: {
        role: 'domiciliario',
        status: 'Activo',
        restaurant_id: restaurantId,
      },
      select: { id: true, name: true, vehicle: true },
    });

    const activeCounts = await prisma.order.groupBy({
      by: ['delivery_person_id'],
      where: {
        restaurant_id: restaurantId,
        status: 'EnCamino',
        delivery_person_id: { not: null },
      },
      _count: true,
    });

    const countMap = new Map(
      activeCounts.map((c) => [c.delivery_person_id!, c._count])
    );

    return couriers.map((c) => {
      const activeOrders = countMap.get(c.id) ?? 0;
      return {
        id: c.id,
        name: c.name,
        vehicle: c.vehicle,
        averageRating: 4.8,
        activeOrders,
        canTakeBatch: activeOrders + batchSize <= 5,
      };
    });
  }
}
