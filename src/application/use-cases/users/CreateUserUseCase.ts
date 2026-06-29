import { IUserRepository, IHashService } from '../../ports';
import { ConflictError, ForbiddenError, DomainError } from '../../../domain/errors';
import { Role, UserStatus } from '../../../domain/enums';
import { toPublicUser } from '../../../domain/entities/User';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  vehicle?: string;
  restaurantId?: string;
  status?: UserStatus;
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService
  ) {}

  async execute(input: CreateUserInput, requesterRole: Role) {
    if (input.role === Role.SUPERADMIN && requesterRole !== Role.SUPERADMIN) {
      throw new ForbiddenError('FORBIDDEN', 'Solo un superadmin puede crear otro superadmin');
    }

    if (input.role === Role.ADMIN && !input.restaurantId) {
      throw new DomainError('VALIDATION_ERROR', 'Datos inválidos', 400, [
        { field: 'restaurant_id', message: 'restaurant_id es requerido para rol admin' },
      ]);
    }

    if (input.role === Role.DOMICILIARIO && !input.vehicle) {
      throw new DomainError('VALIDATION_ERROR', 'Datos inválidos', 400, [
        { field: 'vehicle', message: 'vehicle es requerido para rol domiciliario' },
      ]);
    }

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
      role: input.role,
      phone: input.phone ?? null,
      vehicle: input.vehicle ?? null,
      restaurantId: input.restaurantId ?? null,
      status: input.status ?? UserStatus.ACTIVO,
    });

    return toPublicUser(user);
  }
}
