import { BusinessError } from './BusinessError';

export class ForbiddenError extends BusinessError {
  constructor(
    message = 'No tienes permiso para realizar esta acción',
    options?: { cause?: unknown }
  ) {
    super(message, 403, options);
  }
}
