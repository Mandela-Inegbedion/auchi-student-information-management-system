import { UserRole, UserStatus } from '@prisma/client';
import { z } from 'zod';

const fullNameSchema = z.string().trim().min(3, 'Full name must contain at least 3 characters.').max(150);
const emailSchema = z.string().trim().email('Enter a valid email address.').max(255).transform((value) => value.toLowerCase());
const passwordSchema = z
  .string()
  .min(8, 'Password must contain at least 8 characters.')
  .max(128)
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[0-9]/, 'Password must contain a number.');

export const userIdSchema = z.string().uuid('Invalid user identifier.');

export const createUserBodySchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.nativeEnum(UserRole),
});

export const updateUserBodySchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  role: z.nativeEnum(UserRole),
  password: z.union([passwordSchema, z.literal('')]).optional(),
});

export const updateUserStatusBodySchema = z.object({
  status: z.nativeEnum(UserStatus),
});
