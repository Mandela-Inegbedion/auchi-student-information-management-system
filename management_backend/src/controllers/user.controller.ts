import { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import type { RequestHandler, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import { createUserBodySchema, updateUserBodySchema, updateUserStatusBodySchema, userIdSchema } from '../validation/user.validation.js';

const safeUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

function handleError(response: Response, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    response.status(409).json({ success: false, message: 'A user with this email address already exists.' });
    return;
  }
  response.status(500).json({ success: false, message: 'Unable to complete the user operation.' });
}

export const listUsers: RequestHandler = async (_request, response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ status: 'asc' }, { fullName: 'asc' }],
      select: safeUserSelect,
    });
    response.status(200).json({ success: true, data: { users } });
  } catch (error) {
    handleError(response, error);
  }
};

export const createUser: RequestHandler = async (request, response) => {
  const validation = createUserBodySchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ success: false, message: 'Please provide valid user information.', fields: validation.error.flatten().fieldErrors });
    return;
  }

  try {
    const passwordHash = await hash(validation.data.password, 12);
    const user = await prisma.user.create({
      data: {
        fullName: validation.data.fullName,
        email: validation.data.email,
        passwordHash,
        role: validation.data.role,
      },
      select: safeUserSelect,
    });
    await logActivity({ userId: request.auth?.userId, action: 'USER_CREATED', module: 'USERS', recordId: user.id, description: `Created ${user.role} account for ${user.fullName}.` });
    response.status(201).json({ success: true, message: 'User created successfully.', data: { user } });
  } catch (error) {
    handleError(response, error);
  }
};

export const updateUser: RequestHandler = async (request, response) => {
  const idValidation = userIdSchema.safeParse(request.params.id);
  const bodyValidation = updateUserBodySchema.safeParse(request.body);
  if (!idValidation.success || !bodyValidation.success) {
    response.status(400).json({
      success: false,
      message: 'Please provide valid user information.',
      fields: bodyValidation.success ? undefined : bodyValidation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: idValidation.data }, select: { id: true, fullName: true, role: true } });
    if (!existing) {
      response.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    if (request.auth?.userId === idValidation.data && bodyValidation.data.role !== request.auth.role) {
      response.status(409).json({ success: false, message: 'You cannot change your own administrator role.' });
      return;
    }

    const { password, ...details } = bodyValidation.data;
    const user = await prisma.user.update({
      where: { id: idValidation.data },
      data: {
        ...details,
        ...(password ? { passwordHash: await hash(password, 12) } : {}),
      },
      select: safeUserSelect,
    });
    await logActivity({ userId: request.auth?.userId, action: 'USER_UPDATED', module: 'USERS', recordId: user.id, description: `Updated user account for ${user.fullName}.` });
    if (existing.role !== user.role) {
      await logActivity({ userId: request.auth?.userId, action: 'ROLE_CHANGED', module: 'USERS', recordId: user.id, description: `Changed ${user.fullName}'s role from ${existing.role} to ${user.role}.` });
    }
    response.status(200).json({ success: true, message: 'User updated successfully.', data: { user } });
  } catch (error) {
    handleError(response, error);
  }
};

export const updateUserStatus: RequestHandler = async (request, response) => {
  const idValidation = userIdSchema.safeParse(request.params.id);
  const bodyValidation = updateUserStatusBodySchema.safeParse(request.body);
  if (!idValidation.success || !bodyValidation.success) {
    response.status(400).json({ success: false, message: 'Select a valid user status.' });
    return;
  }
  if (request.auth?.userId === idValidation.data && bodyValidation.data.status === 'INACTIVE') {
    response.status(409).json({ success: false, message: 'You cannot deactivate your own account.' });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: idValidation.data }, select: { id: true, fullName: true, status: true } });
    if (!existing) {
      response.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    const user = await prisma.user.update({
      where: { id: idValidation.data },
      data: { status: bodyValidation.data.status },
      select: safeUserSelect,
    });
    await logActivity({ userId: request.auth?.userId, action: 'USER_STATUS_CHANGED', module: 'USERS', recordId: user.id, description: `${user.status === 'ACTIVE' ? 'Activated' : 'Deactivated'} ${existing.fullName}'s account.` });
    response.status(200).json({ success: true, message: `User ${user.status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`, data: { user } });
  } catch (error) {
    handleError(response, error);
  }
};
