import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';
import { serializeUserPublic, serializeUser } from '../serializers/userSerializer';

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await container.loginUseCase.execute(req.body);
    res.json({
      token: result.token,
      user: serializeUserPublic(result.user),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMeController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await container.getMeUseCase.execute(req.user!.id);
    res.json({ user: serializeUserPublic(user) });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await container.logoutUseCase.execute();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await container.updateProfileUseCase.execute(req.user!.id, req.user!.role, {
      email: req.body.email,
      phone: req.body.phone,
    });
    res.json({ user: serializeUserPublic(user) });
  } catch (error) {
    next(error);
  }
}

export async function changePasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await container.changePasswordUseCase.execute(req.user!.id, {
      currentPassword: req.body.current_password,
      password: req.body.password,
    });
    res.json({ user: serializeUserPublic(user), message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
}

export async function registerClientController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await container.registerClientUseCase.execute({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
    });
    res.status(201).json({
      token: result.token,
      user: serializeUserPublic(result.user),
    });
  } catch (error) {
    next(error);
  }
}

export async function registerRestaurantController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await container.registerRestaurantUseCase.execute({
      ownerName: req.body.owner_name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      restaurantName: req.body.restaurant_name,
      tagline: req.body.tagline,
      city: req.body.city,
      address: req.body.address,
      deliveryMinutes: req.body.delivery_minutes,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function registerCourierController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await container.registerCourierUseCase.execute({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      documentId: req.body.document_id,
      vehicleType: req.body.vehicle_type,
      vehiclePlate: req.body.vehicle_plate,
      vehicleDescription: req.body.vehicle_description,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
