import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../../domain/errors';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof DomainError) {
    const body: Record<string, unknown> = {
      error: err.code,
      message: err.message,
    };
    if (err.details) {
      body.details = err.details;
    }
    return res.status(err.statusCode).json(body);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  console.error(err);

  const isDev = process.env.NODE_ENV !== 'production';
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Error interno del servidor',
    ...(isDev && { stack: err.stack }),
  });
}
