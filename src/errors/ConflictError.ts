import { BusinessError } from './BusinessError';

export class ConflictError extends BusinessError {
  constructor(
    message = 'Conflicto con el recurso existente',
    options?: { cause?: unknown }
  ) {
    super(message, 409, options);
  }
}
