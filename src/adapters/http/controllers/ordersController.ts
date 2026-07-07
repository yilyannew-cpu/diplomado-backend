import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';
import { OrderStatus } from '../../../domain/enums';

export async function createOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await container.createOrderUseCase.execute(req.body);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

export async function listRestaurantOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await container.listRestaurantOrdersUseCase.execute(req.params.restaurantId);
    res.json(orders);
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await container.updateOrderStatusUseCase.execute(
      req.params.id,
      req.body.status as OrderStatus
    );
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function assignCourierController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await container.assignCourierUseCase.execute(
      req.params.id,
      req.body.courierId
    );
    res.json(order);
  } catch (error) {
    next(error);
  }
}
