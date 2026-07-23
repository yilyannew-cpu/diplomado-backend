/**
 * Clase base de errores de aplicación.
 * Preserva message/stack/name y soporta `cause` (ES2022).
 */
export class AppError extends Error {
  readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number,
    options?: { cause?: unknown }
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.statusCode = statusCode;

    // Mantiene el stack apuntando al throw real (V8)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, new.target);
    }
  }
}
