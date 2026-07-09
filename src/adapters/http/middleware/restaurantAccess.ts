import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';
import { Role } from '../../../domain/enums';
import { ForbiddenError, UnauthorizedError } from '../../../domain/errors';
import { param } from '../utils/routeParams';

export function requireRestaurantAccess(paramName = 'restaurantId') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(new UnauthorizedError());

      if (req.user.role === Role.SUPERADMIN) return next();

      if (req.user.role !== Role.ADMIN) {
        return next(new ForbiddenError());
      }

      const restaurantId = param(req, paramName);
      const user = await container.userRepository.findById(req.user.id);

      if (!user?.restaurantId || user.restaurantId !== restaurantId) {
        return next(new ForbiddenError('No tienes acceso a este restaurante'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export async function getAdminRestaurantId(userId: string): Promise<string | null> {
  const user = await container.userRepository.findById(userId);
  return user?.restaurantId ?? null;
}
