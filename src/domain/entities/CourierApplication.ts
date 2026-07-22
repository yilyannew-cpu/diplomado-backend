import { ApplicationStatus } from '../enums';

export interface CourierApplication {
  id: string;
  courierId: string;
  restaurantId: string;
  status: ApplicationStatus;
  courierName?: string;
  courierEmail?: string;
  courierPhone?: string | null;
  courierAvatar?: string | null;
  courierVehicle?: string | null;
  courierDocumentId?: string | null;
  courierIsAvailable?: boolean;
  restaurantName?: string;
  createdAt: Date;
  updatedAt: Date;
}
