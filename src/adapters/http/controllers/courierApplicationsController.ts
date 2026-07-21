import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';

export async function applyController(req: Request, res: Response, next: NextFunction) {
  try {
    const courierId = req.user!.id;
    const { restaurantId } = req.body;
    const application = await container.applyToRestaurantUseCase.execute(courierId, restaurantId);
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
}

export async function reviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const application = await container.reviewApplicationUseCase.execute(id, status);
    res.json(application);
  } catch (error) {
    next(error);
  }
}

export async function listController(req: Request, res: Response, next: NextFunction) {
  try {
    const { restaurantId, courierId } = req.query as { restaurantId?: string; courierId?: string };
    const applications = await container.listApplicationsUseCase.execute({ restaurantId, courierId });
    res.json(applications);
  } catch (error) {
    next(error);
  }
}

export async function toggleAvailabilityController(req: Request, res: Response, next: NextFunction) {
  try {
    const courierId = req.user!.id;
    const { isAvailable } = req.body;
    const user = await container.toggleUserAvailabilityUseCase.execute(courierId, isAvailable);
    res.json({ id: user.id, is_available: user.isAvailable });
  } catch (error) {
    next(error);
  }
}
