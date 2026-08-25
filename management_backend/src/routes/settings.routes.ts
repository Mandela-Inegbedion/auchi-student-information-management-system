import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.STAFF), getSettings);
router.put('/', authenticate, authorize(UserRole.ADMIN), updateSettings);

export default router;
