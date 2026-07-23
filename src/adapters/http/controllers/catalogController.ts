import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';

export async function listComunasController(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await container.listComunasUseCase.execute();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listVehicleTypesController(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await container.listVehicleTypesUseCase.execute();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listMenuCategoryTemplatesController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await container.listMenuCategoryTemplatesUseCase.execute();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
