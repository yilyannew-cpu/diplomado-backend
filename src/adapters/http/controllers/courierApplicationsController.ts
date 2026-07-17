import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';
import { ApplicationStatus } from '../../../domain/enums';

function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

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
    const id = paramId(req);
    const { status } = req.body as { status: ApplicationStatus };
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
