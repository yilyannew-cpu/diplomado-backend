import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createUserSchema,
  updateUserSchema,
  rejectUserSchema,
  listUsersQuerySchema,
  idParamSchema,
} from '../dto/schemas';
import {
  listPendingController,
  listUsersController,
  getUserByIdController,
  createUserController,
  approveUserController,
  rejectUserController,
  updateUserController,
} from '../controllers/usersController';
import { Role } from '../../../domain/enums';

const authenticate = createAuthenticateMiddleware(container.tokenService);
const superadminOnly = [authenticate, authorize(Role.SUPERADMIN)];

export const usersRouter = Router();

usersRouter.get('/pending', ...superadminOnly, listPendingController);
usersRouter.get('/', ...superadminOnly, validate(listUsersQuerySchema, 'query'), listUsersController);
usersRouter.get('/:id', ...superadminOnly, validate(idParamSchema, 'params'), getUserByIdController);
usersRouter.post('/', ...superadminOnly, validate(createUserSchema), createUserController);
usersRouter.patch(
  '/:id/approve',
  ...superadminOnly,
  validate(idParamSchema, 'params'),
  approveUserController
);
usersRouter.patch(
  '/:id/reject',
  ...superadminOnly,
  validate(idParamSchema, 'params'),
  validate(rejectUserSchema),
  rejectUserController
);
usersRouter.patch(
  '/:id',
  ...superadminOnly,
  validate(idParamSchema, 'params'),
  validate(updateUserSchema),
  updateUserController
);
