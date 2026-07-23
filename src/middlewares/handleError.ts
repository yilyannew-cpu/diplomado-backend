import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { BusinessError } from '../errors/BusinessError';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { SystemError } from '../errors/SystemError';
import { ValidationError } from '../errors/ValidationError';
import { DomainError } from '../domain/errors';
import { logger } from '../utils/logger';

/**
 * Middleware centralizado de errores (4 args).
 * Regla: nunca exponer stack, causas ni detalle técnico de BD/sistema al cliente.
 */
export function handleError(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ─── Errores de negocio (incluye NotFound, Forbidden, Conflict, Validation) ───
  if (err instanceof BusinessError) {
    logger.warn(err.message);

    const body: Record<string, unknown> = {
      success: false,
      message: err.message,
    };

    if (err instanceof ValidationError && err.details) {
      body.details = err.details;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // ─── Autenticación ───
  if (err instanceof UnauthorizedError) {
    logger.warn(err.message);
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // ─── Dominio existente (compatibilidad con use-cases actuales) ───
  if (err instanceof DomainError) {
    logger.warn(err.message);

    const body: Record<string, unknown> = {
      success: false,
      error: err.code,
      message: err.message,
    };
    if (err.details) {
      body.details = err.details;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // ─── Validación Zod (entrada HTTP) ───
  if (err instanceof ZodError) {
    logger.warn('Datos inválidos (Zod)');
    res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // ─── Fallos técnicos controlados ───
  if (err instanceof SystemError) {
    logger.error(err);
    res.status(err.statusCode).json({
      success: false,
      message: 'Error interno del servidor',
    });
    return;
  }

  // ─── No controlado (TypeError, null refs, etc.) ───
  logger.error(err);
  res.status(500).json({
    success: false,
    message: 'Error no controlado.',
  });
}
