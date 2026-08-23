import { Prisma } from '@prisma/client';
import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma.js';
import { activityLogListQuerySchema } from '../validation/activity-log.validation.js';

export const listActivityLogs: RequestHandler = async (request, response) => {
  const validation = activityLogListQuerySchema.safeParse(request.query);
  if (!validation.success) {
    response.status(400).json({ success: false, message: validation.error.issues[0]?.message ?? 'Invalid activity log query.' });
    return;
  }

  const { search, userId, module, action, order, page, pageSize } = validation.data;
  const where: Prisma.ActivityLogWhereInput = {
    userId,
    module,
    action,
    OR: search ? [
      { description: { contains: search, mode: 'insensitive' } },
      { action: { contains: search, mode: 'insensitive' } },
      { module: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ] : undefined,
  };

  try {
    const [logs, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        orderBy: [{ createdAt: order }, { id: order }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
      }),
      prisma.activityLog.count({ where }),
    ]);

    response.status(200).json({
      success: true,
      data: { logs, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
    });
  } catch {
    response.status(500).json({ success: false, message: 'Unable to load activity logs.' });
  }
};
