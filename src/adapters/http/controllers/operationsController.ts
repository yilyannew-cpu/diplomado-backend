import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';
import { OrderStatus } from '../../../domain/enums';

export async function getDashboardMetricsController(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await container.getDashboardMetricsUseCase.execute();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getSystemStatusController(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await container.getSystemStatusUseCase.execute();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as OrderStatus | undefined;
    const data = await container.listOrdersUseCase.execute(status);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function listActiveCouriersController(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await container.listActiveCouriersUseCase.execute();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getOperationsMetricsController(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await container.getOperationsMetricsUseCase.execute();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
