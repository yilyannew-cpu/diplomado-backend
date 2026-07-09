import { RestaurantStatus } from '../enums';

export interface Restaurant {
  id: string;
  name: string;
  tagline: string | null;
  city: string;
  address: string;
  rating: number;
  deliveryMinutes: number;
  accent: string;
  initials: string;
  status: RestaurantStatus;
  
  // Payment config
  nequiNumber?: string | null;
  nequiOwner?: string | null;
  brebKey?: string | null;
  brebOwner?: string | null;
  brebQrUrl?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export type PublicRestaurant = Pick<
  Restaurant,
  'id' | 'name' | 'tagline' | 'city' | 'address' | 'status'
>;
