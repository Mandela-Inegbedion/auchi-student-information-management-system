import { z } from 'zod';

const optionalText = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().trim().max(100).optional(),
);

export const activityLogListQuerySchema = z.object({
  search: optionalText,
  userId: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().uuid('Select a valid user.').optional(),
  ),
  module: optionalText,
  action: optionalText,
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(15),
});
