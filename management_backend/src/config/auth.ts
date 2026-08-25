import type { CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'sims_auth';
export const STUDENT_AUTH_COOKIE_NAME = 'sims_student_auth';
export const JWT_ISSUER = 'auchi-polytechnic-sims';
export const JWT_AUDIENCE = 'auchi-polytechnic-sims-web';

function readJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }

  return secret;
}

function readExpiryHours(): number {
  const hours = Number(process.env.JWT_EXPIRES_IN_HOURS ?? 8);

  if (!Number.isInteger(hours) || hours < 1 || hours > 8760) {
    throw new Error('JWT_EXPIRES_IN_HOURS must be an integer between 1 and 8760.');
  }

  return hours;
}

export const jwtSecret = readJwtSecret();
export const jwtExpiresInSeconds = readExpiryHours() * 60 * 60;

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: jwtExpiresInSeconds * 1000,
};

export const clearAuthCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export const studentAuthCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: jwtExpiresInSeconds * 1000,
};

export const clearStudentAuthCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};
