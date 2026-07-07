import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';

export async function listProductsController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      restaurantId: req.query.restaurantId as string,
      categoryId: req.query.categoryId as string,
      onlyAvailable: req.query.available === 'true' ? true : req.query.available === 'false' ? false : undefined,
    };
    const products = await container.listProductsUseCase.execute(filters);
    res.json(products);
  } catch (error) {
    next(error);
  }
}

export async function getProductController(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await container.getProductUseCase.execute(req.params.id);
    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function createProductController(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await container.createProductUseCase.execute(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

export async function updateProductController(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await container.updateProductUseCase.execute(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function toggleProductAvailabilityController(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await container.toggleAvailabilityUseCase.execute(req.params.id);
    res.json(product);
  } catch (error) {
    next(error);
  }
}
