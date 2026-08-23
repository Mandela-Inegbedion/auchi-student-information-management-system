import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { createUser, listUsers, updateUser, updateUserStatus } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate, authorize(UserRole.ADMIN));
router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/status', updateUserStatus);

export default router;
