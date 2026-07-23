import { AppError } from './AppError';

/**
 * Fallos de autenticación / credenciales (HTTP 401 por defecto).
 * Para permisos insuficientes usa ForbiddenError (403).
 */
export class UnauthorizedError extends AppError {
  constructor(
    message = 'No autenticado',
    statusCode = 401,
    options?: { cause?: unknown }
  ) {
    super(message, statusCode, options);
  }
}
