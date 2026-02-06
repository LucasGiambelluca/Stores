import { z } from 'zod';

export const createStoreSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  ownerEmail: z.string().email('Email inválido'),
  ownerName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
