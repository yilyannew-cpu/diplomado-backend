import { IUserRepository, IHashService, ITokenService } from '../../ports';
import { ConflictError } from '../../../domain/errors';
import { Role, UserStatus } from '../../../domain/enums';
import { toPublicUser } from '../../../domain/entities/User';

export interface RegisterClientInput {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export class RegisterClientUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService
  ) {}

  async execute(input: RegisterClientInput) {
    const email = input.email.toLowerCase().trim();

    if (await this.userRepository.emailExists(email)) {
      throw new ConflictError('El email ya está registrado', [
        { field: 'email', message: 'El email ya está registrado' },
      ]);
    }

    const passwordHash = await this.hashService.hash(input.password);

    const user = await this.userRepository.create({
      name: input.name.trim(),
      email,
      passwordHash,
      role: Role.CLIENTE,
      phone: input.phone,
      status: UserStatus.ACTIVO,
    });

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: toPublicUser(user),
    };
  }
}
