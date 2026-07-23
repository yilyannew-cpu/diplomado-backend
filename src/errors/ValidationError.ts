import { BusinessError } from './BusinessError';

export class ValidationError extends BusinessError {
  readonly details?: Array<{ field: string; message: string }>;

  constructor(
    message = 'Datos inválidos',
    details?: Array<{ field: string; message: string }>,
    options?: { cause?: unknown }
  ) {
    super(message, 400, options);
    this.details = details;
  }
}
