import { BusinessError } from './BusinessError';

export class NotFoundError extends BusinessError {
  constructor(message = 'Recurso no encontrado', options?: { cause?: unknown }) {
    super(message, 404, options);
  }
}
