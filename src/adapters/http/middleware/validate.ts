import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { DomainError } from '../../../domain/errors';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.') || 'unknown',
          message: e.message,
        }));
        next(
          new DomainError('VALIDATION_ERROR', 'Datos inválidos', 400, details)
        );
      } else {
        next(error);
      }
    }
  };
}
