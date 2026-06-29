import bcrypt from 'bcrypt';
import { IHashService } from '../../application/ports';

export class BcryptHashService implements IHashService {
  private readonly rounds = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
