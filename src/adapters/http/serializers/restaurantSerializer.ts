import { Restaurant } from '../../../domain/entities/Restaurant';

export function serializeRestaurantProfile(restaurant: Restaurant) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    tagline: restaurant.tagline,
    city: restaurant.city,
    address: restaurant.address,
    delivery_minutes: restaurant.deliveryMinutes,
    monthly_goal: restaurant.monthlyGoal,
    daily_goal: restaurant.dailyGoal,
    accent: restaurant.accent,
    initials: restaurant.initials,
    logo: restaurant.logo ?? null,
    cover_image: restaurant.coverImage ?? null,
    rating: restaurant.rating,
    status: restaurant.status,
  };
}
