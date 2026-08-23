import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { getCurrentUser, login, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, authorize(UserRole.ADMIN, UserRole.STAFF), getCurrentUser);
router.post('/logout', logout);

export default router;
