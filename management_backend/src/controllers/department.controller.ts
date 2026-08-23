import { Prisma } from '@prisma/client';
import type { RequestHandler, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import { academicUnitIdSchema, departmentBodySchema } from '../validation/academic-unit.validation.js';

function handleError(response: Response, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({ success: false, message: 'A department with this name or code already exists.' });
      return;
    }
    if (error.code === 'P2003') {
      response.status(409).json({ success: false, message: 'This department is still referenced by other records.' });
      return;
    }
  }
  response.status(500).json({ success: false, message: 'Unable to complete the department operation.' });
}

export const listDepartments: RequestHandler = async (_request, response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { programmes: true, students: true } } },
    });
    response.status(200).json({ success: true, data: { departments } });
  } catch (error) {
    handleError(response, error);
  }
};

export const getDepartment: RequestHandler = async (request, response) => {
  const validation = academicUnitIdSchema.safeParse(request.params.id);
  if (!validation.success) {
    response.status(400).json({ success: false, message: 'Invalid department identifier.' });
    return;
  }
  try {
    const department = await prisma.department.findUnique({
      where: { id: validation.data },
      include: {
        programmes: { orderBy: { name: 'asc' }, include: { _count: { select: { students: true } } } },
        _count: { select: { programmes: true, students: true } },
      },
    });
    if (!department) {
      response.status(404).json({ success: false, message: 'Department not found.' });
      return;
    }
    response.status(200).json({ success: true, data: { department } });
  } catch (error) {
    handleError(response, error);
  }
};

export const createDepartment: RequestHandler = async (request, response) => {
  const validation = departmentBodySchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ success: false, message: 'Please provide valid department information.', fields: validation.error.flatten().fieldErrors });
    return;
  }
  try {
    const department = await prisma.department.create({
      data: { ...validation.data, description: validation.data.description ?? null },
      include: { _count: { select: { programmes: true, students: true } } },
    });
    await logActivity({ userId: request.auth?.userId, action: 'DEPARTMENT_CREATED', module: 'DEPARTMENTS', recordId: department.id, description: `Created department ${department.name} (${department.code}).` });
    response.status(201).json({ success: true, message: 'Department created successfully.', data: { department } });
  } catch (error) {
    handleError(response, error);
  }
};

export const updateDepartment: RequestHandler = async (request, response) => {
  const idValidation = academicUnitIdSchema.safeParse(request.params.id);
  const bodyValidation = departmentBodySchema.safeParse(request.body);
  if (!idValidation.success || !bodyValidation.success) {
    response.status(400).json({ success: false, message: 'Please provide valid department information.', fields: bodyValidation.success ? undefined : bodyValidation.error.flatten().fieldErrors });
    return;
  }
  try {
    const exists = await prisma.department.findUnique({ where: { id: idValidation.data }, select: { id: true } });
    if (!exists) {
      response.status(404).json({ success: false, message: 'Department not found.' });
      return;
    }
    const department = await prisma.department.update({
      where: { id: idValidation.data },
      data: { ...bodyValidation.data, description: bodyValidation.data.description ?? null },
      include: { _count: { select: { programmes: true, students: true } } },
    });
    await logActivity({ userId: request.auth?.userId, action: 'DEPARTMENT_UPDATED', module: 'DEPARTMENTS', recordId: department.id, description: `Updated department ${department.name} (${department.code}).` });
    response.status(200).json({ success: true, message: 'Department updated successfully.', data: { department } });
  } catch (error) {
    handleError(response, error);
  }
};

export const deleteDepartment: RequestHandler = async (request, response) => {
  const validation = academicUnitIdSchema.safeParse(request.params.id);
  if (!validation.success) {
    response.status(400).json({ success: false, message: 'Invalid department identifier.' });
    return;
  }
  try {
    const department = await prisma.department.findUnique({
      where: { id: validation.data },
      select: { id: true, name: true, _count: { select: { programmes: true, students: true } } },
    });
    if (!department) {
      response.status(404).json({ success: false, message: 'Department not found.' });
      return;
    }
    if (department._count.programmes > 0 || department._count.students > 0) {
      response.status(409).json({
        success: false,
        message: `Cannot delete ${department.name} while it has ${department._count.programmes} programme(s) or ${department._count.students} student(s).`,
      });
      return;
    }
    await prisma.department.delete({ where: { id: department.id } });
    await logActivity({ userId: request.auth?.userId, action: 'DEPARTMENT_DELETED', module: 'DEPARTMENTS', recordId: department.id, description: `Deleted department ${department.name}.` });
    response.status(200).json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    handleError(response, error);
  }
};
