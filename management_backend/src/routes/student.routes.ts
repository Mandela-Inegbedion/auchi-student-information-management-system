import { UserRole } from '@prisma/client';
import { Router } from 'express';
import {
  createStudent,
  deleteStudent,
  getStudent,
  getStudentFormOptions,
  listStudents,
  resetStudentPortalPassword,
  updateStudent,
} from '../controllers/student.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN, UserRole.STAFF));
router.get('/form-options', getStudentFormOptions);
router.get('/', listStudents);
router.get('/:id', getStudent);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.post('/:id/reset-portal-password', resetStudentPortalPassword);

export default router;
