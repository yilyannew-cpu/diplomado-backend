export enum Role {
  CLIENTE = 'cliente',
  ADMIN = 'admin',
  DOMICILIARIO = 'domiciliario',
  SUPERADMIN = 'superadmin',
}

export enum UserStatus {
  ACTIVO = 'Activo',
  PENDIENTE = 'Pendiente',
  SUSPENDIDO = 'Suspendido',
  RECHAZADO = 'Rechazado',
}

export enum RestaurantStatus {
  ACTIVO = 'Activo',
  PENDIENTE = 'Pendiente',
  SUSPENDIDO = 'Suspendido',
  RECHAZADO = 'Rechazado',
}

export enum VehicleType {
  MOTO = 'Moto',
  BICI = 'Bici',
  AUTOMOVIL = 'Automóvil',
  OTRO = 'Otro',
}

export enum OrderStatus {
  RECIBIDO = 'Recibido',
  EN_PREPARACION = 'EnPreparacion',
  LISTO = 'Listo',
  EN_CAMINO = 'EnCamino',
  ENTREGADO = 'Entregado',
  CANCELADO = 'Cancelado',
}
export enum CourierAvailability {
  DISPONIBLE = 'disponible',
  EN_RUTA = 'en_ruta',
  OFFLINE = 'offline',
}

export enum ServiceHealthStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  DOWN = 'down',
}
