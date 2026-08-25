import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { JWT_AUDIENCE, JWT_ISSUER, STUDENT_AUTH_COOKIE_NAME, jwtSecret } from '../config/auth.js';
import { prisma } from '../lib/prisma.js';

export async function authenticateStudent(request: Request, response: Response, next: NextFunction) {
  const token = request.cookies?.[STUDENT_AUTH_COOKIE_NAME] as string | undefined;

  if (!token) {
    response.status(401).json({ success: false, message: 'Authentication is required.' });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret, { issuer: JWT_ISSUER, audience: JWT_AUDIENCE }) as JwtPayload;

    if (typeof payload.sub !== 'string' || payload['type'] !== 'student') {
      throw new Error('Invalid token type.');
    }

    const student = await prisma.student.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });

    if (!student) {
      response.status(401).json({ success: false, message: 'Your session is no longer valid.' });
      return;
    }

    request.studentAuth = { studentId: student.id };
    next();
  } catch {
    response.status(401).json({ success: false, message: 'Your session is invalid or has expired.' });
  }
}
