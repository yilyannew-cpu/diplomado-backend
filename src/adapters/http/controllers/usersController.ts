import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';
import { serializeUser } from '../serializers/userSerializer';
import { Role } from '../../../domain/enums';
import { PendingUserWithRestaurant } from '../../../application/ports';

function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export async function listPendingController(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await container.listPendingUseCase.execute();
    const data = result.data.map((user: PendingUserWithRestaurant) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
      created_at: user.createdAt ? user.createdAt.toISOString() : null,
      restaurant: user.restaurant ?? undefined,
    }));
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listUsersController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await container.listUsersUseCase.execute({
      role: req.query.role as Role | undefined,
      status: req.query.status as import('../../../domain/enums').UserStatus | undefined,
      q: req.query.q as string | undefined,
    });
    res.json({ data: result.data.map(serializeUser) });
  } catch (error) {
    next(error);
  }
}

export async function getUserByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await container.getUserByIdUseCase.execute(paramId(req));
    res.json({ data: serializeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function createUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await container.createUserUseCase.execute(
      {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        phone: req.body.phone,
        vehicle: req.body.vehicle,
        restaurantId: req.body.restaurant_id,
        status: req.body.status,
      },
      req.user!.role
    );
    res.status(201).json({ data: serializeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function approveUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await container.approveUserUseCase.execute(paramId(req));
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function rejectUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await container.rejectUserUseCase.execute(paramId(req), req.body?.reason);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await container.updateUserUseCase.execute(
      paramId(req),
      {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        vehicle: req.body.vehicle,
        role: req.body.role,
        status: req.body.status,
        restaurantId: req.body.restaurant_id,
      },
      req.user!.role
    );
    res.json({ data: serializeUser(user) });
  } catch (error) {
    next(error);
  }
}
