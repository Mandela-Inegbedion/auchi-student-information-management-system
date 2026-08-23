import { Semester } from '@prisma/client';
import { z } from 'zod';

const emptyToUndefined = (value: unknown) => typeof value === 'string' && value.trim() === '' ? undefined : value;

export const academicRecordBodySchema = z.object({
  studentId: z.string().uuid('Select a valid student.'),
  session: z.string().trim().regex(/^\d{4}\/\d{4}$/, 'Session must use YYYY/YYYY format.').refine((value) => {
    const [start, end] = value.split('/').map(Number);
    return end === start + 1;
  }, 'Academic session years must be consecutive.'),
  semester: z.nativeEnum(Semester),
  courseCode: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9 -]+$/).transform((value) => value.toUpperCase()),
  courseTitle: z.string().trim().min(2).max(200),
  creditUnit: z.coerce.number().int().min(1, 'Credit unit must be at least 1.').max(6, 'Credit unit cannot exceed 6.'),
  score: z.coerce.number().min(0, 'Score cannot be below 0.').max(100, 'Score cannot exceed 100.'),
  grade: z.string().trim().min(1).max(5).transform((value) => value.toUpperCase()),
  gradePoint: z.coerce.number().min(0).max(5),
});

export const academicRecordListQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  studentId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  session: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  semester: z.preprocess(emptyToUndefined, z.nativeEnum(Semester).optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const academicRecordIdSchema = z.string().uuid('Invalid academic record identifier.');
