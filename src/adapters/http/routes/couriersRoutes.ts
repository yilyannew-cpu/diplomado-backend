import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { listActiveCouriersController } from '../controllers/operationsController';
import { Role } from '../../../domain/enums';

const authenticate = createAuthenticateMiddleware(container.tokenService);
const superadminOnly = [authenticate, authorize(Role.SUPERADMIN)];

export const couriersRouter = Router();

couriersRouter.get('/active', ...superadminOnly, listActiveCouriersController);
