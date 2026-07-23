import { IUserRepository, IHashService } from '../../ports';
import { ConflictError, DomainError } from '../../../domain/errors';
import { Role, UserStatus } from '../../../domain/enums';
import { PrismaCatalogRepository } from '../../../infrastructure/repositories/PrismaCatalogRepository';

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
    private readonly hashService: IHashService,
    private readonly catalogRepository: PrismaCatalogRepository,
  ) {}

  private buildVehicleString(input: RegisterCourierInput): string {
    const description = input.vehicleDescription?.trim() || input.vehicleType;
    return `${description} — ${input.vehiclePlate.trim()}`;
  }

  async execute(input: RegisterCourierInput) {
    const email = input.email.toLowerCase().trim();
    const vehicleType = input.vehicleType.trim();

    if (!(await this.catalogRepository.isValidVehicleTypeCode(vehicleType))) {
      throw new DomainError('VALIDATION_ERROR', 'Selecciona un tipo de vehículo válido', 400, [
        { field: 'vehicle_type', message: 'Selecciona un tipo de vehículo válido' },
      ]);
    }

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
      vehicle: this.buildVehicleString({ ...input, vehicleType }),
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
