import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from '../../application/ports';
import { UnauthorizedError } from '../../domain/errors';
import { Role } from '../../domain/enums';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET es requerido');
    }
    this.secret = secret;
    this.expiresIn = process.env.JWT_EXPIRES_IN ?? '15m';
  }

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload;
      return {
        sub: decoded.sub as string,
        email: decoded.email as string,
        role: decoded.role as Role,
      };
    } catch {
      throw new UnauthorizedError('INVALID_TOKEN', 'Token inválido o expirado');
    }
  }
}
