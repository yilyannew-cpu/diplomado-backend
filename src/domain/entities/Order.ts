import { OrderStatus } from '../enums';

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  orderId: string;
  productId: string;
  customizations?: Record<string, any>;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  address: string;
  phone: string;
  notes?: string | null;
  zone?: string | null;
  status: OrderStatus;
  statusEnteredAt: Date;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentObservation?: string | null;
  total: number;
  deliveryFee: number;
  restaurantId: string;
  deliveryPersonId: string | null;
  /** Nombre del domiciliario asignado (si se cargó la relación). */
  courierName?: string | null;
  /** Teléfono del domiciliario asignado. */
  courierPhone?: string | null;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}
