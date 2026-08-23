import { prisma } from '../lib/prisma.js';

interface ActivityLogInput {
  userId?: string;
  action: string;
  module: string;
  recordId?: string | null;
  description: string;
}

export async function logActivity({ userId, action, module, recordId, description }: ActivityLogInput) {
  if (!userId) return;

  try {
    await prisma.activityLog.create({
      data: { userId, action, module, recordId: recordId ?? null, description },
    });
  } catch (error) {
    console.error('Unable to write activity log.', error);
  }
}
