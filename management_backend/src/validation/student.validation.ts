import { Gender, StudentStatus } from '@prisma/client';
import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalText = (maximum: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(maximum).optional());

const optionalUuid = z.preprocess(emptyToUndefined, z.string().uuid().optional());

export const studentBodySchema = z.object({
  matricNumber: z.string().trim().min(3).max(50).transform((value) => value.toUpperCase()),
  firstName: z.string().trim().min(2).max(100),
  middleName: optionalText(100),
  lastName: z.string().trim().min(2).max(100),
  gender: z.nativeEnum(Gender),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must use YYYY-MM-DD.')
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    }, 'Enter a valid date of birth.')
    .refine((value) => new Date(`${value}T00:00:00.000Z`) <= new Date(), 'Date of birth cannot be in the future.'),
  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email().max(255).transform((value) => value.toLowerCase()).optional(),
  ),
  phone: optionalText(30),
  address: optionalText(1000),
  departmentId: z.string().uuid('Select a valid department.'),
  programmeId: z.string().uuid('Select a valid programme.'),
  admissionYear: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  status: z.nativeEnum(StudentStatus),
});

export const studentListQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  departmentId: optionalUuid,
  programmeId: optionalUuid,
  status: z.preprocess(emptyToUndefined, z.nativeEnum(StudentStatus).optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const studentIdSchema = z.string().uuid('Invalid student identifier.');

export type StudentBody = z.infer<typeof studentBodySchema>;
