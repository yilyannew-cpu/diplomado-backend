export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(code = 'UNAUTHORIZED', message = 'No autenticado') {
    super(code, message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(code = 'FORBIDDEN', message = 'No tienes permiso para realizar esta acción') {
    super(code, message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Recurso no encontrado') {
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Conflicto con el recurso existente', details?: Array<{ field: string; message: string }>) {
    super('CONFLICT', message, 409, details);
    this.name = 'ConflictError';
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Email o contraseña incorrectos', 401);
    this.name = 'InvalidCredentialsError';
  }
}

export class PendingApprovalError extends DomainError {
  constructor() {
    super('PENDING_APPROVAL', 'Tu cuenta está pendiente de aprobación.', 403);
    this.name = 'PendingApprovalError';
  }
}

export class AccountSuspendedError extends DomainError {
  constructor() {
    super('ACCOUNT_SUSPENDED', 'Tu cuenta ha sido suspendida. Contacta al administrador.', 403);
    this.name = 'AccountSuspendedError';
  }
}

export class RegistrationRejectedError extends DomainError {
  constructor() {
    super('REGISTRATION_REJECTED', 'Tu solicitud de registro fue rechazada.', 403);
    this.name = 'RegistrationRejectedError';
  }
}
