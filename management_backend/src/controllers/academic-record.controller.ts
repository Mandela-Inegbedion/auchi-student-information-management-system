import { Prisma } from '@prisma/client';
import type { RequestHandler, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import { academicRecordBodySchema, academicRecordIdSchema, academicRecordListQuerySchema } from '../validation/academic-record.validation.js';

const includeStudent = {
  student: {
    select: {
      id: true,
      matricNumber: true,
      firstName: true,
      middleName: true,
      lastName: true,
      department: { select: { id: true, name: true, code: true } },
      programme: { select: { id: true, name: true, code: true } },
    },
  },
} as const;

function handleError(response: Response, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    response.status(409).json({ success: false, message: 'This course already exists for the student in the selected session and semester.' });
    return;
  }
  response.status(500).json({ success: false, message: 'Unable to complete the academic record operation.' });
}

export const listAcademicRecords: RequestHandler = async (request, response) => {
  const validation = academicRecordListQuerySchema.safeParse(request.query);
  if (!validation.success) {
    response.status(400).json({ success: false, message: validation.error.issues[0]?.message ?? 'Invalid academic record query.' });
    return;
  }
  const { search, studentId, session, semester, page, pageSize } = validation.data;
  const where: Prisma.AcademicRecordWhereInput = {
    studentId,
    session: session ? { contains: session, mode: 'insensitive' } : undefined,
    semester,
    OR: search ? [
      { courseCode: { contains: search, mode: 'insensitive' } },
      { courseTitle: { contains: search, mode: 'insensitive' } },
      { student: { matricNumber: { contains: search, mode: 'insensitive' } } },
      { student: { firstName: { contains: search, mode: 'insensitive' } } },
      { student: { lastName: { contains: search, mode: 'insensitive' } } },
    ] : undefined,
  };
  try {
    const [records, total] = await prisma.$transaction([
      prisma.academicRecord.findMany({ where, orderBy: [{ createdAt: 'desc' }, { courseCode: 'asc' }], skip: (page - 1) * pageSize, take: pageSize, include: includeStudent }),
      prisma.academicRecord.count({ where }),
    ]);
    response.status(200).json({ success: true, data: { records, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } } });
  } catch (error) {
    handleError(response, error);
  }
};

export const getAcademicRecordOptions: RequestHandler = async (_request, response) => {
  try {
    const students = await prisma.student.findMany({
      orderBy: [{ matricNumber: 'asc' }],
      select: { id: true, matricNumber: true, firstName: true, middleName: true, lastName: true, status: true },
    });
    response.status(200).json({ success: true, data: { students } });
  } catch (error) {
    handleError(response, error);
  }
};

export const getAcademicRecord: RequestHandler = async (request, response) => {
  const validation = academicRecordIdSchema.safeParse(request.params.id);
  if (!validation.success) {
    response.status(400).json({ success: false, message: 'Invalid academic record identifier.' });
    return;
  }
  try {
    const record = await prisma.academicRecord.findUnique({ where: { id: validation.data }, include: includeStudent });
    if (!record) {
      response.status(404).json({ success: false, message: 'Academic record not found.' });
      return;
    }
    response.status(200).json({ success: true, data: { record } });
  } catch (error) {
    handleError(response, error);
  }
};

export const createAcademicRecord: RequestHandler = async (request, response) => {
  const validation = academicRecordBodySchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ success: false, message: 'Please provide valid academic record information.', fields: validation.error.flatten().fieldErrors });
    return;
  }
  try {
    const student = await prisma.student.findUnique({ where: { id: validation.data.studentId }, select: { id: true } });
    if (!student) {
      response.status(400).json({ success: false, message: 'The selected student does not exist.' });
      return;
    }
    const record = await prisma.academicRecord.create({ data: validation.data, include: includeStudent });
    await logActivity({ userId: request.auth?.userId, action: 'ACADEMIC_RECORD_CREATED', module: 'ACADEMIC_RECORDS', recordId: record.id, description: `Added ${record.courseCode} for ${record.student.matricNumber}.` });
    response.status(201).json({ success: true, message: 'Academic record created successfully.', data: { record } });
  } catch (error) {
    handleError(response, error);
  }
};

export const updateAcademicRecord: RequestHandler = async (request, response) => {
  const idValidation = academicRecordIdSchema.safeParse(request.params.id);
  const bodyValidation = academicRecordBodySchema.safeParse(request.body);
  if (!idValidation.success || !bodyValidation.success) {
    response.status(400).json({ success: false, message: 'Please provide valid academic record information.', fields: bodyValidation.success ? undefined : bodyValidation.error.flatten().fieldErrors });
    return;
  }
  try {
    const [existing, student] = await Promise.all([
      prisma.academicRecord.findUnique({ where: { id: idValidation.data }, select: { id: true } }),
      prisma.student.findUnique({ where: { id: bodyValidation.data.studentId }, select: { id: true } }),
    ]);
    if (!existing) {
      response.status(404).json({ success: false, message: 'Academic record not found.' });
      return;
    }
    if (!student) {
      response.status(400).json({ success: false, message: 'The selected student does not exist.' });
      return;
    }
    const record = await prisma.academicRecord.update({ where: { id: idValidation.data }, data: bodyValidation.data, include: includeStudent });
    await logActivity({ userId: request.auth?.userId, action: 'ACADEMIC_RECORD_UPDATED', module: 'ACADEMIC_RECORDS', recordId: record.id, description: `Updated ${record.courseCode} for ${record.student.matricNumber}.` });
    response.status(200).json({ success: true, message: 'Academic record updated successfully.', data: { record } });
  } catch (error) {
    handleError(response, error);
  }
};

export const deleteAcademicRecord: RequestHandler = async (request, response) => {
  const validation = academicRecordIdSchema.safeParse(request.params.id);
  if (!validation.success) {
    response.status(400).json({ success: false, message: 'Invalid academic record identifier.' });
    return;
  }
  try {
    const existing = await prisma.academicRecord.findUnique({ where: { id: validation.data }, select: { id: true, courseCode: true } });
    if (!existing) {
      response.status(404).json({ success: false, message: 'Academic record not found.' });
      return;
    }
    await prisma.academicRecord.delete({ where: { id: validation.data } });
    await logActivity({ userId: request.auth?.userId, action: 'ACADEMIC_RECORD_DELETED', module: 'ACADEMIC_RECORDS', recordId: existing.id, description: `Deleted academic record ${existing.courseCode}.` });
    response.status(200).json({ success: true, message: 'Academic record deleted successfully.' });
  } catch (error) {
    handleError(response, error);
  }
};
