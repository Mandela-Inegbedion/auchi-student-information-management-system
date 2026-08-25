import { Router } from 'express';
import { getStudentMe, studentLogin, studentLogout } from '../controllers/student-auth.controller.js';
import { authenticateStudent } from '../middleware/authenticateStudent.js';

const router = Router();

router.post('/login', studentLogin);
router.post('/logout', studentLogout);
router.get('/me', authenticateStudent, getStudentMe);

export default router;
