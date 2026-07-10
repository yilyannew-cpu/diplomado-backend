import { Restaurant } from '../../../domain/entities/Restaurant';

export function serializeRestaurantProfile(restaurant: Restaurant & { monthlyGoal?: number }) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    tagline: restaurant.tagline,
    city: restaurant.city,
    address: restaurant.address,
    delivery_minutes: restaurant.deliveryMinutes,
    monthly_goal: restaurant.monthlyGoal ?? 18000000,
    accent: restaurant.accent,
    initials: restaurant.initials,
    logo: restaurant.logo ?? null,
    rating: restaurant.rating,
    status: restaurant.status,
  };
}
