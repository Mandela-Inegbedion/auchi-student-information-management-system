import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { listActivityLogs } from '../controllers/activity-log.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate, authorize(UserRole.ADMIN));
router.get('/', listActivityLogs);

export default router;
