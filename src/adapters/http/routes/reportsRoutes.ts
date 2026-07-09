import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { Role } from '../../../domain/enums';
import { createReportController, listReportsController } from '../controllers/reportsController';

const router = Router();
const authenticate = createAuthenticateMiddleware(container.tokenService);
const adminOnly = [authenticate, authorize(Role.ADMIN, Role.SUPERADMIN)];
const superadminOnly = [authenticate, authorize(Role.SUPERADMIN)];

router.post('/', ...adminOnly, createReportController);
router.get('/', ...superadminOnly, listReportsController);

export { router as reportsRouter };
