import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';
import { serializeRestaurantProfile } from '../serializers/restaurantSerializer';
import { param } from '../utils/routeParams';

export async function getRestaurantController(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurant = await container.getRestaurantUseCase.execute(param(req, 'restaurantId'));
    res.json(serializeRestaurantProfile(restaurant));
  } catch (error) {
    next(error);
  }
}

export async function updateRestaurantController(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurant = await container.updateRestaurantUseCase.execute(
      param(req, 'restaurantId'),
      {
        name: req.body.name,
        tagline: req.body.tagline,
        city: req.body.city,
        address: req.body.address,
        deliveryMinutes: req.body.delivery_minutes,
        monthlyGoal: req.body.monthly_goal,
        accent: req.body.accent,
      }
    );
    res.json(serializeRestaurantProfile(restaurant));
  } catch (error) {
    next(error);
  }
}

export async function getDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await container.getRestaurantDashboardUseCase.execute(param(req, 'restaurantId'));
    res.json({
      sales_today: data.salesToday,
      orders_today: data.ordersToday,
      monthly_sales: data.monthlySales,
      monthly_goal: data.monthlyGoal,
      goal_progress_percent: data.goalProgressPercent,
      sales_by_category: data.salesByCategory.map((c) => ({
        category_id: c.categoryId,
        category_name: c.categoryName,
        image: c.image,
        total: c.total,
      })),
      top_products: data.topProducts.map((p) => ({
        product_id: p.productId,
        name: p.name,
        quantity_sold: p.quantitySold,
        revenue: p.revenue,
      })),
      active_promotions_count: data.activePromotionsCount,
      average_rating: data.averageRating,
      review_count: data.reviewCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function listReviewsController(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Number(req.query.limit ?? 10);
    const offset = Number(req.query.offset ?? 0);
    const result = await container.listReviewsUseCase.execute(
      param(req, 'restaurantId'),
      limit,
      offset
    );
    res.json({
      data: result.data.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        customer_name: r.customerName,
        created_at: r.createdAt.toISOString(),
      })),
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
}

export async function createReviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await container.createReviewUseCase.execute(param(req, 'restaurantId'), {
      rating: req.body.rating,
      comment: req.body.comment,
      customerName: req.body.customer_name,
    });
    res.status(201).json({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customer_name: review.customerName,
      created_at: review.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesReportController(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await container.getSalesReportUseCase.execute(
      param(req, 'restaurantId'),
      (req.query.preset as string) ?? 'month',
      req.query.from as string | undefined,
      req.query.to as string | undefined
    );
    res.json({
      period: report.period,
      gross_sales: report.grossSales,
      courier_payout: report.courierPayout,
      delivered_orders: report.deliveredOrders,
      net_profit: report.netProfit,
      app_commissions: report.appCommissions,
      real_net_profit: report.realNetProfit,
      margin_percent: report.marginPercent,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMonthlySalesController(req: Request, res: Response, next: NextFunction) {
  try {
    const year = Number(req.query.year ?? new Date().getFullYear());
    const data = await container.getMonthlySalesUseCase.execute(param(req, 'restaurantId'), year);
    res.json({ year, data: data.map((m) => ({ month: m.month, label: m.label, gross_sales: m.grossSales, orders: m.orders })) });
  } catch (error) {
    next(error);
  }
}

export async function getCourierPayoutsController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await container.getCourierPayoutsUseCase.execute(
      param(req, 'restaurantId'),
      req.query.from as string,
      req.query.to as string
    );
    res.json({
      data: data.map((r) => ({
        courier_id: r.courierId,
        courier_name: r.courierName,
        orders_delivered: r.ordersDelivered,
        total_payout: r.totalPayout,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function exportSalesCsvController(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await container.exportSalesCsvUseCase.execute(
      param(req, 'restaurantId'),
      req.query.from as string,
      req.query.to as string
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ventas.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

export async function getActiveDeliveriesController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await container.getActiveDeliveriesUseCase.execute(param(req, 'restaurantId'));
    res.json({
      data: data.map((g) => ({
        courier_id: g.courierId,
        courier_name: g.courierName,
        vehicle: g.vehicle,
        average_rating: g.averageRating,
        orders: g.orders.map((o) => ({
          order_id: o.orderId,
          customer_name: o.customerName,
          address: o.address,
          zone: o.zone,
          status: o.status,
          delivery_fee: o.deliveryFee,
        })),
        total_delivery_pay: g.totalDeliveryPay,
        zones: g.zones,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function listDispatchesController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await container.listDispatchesUseCase.execute(
      param(req, 'restaurantId'),
      req.query.from as string | undefined,
      req.query.to as string | undefined,
      req.query.period as string | undefined
    );
    res.json({
      data: data.map((d) => ({
        order_id: d.orderId,
        customer_name: d.customerName,
        total: d.total,
        delivery_fee: d.deliveryFee,
        courier_id: d.courierId,
        courier_name: d.courierName,
        dispatched_at: d.dispatchedAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function getDispatchSummaryController(req: Request, res: Response, next: NextFunction) {
  try {
    const period = (req.query.period as 'today' | 'month' | 'year') ?? 'month';
    const summary = await container.getDispatchSummaryUseCase.execute(param(req, 'restaurantId'), period);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function listAvailableCouriersController(req: Request, res: Response, next: NextFunction) {
  try {
    const batchSize = Number(req.query.batch_size ?? 3);
    const couriers = await container.listAvailableCouriersUseCase.execute(
      param(req, 'restaurantId'),
      batchSize
    );
    res.json({
      data: couriers.map((c) => ({
        id: c.id,
        name: c.name,
        vehicle: c.vehicle,
        average_rating: c.averageRating,
        active_orders: c.activeOrders,
        can_take_batch: c.canTakeBatch,
      })),
    });
  } catch (error) {
    next(error);
  }
}
