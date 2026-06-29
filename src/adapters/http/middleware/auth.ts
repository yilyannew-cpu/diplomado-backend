import { Request, Response, NextFunction } from 'express';
import { Role } from '../../../domain/enums';
import { UnauthorizedError, ForbiddenError } from '../../../domain/errors';
import { ITokenService } from '../../../application/ports';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function createAuthenticateMiddleware(tokenService: ITokenService) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next(new UnauthorizedError());
    }

    const token = header.slice(7);
    try {
      const payload = tokenService.verify(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }
    next();
  };
}
