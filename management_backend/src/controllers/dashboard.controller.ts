import { UserRole } from '@prisma/client';
import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma.js';

export const getDashboard: RequestHandler = async (request, response) => {
  if (!request.auth) {
    response.status(401).json({ success: false, message: 'Authentication is required.' });
    return;
  }

  try {
    const activityWhere = request.auth.role === UserRole.ADMIN ? undefined : { userId: request.auth.userId };

    const [totalStudents, totalDepartments, totalProgrammes, totalUsers, recentStudents, recentActivity] =
      await prisma.$transaction([
        prisma.student.count(),
        prisma.department.count(),
        prisma.programme.count(),
        prisma.user.count(),
        prisma.student.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            matricNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            status: true,
            createdAt: true,
            department: { select: { name: true, code: true } },
            programme: { select: { name: true, code: true } },
          },
        }),
        prisma.activityLog.findMany({
          where: activityWhere,
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            action: true,
            module: true,
            description: true,
            createdAt: true,
            user: { select: { id: true, fullName: true, role: true } },
          },
        }),
      ]);

    response.status(200).json({
      success: true,
      data: {
        statistics: { totalStudents, totalDepartments, totalProgrammes, totalUsers },
        recentStudents,
        recentActivity,
      },
    });
  } catch {
    response.status(500).json({ success: false, message: 'Unable to load dashboard information.' });
  }
};
