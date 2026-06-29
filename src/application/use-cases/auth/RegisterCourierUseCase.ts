import { IUserRepository, IHashService } from '../../ports';
import { ConflictError } from '../../../domain/errors';
import { Role, UserStatus } from '../../../domain/enums';

export interface RegisterCourierInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  documentId: string;
  vehicleType: string;
  vehiclePlate: string;
  vehicleDescription?: string;
}

export class RegisterCourierUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService
  ) {}

  private buildVehicleString(input: RegisterCourierInput): string {
    const description = input.vehicleDescription?.trim() || input.vehicleType;
    return `${description} — ${input.vehiclePlate.trim()}`;
  }

  async execute(input: RegisterCourierInput) {
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
      role: Role.DOMICILIARIO,
      phone: input.phone,
      documentId: input.documentId.trim(),
      vehicle: this.buildVehicleString(input),
      status: UserStatus.PENDIENTE,
    });

    return {
      message: 'Solicitud enviada. Recibirás acceso cuando un administrador apruebe tu cuenta.',
      data: {
        user_id: user.id,
        status: UserStatus.PENDIENTE,
      },
    };
  }
}
