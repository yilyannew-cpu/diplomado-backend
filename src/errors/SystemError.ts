import { AppError } from './AppError';

/**
 * Fallos técnicos / infraestructura (HTTP 500 por defecto).
 * El mensaje interno NO debe llegarle al cliente (lo filtra handleError).
 */
export class SystemError extends AppError {
  constructor(
    message = 'Error interno del servidor',
    statusCode = 500,
    options?: { cause?: unknown }
  ) {
    super(message, statusCode, options);
  }
}
