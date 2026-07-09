import { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { container } from '../../../container';
import { OrderStatus } from '../../../domain/enums';
import { param } from '../utils/routeParams';

export async function createOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await container.createOrderUseCase.execute(req.body);
    const io = req.app.get('io') as SocketIOServer;
    if (io) io.emit('new_order', order);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

export async function listRestaurantOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await container.listRestaurantOrdersUseCase.execute(param(req, 'restaurantId'));
    res.json(orders);
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
    if (io) io.emit('order_status_changed', order);
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function assignCourierController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await container.assignCourierUseCase.execute(
      param(req, 'id'),
      req.body.courierId
    );
    const io = req.app.get('io') as SocketIOServer;
    if (io) io.emit('order_status_changed', order);
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function listAvailableDeliveriesController(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await container.listAvailableDeliveriesUseCase.execute();
    res.json(orders);
  } catch (error) {
    next(error);
  }
}

export async function listCourierOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await container.listCourierOrdersUseCase.execute(param(req, 'courierId'));
    res.json(orders);
  } catch (error) {
    next(error);
  }
}
