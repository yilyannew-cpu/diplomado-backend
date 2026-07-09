import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';

export async function createReportController(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await container.createUserReportUseCase.execute({
      reportedUser: req.body.reported_user,
      reportedBy: req.user!.id,
      reason: req.body.reason,
    });
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
}

export async function listReportsController(req: Request, res: Response, next: NextFunction) {
  try {
    const reports = await container.listUserReportsUseCase.execute();
    res.json(reports);
  } catch (error) {
    next(error);
  }
}
