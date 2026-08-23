import type { UserRole } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

export function authorize(...allowedRoles: UserRole[]) {
  const allowedRoleSet = new Set<UserRole>(allowedRoles);

  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.auth) {
      response.status(401).json({ success: false, message: 'Authentication is required.' });
      return;
    }

    if (!allowedRoleSet.has(request.auth.role)) {
      response.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.',
      });
      return;
    }

    next();
  };
}
