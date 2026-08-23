import { UserStatus } from '@prisma/client';
import { compare } from 'bcryptjs';
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  AUTH_COOKIE_NAME,
  JWT_AUDIENCE,
  JWT_ISSUER,
  authCookieOptions,
  clearAuthCookieOptions,
  jwtExpiresInSeconds,
  jwtSecret,
} from '../config/auth.js';
import { prisma } from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password is required.').max(128),
});

const safeUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

export const login: RequestHandler = async (request, response) => {
  const validation = loginSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: validation.error.issues[0]?.message ?? 'Invalid login details.',
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: validation.data.email },
    });

    if (!user || !(await compare(validation.data.password, user.passwordHash))) {
      response.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (user.status !== UserStatus.ACTIVE) {
      response.status(403).json({ success: false, message: 'This account is inactive. Contact an administrator.' });
      return;
    }

    const token = jwt.sign({ role: user.role }, jwtSecret, {
      subject: user.id,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: jwtExpiresInSeconds,
    });

    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      recordId: user.id,
      description: `${user.fullName} signed in.`,
    });

    response.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    response.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
      },
    });
  } catch {
    response.status(500).json({ success: false, message: 'Unable to sign in right now. Please try again.' });
  }
};

export const getCurrentUser: RequestHandler = async (request, response) => {
  if (!request.auth) {
    response.status(401).json({ success: false, message: 'Authentication is required.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: request.auth.userId },
      select: safeUserSelect,
    });

    if (!user) {
      response.status(401).json({ success: false, message: 'Your session is no longer valid.' });
      return;
    }

    response.status(200).json({ success: true, data: { user } });
  } catch {
    response.status(500).json({ success: false, message: 'Unable to load your account.' });
  }
};

export const logout: RequestHandler = async (request, response) => {
  response.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);

  const token = request.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
  if (token) {
    try {
      const payload = jwt.verify(token, jwtSecret, { issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
      if (typeof payload !== 'string' && typeof payload.sub === 'string') {
        await logActivity({ userId: payload.sub, action: 'LOGOUT', module: 'AUTH', recordId: payload.sub, description: 'User signed out.' });
      }
    } catch {
      // The cookie is cleared even when it contains an invalid or expired token.
    }
  }

  response.status(200).json({ success: true, message: 'Signed out successfully.' });
};
