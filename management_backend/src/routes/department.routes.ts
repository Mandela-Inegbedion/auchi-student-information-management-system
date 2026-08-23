import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { createDepartment, deleteDepartment, getDepartment, listDepartments, updateDepartment } from '../controllers/department.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate, authorize(UserRole.ADMIN));
router.get('/', listDepartments);
router.get('/:id', getDepartment);
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);
export default router;
