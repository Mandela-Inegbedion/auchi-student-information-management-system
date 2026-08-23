import { Prisma } from '@prisma/client';
import type { RequestHandler, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import { academicUnitIdSchema, programmeBodySchema } from '../validation/academic-unit.validation.js';

function handleError(response: Response, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({ success: false, message: 'A programme with this name or code already exists in the selected department.' });
      return;
    }
    if (error.code === 'P2003') {
      response.status(409).json({ success: false, message: 'This programme is still referenced by student records.' });
      return;
    }
  }
  response.status(500).json({ success: false, message: 'Unable to complete the programme operation.' });
}

export const listProgrammes: RequestHandler = async (_request, response) => {
  try {
    const programmes = await prisma.programme.findMany({
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { students: true } },
      },
    });
    response.status(200).json({ success: true, data: { programmes } });
  } catch (error) {
    handleError(response, error);
  }
};

export const getProgramme: RequestHandler = async (request, response) => {
  const validation = academicUnitIdSchema.safeParse(request.params.id);
  if (!validation.success) {
    response.status(400).json({ success: false, message: 'Invalid programme identifier.' });
    return;
  }
  try {
    const programme = await prisma.programme.findUnique({
      where: { id: validation.data },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { students: true } },
      },
    });
    if (!programme) {
      response.status(404).json({ success: false, message: 'Programme not found.' });
      return;
    }
    response.status(200).json({ success: true, data: { programme } });
  } catch (error) {
    handleError(response, error);
  }
};

export const createProgramme: RequestHandler = async (request, response) => {
  const validation = programmeBodySchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ success: false, message: 'Please provide valid programme information.', fields: validation.error.flatten().fieldErrors });
    return;
  }
  try {
    const department = await prisma.department.findUnique({ where: { id: validation.data.departmentId }, select: { id: true } });
    if (!department) {
      response.status(400).json({ success: false, message: 'The selected department does not exist.' });
      return;
    }
    const programme = await prisma.programme.create({
      data: { ...validation.data, description: validation.data.description ?? null },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { students: true } },
      },
    });
    await logActivity({ userId: request.auth?.userId, action: 'PROGRAMME_CREATED', module: 'PROGRAMMES', recordId: programme.id, description: `Created programme ${programme.name} (${programme.code}).` });
    response.status(201).json({ success: true, message: 'Programme created successfully.', data: { programme } });
  } catch (error) {
    handleError(response, error);
  }
};

export const updateProgramme: RequestHandler = async (request, response) => {
  const idValidation = academicUnitIdSchema.safeParse(request.params.id);
  const bodyValidation = programmeBodySchema.safeParse(request.body);
  if (!idValidation.success || !bodyValidation.success) {
    response.status(400).json({ success: false, message: 'Please provide valid programme information.', fields: bodyValidation.success ? undefined : bodyValidation.error.flatten().fieldErrors });
    return;
  }
  try {
    const [exists, department] = await Promise.all([
      prisma.programme.findUnique({ where: { id: idValidation.data }, select: { id: true } }),
      prisma.department.findUnique({ where: { id: bodyValidation.data.departmentId }, select: { id: true } }),
    ]);
    if (!exists) {
      response.status(404).json({ success: false, message: 'Programme not found.' });
      return;
    }
    if (!department) {
      response.status(400).json({ success: false, message: 'The selected department does not exist.' });
      return;
    }
    const programme = await prisma.programme.update({
      where: { id: idValidation.data },
      data: { ...bodyValidation.data, description: bodyValidation.data.description ?? null },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { students: true } },
      },
    });
    await logActivity({ userId: request.auth?.userId, action: 'PROGRAMME_UPDATED', module: 'PROGRAMMES', recordId: programme.id, description: `Updated programme ${programme.name} (${programme.code}).` });
    response.status(200).json({ success: true, message: 'Programme updated successfully.', data: { programme } });
  } catch (error) {
    handleError(response, error);
  }
};

export const deleteProgramme: RequestHandler = async (request, response) => {
  const validation = academicUnitIdSchema.safeParse(request.params.id);
  if (!validation.success) {
    response.status(400).json({ success: false, message: 'Invalid programme identifier.' });
    return;
  }
  try {
    const programme = await prisma.programme.findUnique({
      where: { id: validation.data },
      select: { id: true, name: true, _count: { select: { students: true } } },
    });
    if (!programme) {
      response.status(404).json({ success: false, message: 'Programme not found.' });
      return;
    }
    if (programme._count.students > 0) {
      response.status(409).json({ success: false, message: `Cannot delete ${programme.name} while ${programme._count.students} student(s) depend on it.` });
      return;
    }
    await prisma.programme.delete({ where: { id: programme.id } });
    await logActivity({ userId: request.auth?.userId, action: 'PROGRAMME_DELETED', module: 'PROGRAMMES', recordId: programme.id, description: `Deleted programme ${programme.name}.` });
    response.status(200).json({ success: true, message: 'Programme deleted successfully.' });
  } catch (error) {
    handleError(response, error);
  }
};
