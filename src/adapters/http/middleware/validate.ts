import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { DomainError } from '../../../domain/errors';

type ValidationTarget = 'body' | 'query' | 'params';

function assignValidated(req: Request, target: ValidationTarget, parsed: unknown): void {
  if (target === 'body') {
    req.body = parsed;
    return;
  }

  // Express 5 expone query/params como getters de solo lectura.
  Object.defineProperty(req, target, {
    value: parsed,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[target]);
      assignValidated(req, target, parsed);
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
