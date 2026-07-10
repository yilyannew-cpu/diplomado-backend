import { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { container } from '../../../container';
import { OrderStatus } from '../../../domain/enums';
import { param } from '../utils/routeParams';
import { serializeOrders, serializeOrder, parseStatusFilter } from '../serializers/orderSerializer';
import { Order } from '../../../domain/entities/Order';

function emitOrderEvent(
  io: SocketIOServer | undefined,
  order: Pick<Order, 'restaurantId' | 'code'>,
  event: string,
  data: unknown
) {
  if (!io) return;
  io.to(`restaurant:${order.restaurantId}`).emit(event, data);
  io.to(`order:${order.code}`).emit(event, data);
}

export async function createOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await container.createOrderUseCase.execute({
      customerName: req.body.customer_name,
      address: req.body.address,
      phone: req.body.phone,
      notes: req.body.notes,
      zone: req.body.zone,
      restaurantId: req.body.restaurant_id,
      items: req.body.items.map((item: Record<string, unknown>) => ({
        productId: item.product_id,
        quantity: item.quantity,
        customizations: item.customizations,
      })),
    });
    const io = req.app.get('io') as SocketIOServer;
    const serialized = serializeOrders([order as any])[0];
    emitOrderEvent(io, order, 'new_order', serialized);
    res.status(201).json(serialized);
  } catch (error) {
    next(error);
  }
}

export async function trackOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await container.getOrderByCodeUseCase.execute(param(req, 'code'));
    res.json(serializeOrder(order as any));
  } catch (error) {
    next(error);
  }
}

export async function listRestaurantOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = param(req, 'restaurantId');
    const statuses = parseStatusFilter(req.query.status as string | undefined);
    const orders = await container.listRestaurantOrdersUseCase.execute({ restaurantId, statuses });
    res.json(serializeOrders(orders));
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await container.updateOrderStatusUseCase.execute(
      param(req, 'id'),
      req.body.status as OrderStatus
    );
    const io = req.app.get('io') as SocketIOServer;
    const serialized = serializeOrders([order as any])[0];
    emitOrderEvent(io, order, 'order_status_changed', serialized);
    res.json(serialized);
  } catch (error) {
    next(error);
  }
}

export async function rejectPaymentController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await container.rejectPaymentUseCase.execute(
      param(req, 'id'),
      req.body.observation
    );
    const io = req.app.get('io') as SocketIOServer;
    if (io) io.emit('payment:rejected', order);
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function assignCourierController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await container.assignCourierUseCase.execute(
      param(req, 'id'),
      req.body.courier_id ?? req.body.courierId
    );
    const io = req.app.get('io') as SocketIOServer;
    const serialized = serializeOrders([order as any])[0];
    emitOrderEvent(io, order, 'order_status_changed', serialized);
    res.json(serialized);
  } catch (error) {
    next(error);
  }
}

export async function batchAssignCourierController(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await container.batchAssignCourierUseCase.execute(
      req.body.order_ids ?? req.body.orderIds,
      req.body.courier_id ?? req.body.courierId
    );
    const io = req.app.get('io') as SocketIOServer;
    const serialized = serializeOrders(orders as any);
    if (orders.length > 0) {
      emitOrderEvent(io, orders[0], 'order_status_changed', serialized);
    }
    res.json(serialized);
  } catch (error) {
    next(error);
  }
}

export async function batchDispatchOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.body.restaurant_id ?? req.body.restaurantId;
    const orders = await container.batchDispatchOrdersUseCase.execute(
      req.body.order_ids ?? req.body.orderIds,
      restaurantId
    );
    const io = req.app.get('io') as SocketIOServer;
    const serialized = serializeOrders(orders as any);
    if (orders.length > 0) {
      emitOrderEvent(io, orders[0], 'order_status_changed', serialized);
    }
    res.json(serialized);
  } catch (error) {
    next(error);
  }
}

export async function listAvailableDeliveriesController(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.query.restaurantId as string | undefined;
    const orders = await container.listAvailableDeliveriesUseCase.execute(restaurantId);
    res.json(serializeOrders(orders as any));
  } catch (error) {
    next(error);
  }
}

export async function listCourierOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await container.listCourierOrdersUseCase.execute(param(req, 'courierId'));
    res.json(serializeOrders(orders as any));
  } catch (error) {
    next(error);
  }
}
