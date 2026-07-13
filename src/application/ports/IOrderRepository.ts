import { Order } from '../../domain/entities/Order';
import { OrderStatus } from '../../domain/enums';

export interface CreateOrderItemData {
  productId: string;
  quantity: number;
  customizations?: Record<string, unknown>;
}

export interface CreateOrderData {
  customerName: string;
  address: string;
  phone: string;
  notes?: string;
  zone?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  restaurantId: string;
  /** Tarifa de domicilio calculada por km de ruta (COP). */
  deliveryFee?: number;
  items: CreateOrderItemData[];
}

export interface ListRestaurantOrdersFilters {
  restaurantId: string;
  statuses?: OrderStatus[];
}

export interface OrderWithProductNames extends Order {
  items: Array<Order['items'][number] & { productName: string }>;
}

export interface IOrderRepository {
  create(data: CreateOrderData & { code: string; total: number; deliveryFee: number; itemsWithPrice: { productId: string; quantity: number; unitPrice: number; customizations?: Record<string, unknown> }[] }): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByCode(code: string): Promise<Order | null>;
  /** Pedido activo más reciente cuyo teléfono coincide (dígitos). */
  findLatestActiveByPhone(phone: string): Promise<Order | null>;
  listByRestaurant(filters: ListRestaurantOrdersFilters): Promise<OrderWithProductNames[]>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  rejectPayment(id: string, observation: string): Promise<Order>;
  assignCourier(id: string, courierId: string): Promise<Order>;
  dispatchOrders(orderIds: string[], restaurantId: string): Promise<Order[]>;
  batchAssignCourier(orderIds: string[], courierId: string): Promise<Order[]>;
  /** Pedidos Listo sin domiciliario (cola para aceptar). */
  listAvailableForDelivery(restaurantId?: string): Promise<Order[]>;
  listByCourier(courierId: string): Promise<Order[]>;
  /** Cuenta pedidos EnCamino del courier (capacidad). */
  countInRouteByCourier(courierId: string): Promise<number>;
  /** Listo + asignado a courier → EnCamino + Dispatch. */
  startDeliveryByCourier(orderId: string, courierId: string): Promise<Order>;
  /** EnCamino + asignado a courier → Entregado. */
  completeDeliveryByCourier(orderId: string, courierId: string): Promise<Order>;
  countAll(): Promise<number>;
}
