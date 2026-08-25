import { Semester } from '@prisma/client';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const updateSettingsSchema = z.object({
  institution_name: z.string().trim().min(1, 'Institution name is required.').max(200),
  current_session: z
    .string()
    .trim()
    .regex(/^\d{4}\/\d{4}$/, 'Session must be in YYYY/YYYY format (e.g. 2025/2026).'),
  current_semester: z.nativeEnum(Semester, { message: 'Select a valid semester.' }),
});

export const getSettings: RequestHandler = async (_request, response) => {
  try {
    const rows = await prisma.systemSetting.findMany();
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    response.status(200).json({ success: true, data: { settings } });
  } catch {
    response.status(500).json({ success: false, message: 'Unable to load settings.' });
  }
};

export const updateSettings: RequestHandler = async (request, response) => {
  const validation = updateSettingsSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: validation.error.issues[0]?.message ?? 'Please correct the settings.',
      fields: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const { institution_name, current_session, current_semester } = validation.data;

  try {
    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: 'institution_name' },
        update: { value: institution_name },
        create: { key: 'institution_name', value: institution_name },
      }),
      prisma.systemSetting.upsert({
        where: { key: 'current_session' },
        update: { value: current_session },
        create: { key: 'current_session', value: current_session },
      }),
      prisma.systemSetting.upsert({
        where: { key: 'current_semester' },
        update: { value: current_semester },
        create: { key: 'current_semester', value: current_semester },
      }),
    ]);

    const rows = await prisma.systemSetting.findMany();
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    response.status(200).json({ success: true, message: 'Settings saved successfully.', data: { settings } });
  } catch {
    response.status(500).json({ success: false, message: 'Unable to save settings.' });
  }
};
