import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';
import { serializePromotion } from '../serializers/promotionSerializer';
import { param } from '../utils/routeParams';

export async function listPromotionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const promotions = await container.listPromotionsUseCase.execute(param(req, 'restaurantId'));
    res.json(promotions.map(serializePromotion));
  } catch (error) {
    next(error);
  }
}

export async function listActivePromotionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const promotions = await container.listActivePromotionsUseCase.execute(param(req, 'restaurantId'));
    res.json(promotions.map(serializePromotion));
  } catch (error) {
    next(error);
  }
}

export async function createPromotionController(req: Request, res: Response, next: NextFunction) {
  try {
    const promotion = await container.createPromotionUseCase.execute({
      name: req.body.name,
      discountPercent: req.body.discount_percent,
      productIds: req.body.product_ids,
      startDate: new Date(req.body.start_date),
      endDate: new Date(req.body.end_date),
      active: req.body.active ?? true,
      restaurantId: param(req, 'restaurantId'),
    });
    res.status(201).json(serializePromotion(promotion));
  } catch (error) {
    next(error);
  }
}

export async function getPromotionController(req: Request, res: Response, next: NextFunction) {
  try {
    const promotion = await container.getPromotionUseCase.execute(param(req, 'promotionId'));
    res.json(serializePromotion(promotion));
  } catch (error) {
    next(error);
  }
}

export async function updatePromotionController(req: Request, res: Response, next: NextFunction) {
  try {
    const promotion = await container.updatePromotionUseCase.execute(param(req, 'promotionId'), {
      name: req.body.name,
      discountPercent: req.body.discount_percent,
      productIds: req.body.product_ids,
      startDate: req.body.start_date ? new Date(req.body.start_date) : undefined,
      endDate: req.body.end_date ? new Date(req.body.end_date) : undefined,
      active: req.body.active,
    });
    res.json(serializePromotion(promotion));
  } catch (error) {
    next(error);
  }
}

export async function deletePromotionController(req: Request, res: Response, next: NextFunction) {
  try {
    await container.deletePromotionUseCase.execute(param(req, 'promotionId'));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
