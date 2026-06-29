import { Router } from 'express';
import { container } from '../../../container';
import { createAuthenticateMiddleware, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  loginSchema,
  registerClientSchema,
  registerRestaurantSchema,
  registerCourierSchema,
} from '../dto/schemas';
import {
  loginController,
  getMeController,
  logoutController,
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
authRouter.post('/logout', authenticate, logoutController);
