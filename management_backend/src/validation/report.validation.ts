import { StudentStatus } from '@prisma/client';
import { z } from 'zod';

const optionalUuid = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().uuid('Select a valid academic unit.').optional(),
);

const optionalSession = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().trim().regex(/^\d{4}\/\d{4}$/, 'Session must use YYYY/YYYY format.').optional(),
);

export const reportQuerySchema = z.object({
  departmentId: optionalUuid,
  programmeId: optionalUuid,
  status: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.nativeEnum(StudentStatus).optional(),
  ),
  session: optionalSession,
}).superRefine((data, context) => {
  if (!data.session) return;
  const [start, end] = data.session.split('/').map(Number);
  if (end !== start + 1) context.addIssue({ code: 'custom', path: ['session'], message: 'Session years must be consecutive.' });
});
