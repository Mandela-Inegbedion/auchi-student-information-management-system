import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.STAFF), getDashboard);

export default router;
