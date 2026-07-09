import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  loginSchema,
  registerClientSchema,
  registerRestaurantSchema,
  registerCourierSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../dto/schemas';
import {
  loginController,
  getMeController,
  logoutController,
  updateProfileController,
  changePasswordController,
  registerClientController,
  registerRestaurantController,
  registerCourierController,
} from '../controllers/authController';

const authenticate = createAuthenticateMiddleware(container.tokenService);

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), loginController);
authRouter.post('/register/client', validate(registerClientSchema), registerClientController);
authRouter.post('/register/restaurant', validate(registerRestaurantSchema), registerRestaurantController);
authRouter.post('/register/courier', validate(registerCourierSchema), registerCourierController);
authRouter.get('/me', authenticate, getMeController);
authRouter.patch('/me', authenticate, validate(updateProfileSchema), updateProfileController);
authRouter.patch('/me/password', authenticate, validate(changePasswordSchema), changePasswordController);
authRouter.post('/logout', authenticate, logoutController);
