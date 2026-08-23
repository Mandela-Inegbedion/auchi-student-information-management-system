import { UserStatus } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { AUTH_COOKIE_NAME, JWT_AUDIENCE, JWT_ISSUER, jwtSecret } from '../config/auth.js';
import { prisma } from '../lib/prisma.js';

function readToken(request: Request): string | undefined {
  const cookieToken = request.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
  if (cookieToken) return cookieToken;

  const authorization = request.header('authorization');
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7).trim();

  return undefined;
}

export async function authenticate(request: Request, response: Response, next: NextFunction) {
  const token = readToken(request);

  if (!token) {
    response.status(401).json({ success: false, message: 'Authentication is required.' });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as JwtPayload;

    if (typeof payload.sub !== 'string') throw new Error('Invalid token subject.');

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      response.status(401).json({ success: false, message: 'Your session is no longer valid.' });
      return;
    }

    request.auth = { userId: user.id, role: user.role };
    next();
  } catch {
    response.status(401).json({ success: false, message: 'Your session is invalid or has expired.' });
  }
}
