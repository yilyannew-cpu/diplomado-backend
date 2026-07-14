import { CourierAvailability, OrderStatus, ServiceHealthStatus } from '../../domain/enums';

export interface DashboardMetrics {
  sales_today_cop: number;
  sales_yesterday_cop: number;
  sales_delta_percent: number;
  orders_today: number;
  active_couriers: number;
  active_restaurants: number;
  registered_clients: number;
}

export interface SystemServiceStatus {
  name: string;
  status: ServiceHealthStatus;
  latency_ms: number;
}

export interface SystemStatus {
  overall: ServiceHealthStatus;
  services: SystemServiceStatus[];
}

export interface OrderSummary {
  id: string;
  order_number: string;
  status: OrderStatus;
  restaurant_name: string;
  customer_name: string;
  courier_name: string | null;
  courier_avatar: string | null;
  total_cop: number;
  created_at: string;
  estimated_delivery_at: string | null;
}

export interface ActiveCourier {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  vehicle: string | null;
  avatar: string | null;
  availability: CourierAvailability;
  active_orders: number;
}

export interface OperationsMetrics {
  orders_in_progress: number;
  orders_en_camino: number;
  orders_pendientes_asignacion: number;
  avg_delivery_minutes: number;
  couriers_available: number;
  couriers_en_ruta: number;
}

export interface IOperationsRepository {
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getSystemStatus(): Promise<SystemStatus>;
  listOrders(status?: OrderStatus): Promise<OrderSummary[]>;
  listActiveCouriers(): Promise<ActiveCourier[]>;
  getOperationsMetrics(): Promise<OperationsMetrics>;
}
