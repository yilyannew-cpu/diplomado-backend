import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from '../../application/ports';
import { UnauthorizedError } from '../../domain/errors';
import { Role } from '../../domain/enums';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
    }
    this.secret = secret;
    this.expiresIn = process.env.JWT_EXPIRES_IN ?? '8h';
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
