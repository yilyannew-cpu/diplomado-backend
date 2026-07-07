import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';

export async function listRestaurantsController(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurants = await container.listRestaurantsUseCase.execute();
    res.json(restaurants);
  } catch (error) {
    next(error);
  }
}
