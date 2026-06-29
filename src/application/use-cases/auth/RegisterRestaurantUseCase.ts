import { IRestaurantRepository, IHashService } from '../../ports';
import { ConflictError } from '../../../domain/errors';
import { Role, UserStatus, RestaurantStatus } from '../../../domain/enums';

export interface RegisterRestaurantInput {
  ownerName: string;
  email: string;
  password: string;
  phone: string;
  restaurantName: string;
  tagline?: string;
  city: string;
  address: string;
  deliveryMinutes?: number;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export class RegisterRestaurantUseCase {
  constructor(
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly hashService: IHashService,
    private readonly emailExists: (email: string) => Promise<boolean>
  ) {}

  async execute(input: RegisterRestaurantInput) {
    const email = input.email.toLowerCase().trim();

    if (await this.emailExists(email)) {
      throw new ConflictError('El email ya está registrado', [
        { field: 'email', message: 'El email ya está registrado' },
      ]);
    }

    const passwordHash = await this.hashService.hash(input.password);

    const { user, restaurant } = await this.restaurantRepository.createWithAdminUser(
      {
        name: input.restaurantName.trim(),
        tagline: input.tagline?.trim() || null,
        city: input.city.trim(),
        address: input.address.trim(),
        deliveryMinutes: input.deliveryMinutes ?? 30,
        initials: getInitials(input.restaurantName),
        status: RestaurantStatus.PENDIENTE,
      },
      {
        name: input.ownerName.trim(),
        email,
        passwordHash,
        role: Role.ADMIN,
        phone: input.phone,
        status: UserStatus.PENDIENTE,
      }
    );

    return {
      message: 'Solicitud de registro enviada. Un administrador revisará tu cuenta.',
      data: {
        user_id: user.id,
        restaurant_id: restaurant.id,
        status: UserStatus.PENDIENTE,
      },
    };
  }
}
