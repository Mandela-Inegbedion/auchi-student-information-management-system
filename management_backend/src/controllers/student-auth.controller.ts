import { compare } from 'bcryptjs';
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  JWT_AUDIENCE,
  JWT_ISSUER,
  STUDENT_AUTH_COOKIE_NAME,
  clearStudentAuthCookieOptions,
  jwtExpiresInSeconds,
  jwtSecret,
  studentAuthCookieOptions,
} from '../config/auth.js';
import { prisma } from '../lib/prisma.js';

const studentLoginSchema = z.object({
  matricNumber: z
    .string()
    .trim()
    .min(1, 'Matric number is required.')
    .transform((v) => v.toUpperCase()),
  password: z.string().min(1, 'Password is required.').max(128),
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

export const studentLogin: RequestHandler = async (request, response) => {
  const validation = studentLoginSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ success: false, message: validation.error.issues[0]?.message ?? 'Invalid login details.' });
    return;
  }

  try {
    const student = await prisma.student.findUnique({
      where: { matricNumber: validation.data.matricNumber },
      select: { id: true, matricNumber: true, firstName: true, lastName: true, passwordHash: true, status: true },
    });

    if (!student || !student.passwordHash || !(await compare(validation.data.password, student.passwordHash))) {
      response.status(401).json({ success: false, message: 'Invalid matric number or password.' });
      return;
    }

    const token = jwt.sign({ type: 'student' }, jwtSecret, {
      subject: student.id,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: jwtExpiresInSeconds,
    });

    response.cookie(STUDENT_AUTH_COOKIE_NAME, token, studentAuthCookieOptions);
    response.status(200).json({
      success: true,
      data: {
        student: { id: student.id, matricNumber: student.matricNumber, firstName: student.firstName, lastName: student.lastName },
      },
    });
  } catch {
    response.status(500).json({ success: false, message: 'Unable to sign in right now. Please try again.' });
  }
};

export const studentLogout: RequestHandler = (_request, response) => {
  response.clearCookie(STUDENT_AUTH_COOKIE_NAME, clearStudentAuthCookieOptions);
  response.status(200).json({ success: true, message: 'Signed out successfully.' });
};

export const getStudentMe: RequestHandler = async (request, response) => {
  if (!request.studentAuth) {
    response.status(401).json({ success: false, message: 'Authentication is required.' });
    return;
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: request.studentAuth.studentId },
      select: safeStudentSelect,
    });

    if (!student) {
      response.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }

    response.status(200).json({ success: true, data: { student } });
  } catch {
    response.status(500).json({ success: false, message: 'Unable to load your profile.' });
  }
};
