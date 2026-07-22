import { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { container } from '../../../container';
import { OrderStatus, Role } from '../../../domain/enums';
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
      deliveryFee: req.body.delivery_fee,
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

export async function myActiveOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      return;
    }
    const order = await container.getMyActiveOrderUseCase.execute(userId);
    if (!order) {
      res.json(null);
      return;
    }
    res.json(serializeOrder(order as any));
  } catch (error) {
    next(error);
  }
}

export async function myOrdersHistoryController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      return;
    }
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) ? limitRaw : 40;
    const orders = await container.getMyOrdersHistoryUseCase.execute(userId, limit);
    res.json(serializeOrders(orders));
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
    const actor = req.user;
    if (!actor) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      return;
    }
    const order = await container.updateOrderStatusSecureUseCase.execute({
      orderId: param(req, 'id'),
      status: req.body.status as OrderStatus,
      actorId: actor.id,
      actorRole: actor.role,
    });
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
    const actor = req.user;
    const orders =
      actor?.role === Role.DOMICILIARIO
        ? await container.listCourierAvailableDeliveriesUseCase.execute(actor.id, restaurantId)
        : await container.listAvailableDeliveriesUseCase.execute(restaurantId);
    res.json(serializeOrders(orders as any));
  } catch (error) {
    next(error);
  }
}

export async function listMyCourierOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const courierId = req.user?.id;
    if (!courierId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      return;
    }
    const orders = await container.listMyCourierOrdersUseCase.execute(courierId);
    res.json(serializeOrders(orders as any));
  } catch (error) {
    next(error);
  }
}

export async function listCourierOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const courierId = param(req, 'courierId');
    const actor = req.user;
    if (actor?.role === Role.DOMICILIARIO && actor.id !== courierId) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Solo puedes consultar tus propios pedidos',
      });
      return;
    }
    const orders = await container.listCourierOrdersUseCase.execute(courierId);
    res.json(serializeOrders(orders as any));
  } catch (error) {
    next(error);
  }
}

export async function acceptDeliveryController(req: Request, res: Response, next: NextFunction) {
  try {
    const courierId = req.user?.id;
    if (!courierId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      return;
    }
    const order = await container.acceptDeliveryUseCase.execute(param(req, 'id'), courierId);
    const io = req.app.get('io') as SocketIOServer;
    const serialized = serializeOrder(order as any);
    emitOrderEvent(io, order, 'order_status_changed', serialized);
    res.json(serialized);
  } catch (error) {
    next(error);
  }
}

export async function startDeliveryController(req: Request, res: Response, next: NextFunction) {
  try {
    const courierId = req.user?.id;
    if (!courierId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      return;
    }
    const order = await container.startDeliveryUseCase.execute(param(req, 'id'), courierId);
    const io = req.app.get('io') as SocketIOServer;
    const serialized = serializeOrder(order as any);
    emitOrderEvent(io, order, 'order_status_changed', serialized);
    res.json(serialized);
  } catch (error) {
    next(error);
  }
}

export async function completeDeliveryController(req: Request, res: Response, next: NextFunction) {
  try {
    const courierId = req.user?.id;
    if (!courierId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      return;
    }
    const order = await container.completeDeliveryUseCase.execute(param(req, 'id'), courierId);
    const io = req.app.get('io') as SocketIOServer;
    const serialized = serializeOrder(order as any);
    emitOrderEvent(io, order, 'order_status_changed', serialized);
    res.json(serialized);
  } catch (error) {
    next(error);
  }
}

export async function getDeliveryReviewStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await container.getDeliveryReviewStatusUseCase.execute(param(req, 'id'));
    res.json(status);
  } catch (error) {
    next(error);
  }
}

export async function submitDeliveryReviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await container.submitDeliveryReviewUseCase.execute(param(req, 'id'), {
      restaurantRating: Number(req.body.restaurant_rating),
      restaurantComment: req.body.restaurant_comment,
      courierRating:
        req.body.courier_rating === undefined || req.body.courier_rating === null
          ? null
          : Number(req.body.courier_rating),
      courierComment: req.body.courier_comment,
      customerName: req.body.customer_name ?? null,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMyCourierRatingController(req: Request, res: Response, next: NextFunction) {
  try {
    const courierId = req.user?.id;
    if (!courierId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      return;
    }
    const rating = await container.getCourierRatingUseCase.execute(courierId);
    res.json(rating);
  } catch (error) {
    next(error);
  }
}
