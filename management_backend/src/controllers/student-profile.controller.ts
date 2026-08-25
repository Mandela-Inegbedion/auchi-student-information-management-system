import { Prisma } from '@prisma/client';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const updateContactSchema = z.object({
  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email('Enter a valid email address.').max(255).transform((v) => v.toLowerCase()).optional(),
  ),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),
  address: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
});

const safeStudentSelect = {
  id: true,
  matricNumber: true,
  firstName: true,
  middleName: true,
  lastName: true,
  gender: true,
  dateOfBirth: true,
  email: true,
  phone: true,
  address: true,
  admissionYear: true,
  level: true,
  status: true,
  createdAt: true,
  department: { select: { id: true, name: true, code: true } },
  programme: { select: { id: true, name: true, code: true } },
} as const;

export const updateStudentContactInfo: RequestHandler = async (request, response) => {
  if (!request.studentAuth) {
    response.status(401).json({ success: false, message: 'Authentication is required.' });
    return;
  }

  const validation = updateContactSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: 'Please correct the highlighted information.',
      fields: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const student = await prisma.student.update({
      where: { id: request.studentAuth.studentId },
      data: {
        email: validation.data.email ?? null,
        phone: validation.data.phone ?? null,
        address: validation.data.address ?? null,
      },
      select: safeStudentSelect,
    });

    response.status(200).json({ success: true, message: 'Contact information updated successfully.', data: { student } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      response.status(409).json({ success: false, message: 'This email address is already in use by another student.' });
      return;
    }
    response.status(500).json({ success: false, message: 'Unable to update your contact information.' });
  }
};

export const getStudentTranscript: RequestHandler = async (request, response) => {
  if (!request.studentAuth) {
    response.status(401).json({ success: false, message: 'Authentication is required.' });
    return;
  }

  try {
    const records = await prisma.academicRecord.findMany({
      where: { studentId: request.studentAuth.studentId },
      orderBy: [{ session: 'desc' }, { semester: 'asc' }, { courseCode: 'asc' }],
      select: {
        id: true, session: true, semester: true,
        courseCode: true, courseTitle: true, creditUnit: true,
        score: true, grade: true, gradePoint: true,
      },
    });

    response.status(200).json({ success: true, data: { records } });
  } catch {
    response.status(500).json({ success: false, message: 'Unable to load your academic records.' });
  }
};
