import { z } from 'zod';
import { Role, UserStatus, OrderStatus } from '../../../domain/enums';

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[a-zA-Z]/, 'La contraseña debe incluir al menos una letra')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número');

const phoneSchema = z
  .string()
  .min(10, 'El teléfono debe tener al menos 10 dígitos')
  .refine((v) => /\+?57/.test(v) || /\d{10,}/.test(v.replace(/\D/g, '')), {
    message: 'Formato de teléfono inválido. Use +57...',
  });

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const registerClientSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email('Email inválido'),
    password: passwordSchema,
    password_confirmation: z.string(),
    phone: phoneSchema,
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  });

export const registerRestaurantSchema = z
  .object({
    owner_name: z.string().min(2).max(100),
    email: z.string().email('Email inválido'),
    password: passwordSchema,
    password_confirmation: z.string(),
    phone: phoneSchema,
    restaurant_name: z.string().min(2).max(120),
    tagline: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    address: z.string().min(1).max(255),
    delivery_minutes: z.number().int().min(10).max(120).optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  });

const vehicleTypeEnum = z.enum(['Moto', 'Bici', 'Automóvil', 'Otro']);

export const registerCourierSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email('Email inválido'),
    password: passwordSchema,
    password_confirmation: z.string(),
    phone: phoneSchema,
    document_id: z.string().min(6).max(20),
    vehicle_type: vehicleTypeEnum,
    vehicle_plate: z.string().min(1).max(20),
    vehicle_description: z.string().max(100).optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  });

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email('Email inválido'),
  password: passwordSchema,
  role: z.nativeEnum(Role),
  phone: z.string().optional(),
  vehicle: z.string().optional(),
  restaurant_id: z.string().min(1).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().nullable().optional(),
  vehicle: z.string().nullable().optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  restaurant_id: z.string().min(1).nullable().optional(),
});

export const rejectUserSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const updateProfileSchema = z
  .object({
    email: z.string().email('Email inválido').optional(),
    phone: phoneSchema.optional(),
  })
  .refine((data) => data.email !== undefined || data.phone !== undefined, {
    message: 'Debe enviar al menos email o teléfono',
  });

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'La contraseña actual es requerida'),
    password: passwordSchema,
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  });

export const listUsersQuerySchema = z.object({
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  q: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const listOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
});
