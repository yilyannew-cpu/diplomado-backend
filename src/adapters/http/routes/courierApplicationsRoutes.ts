import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { Role } from '../../../domain/enums';
import {
  applyController,
  reviewController,
  listController,
  setAvailabilityController,
} from '../controllers/courierApplicationsController';

const authenticate = createAuthenticateMiddleware(container.tokenService);

export const courierApplicationsRouter = Router();

// Listar solicitudes (admin ve las de su restaurante, domiciliario ve las suyas)
courierApplicationsRouter.get(
  '/',
  authenticate,
  listController,
);

// Domiciliario cambia disponibilidad de turno (ANTES de /:id/review)
courierApplicationsRouter.patch(
  '/availability',
  authenticate,
  authorize(Role.DOMICILIARIO),
  setAvailabilityController,
);

// Domiciliario se postula a un restaurante
courierApplicationsRouter.post(
  '/apply',
  authenticate,
  authorize(Role.DOMICILIARIO),
  applyController,
);

// Admin acepta o rechaza una solicitud
courierApplicationsRouter.patch(
  '/:id/review',
  authenticate,
  authorize(Role.ADMIN, Role.SUPERADMIN),
  reviewController,
);
