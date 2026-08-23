import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const codeSchema = (maximum: number) =>
  z
    .string()
    .trim()
    .min(2)
    .max(maximum)
    .regex(/^[A-Za-z0-9-]+$/, 'Code may contain only letters, numbers, and hyphens.')
    .transform((value) => value.toUpperCase());

export const departmentBodySchema = z.object({
  name: z.string().trim().min(2).max(150),
  code: codeSchema(20),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
});

export const programmeBodySchema = z.object({
  departmentId: z.string().uuid('Select a valid department.'),
  name: z.string().trim().min(2).max(150),
  code: codeSchema(30),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
});

export const academicUnitIdSchema = z.string().uuid('Invalid record identifier.');
