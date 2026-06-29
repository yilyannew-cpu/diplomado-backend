import { IUserRepository, IHashService, ITokenService } from '../../ports';
import { InvalidCredentialsError, PendingApprovalError, AccountSuspendedError, RegistrationRejectedError } from '../../../domain/errors';
import { UserStatus } from '../../../domain/enums';
import { toPublicUser } from '../../../domain/entities/User';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  token: string;
  user: ReturnType<typeof toPublicUser>;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(input.email.toLowerCase().trim());

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const validPassword = await this.hashService.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw new InvalidCredentialsError();
    }

    switch (user.status) {
      case UserStatus.PENDIENTE:
        throw new PendingApprovalError();
      case UserStatus.SUSPENDIDO:
        throw new AccountSuspendedError();
      case UserStatus.RECHAZADO:
        throw new RegistrationRejectedError();
    }

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
