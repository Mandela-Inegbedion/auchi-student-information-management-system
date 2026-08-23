import { Prisma } from '@prisma/client';
import type { RequestHandler, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import {
  studentBodySchema,
  studentIdSchema,
  studentListQuerySchema,
  type StudentBody,
} from '../validation/student.validation.js';

function validationError(response: Response, message: string, fields?: unknown) {
  response.status(400).json({ success: false, message, fields });
}

function studentData(data: StudentBody) {
  return {
    ...data,
    middleName: data.middleName ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    address: data.address ?? null,
    dateOfBirth: new Date(`${data.dateOfBirth}T00:00:00.000Z`),
  };
}

async function validateAcademicPlacement(departmentId: string, programmeId: string) {
  const [department, programme] = await Promise.all([
    prisma.department.findUnique({ where: { id: departmentId }, select: { id: true } }),
    prisma.programme.findUnique({ where: { id: programmeId }, select: { id: true, departmentId: true } }),
  ]);

  if (!department) return 'The selected department does not exist.';
  if (!programme) return 'The selected programme does not exist.';
  if (programme.departmentId !== departmentId) return 'The selected programme does not belong to this department.';
  return null;
}

function databaseError(response: Response, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(' ') : String(error.meta?.target ?? '');
    const message = target.includes('email')
      ? 'A student with this email address already exists.'
      : 'A student with this matriculation number already exists.';
    response.status(409).json({ success: false, message });
    return;
  }

  response.status(500).json({ success: false, message: 'Unable to complete the student operation.' });
}

export const listStudents: RequestHandler = async (request, response) => {
  const validation = studentListQuerySchema.safeParse(request.query);
  if (!validation.success) {
    validationError(response, validation.error.issues[0]?.message ?? 'Invalid student query.');
    return;
  }

  const { search, departmentId, programmeId, status, page, pageSize } = validation.data;
  const searchTerms = search?.split(/\s+/).filter(Boolean) ?? [];
  const where: Prisma.StudentWhereInput = {
    departmentId,
    programmeId,
    status,
    AND: searchTerms.map((term) => ({
      OR: [
        { matricNumber: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { middleName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
      ],
    })),
  };

  try {
    const [students, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { lastName: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          department: { select: { id: true, name: true, code: true } },
          programme: { select: { id: true, name: true, code: true } },
          _count: { select: { academicRecords: true } },
        },
      }),
      prisma.student.count({ where }),
    ]);

    response.status(200).json({
      success: true,
      data: {
        students,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    databaseError(response, error);
  }
};

export const getStudentFormOptions: RequestHandler = async (_request, response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        programmes: { orderBy: { name: 'asc' }, select: { id: true, name: true, code: true } },
      },
    });
    response.status(200).json({ success: true, data: { departments } });
  } catch (error) {
    databaseError(response, error);
  }
};

export const getStudent: RequestHandler = async (request, response) => {
  const validation = studentIdSchema.safeParse(request.params.id);
  if (!validation.success) {
    validationError(response, validation.error.issues[0]?.message ?? 'Invalid student identifier.');
    return;
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: validation.data },
      include: {
        department: { select: { id: true, name: true, code: true } },
        programme: { select: { id: true, name: true, code: true } },
        academicRecords: { orderBy: [{ session: 'desc' }, { courseCode: 'asc' }] },
      },
    });

    if (!student) {
      response.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }

    response.status(200).json({ success: true, data: { student } });
  } catch (error) {
    databaseError(response, error);
  }
};

export const createStudent: RequestHandler = async (request, response) => {
  const validation = studentBodySchema.safeParse(request.body);
  if (!validation.success) {
    validationError(response, 'Please correct the highlighted student information.', validation.error.flatten().fieldErrors);
    return;
  }

  try {
    const placementError = await validateAcademicPlacement(validation.data.departmentId, validation.data.programmeId);
    if (placementError) {
      validationError(response, placementError);
      return;
    }

    const student = await prisma.student.create({
      data: studentData(validation.data),
      include: {
        department: { select: { id: true, name: true, code: true } },
        programme: { select: { id: true, name: true, code: true } },
      },
    });
    await logActivity({ userId: request.auth?.userId, action: 'STUDENT_CREATED', module: 'STUDENTS', recordId: student.id, description: `Registered student ${student.matricNumber}.` });
    response.status(201).json({ success: true, message: 'Student registered successfully.', data: { student } });
  } catch (error) {
    databaseError(response, error);
  }
};

export const updateStudent: RequestHandler = async (request, response) => {
  const idValidation = studentIdSchema.safeParse(request.params.id);
  const bodyValidation = studentBodySchema.safeParse(request.body);
  if (!idValidation.success || !bodyValidation.success) {
    validationError(
      response,
      'Please correct the student information.',
      bodyValidation.success ? undefined : bodyValidation.error.flatten().fieldErrors,
    );
    return;
  }

  try {
    const existing = await prisma.student.findUnique({ where: { id: idValidation.data }, select: { id: true } });
    if (!existing) {
      response.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }

    const placementError = await validateAcademicPlacement(bodyValidation.data.departmentId, bodyValidation.data.programmeId);
    if (placementError) {
      validationError(response, placementError);
      return;
    }

    const student = await prisma.student.update({
      where: { id: idValidation.data },
      data: studentData(bodyValidation.data),
      include: {
        department: { select: { id: true, name: true, code: true } },
        programme: { select: { id: true, name: true, code: true } },
      },
    });
    await logActivity({ userId: request.auth?.userId, action: 'STUDENT_UPDATED', module: 'STUDENTS', recordId: student.id, description: `Updated student ${student.matricNumber}.` });
    response.status(200).json({ success: true, message: 'Student updated successfully.', data: { student } });
  } catch (error) {
    databaseError(response, error);
  }
};

export const deleteStudent: RequestHandler = async (request, response) => {
  const validation = studentIdSchema.safeParse(request.params.id);
  if (!validation.success) {
    validationError(response, validation.error.issues[0]?.message ?? 'Invalid student identifier.');
    return;
  }

  try {
    const existing = await prisma.student.findUnique({ where: { id: validation.data }, select: { id: true, matricNumber: true } });
    if (!existing) {
      response.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }
    await prisma.student.delete({ where: { id: validation.data } });
    await logActivity({ userId: request.auth?.userId, action: 'STUDENT_DELETED', module: 'STUDENTS', recordId: existing.id, description: `Deleted student ${existing.matricNumber}.` });
    response.status(200).json({ success: true, message: 'Student deleted successfully.' });
  } catch (error) {
    databaseError(response, error);
  }
};
