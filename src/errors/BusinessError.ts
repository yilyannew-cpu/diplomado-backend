import { AppError } from './AppError';

/**
 * Errores esperados de lógica de negocio (HTTP 400 por defecto).
 * Extiende desde aquí: NotFoundError, ValidationError, ConflictError, etc.
 */
export class BusinessError extends AppError {
  constructor(
    message: string,
    statusCode = 400,
    options?: { cause?: unknown }
  ) {
    super(message, statusCode, options);
  }
}
