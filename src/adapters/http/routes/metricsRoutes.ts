import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { listOrdersQuerySchema } from '../dto/schemas';
import { getDashboardMetricsController, getOperationsMetricsController } from '../controllers/operationsController';
import { Role } from '../../../domain/enums';

const authenticate = createAuthenticateMiddleware(container.tokenService);
const superadminOnly = [authenticate, authorize(Role.SUPERADMIN)];

export const metricsRouter = Router();

metricsRouter.get('/dashboard', ...superadminOnly, getDashboardMetricsController);
metricsRouter.get('/operations', ...superadminOnly, getOperationsMetricsController);
