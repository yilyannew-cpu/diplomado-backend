import { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { container } from '../../../container';
import { OrderStatus } from '../../../domain/enums';
import { param } from '../utils/routeParams';
import { serializeOrders, parseStatusFilter } from '../serializers/orderSerializer';

function emitToRestaurant(io: SocketIOServer | undefined, restaurantId: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`restaurant:${restaurantId}`).emit(event, data);
  io.emit(event, data);
}

export async function createOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await container.createOrderUseCase.execute({
      customerName: req.body.customer_name ?? req.body.customerName,
      address: req.body.address,
      phone: req.body.phone,
      notes: req.body.notes,
      zone: req.body.zone,
      restaurantId: req.body.restaurant_id ?? req.body.restaurantId,
      items: (req.body.items ?? []).map((item: Record<string, unknown>) => ({
        productId: item.product_id ?? item.productId,
        quantity: item.quantity,
        customizations: item.customizations,
      })),
    });
    const io = req.app.get('io') as SocketIOServer;
    const serialized = serializeOrders([order as any])[0];
    emitToRestaurant(io, order.restaurantId, 'new_order', serialized);
    res.status(201).json(serialized);
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
    emitToRestaurant(io, order.restaurantId, 'order_status_changed', serialized);
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
    emitToRestaurant(io, order.restaurantId, 'order_status_changed', serialized);
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
      emitToRestaurant(io, orders[0].restaurantId, 'order_status_changed', serialized);
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
      emitToRestaurant(io, orders[0].restaurantId, 'order_status_changed', serialized);
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
