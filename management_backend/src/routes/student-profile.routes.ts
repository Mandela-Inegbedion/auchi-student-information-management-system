import { Router } from 'express';
import { getStudentTranscript, updateStudentContactInfo } from '../controllers/student-profile.controller.js';
import { authenticateStudent } from '../middleware/authenticateStudent.js';

const router = Router();

router.put('/', authenticateStudent, updateStudentContactInfo);
router.get('/transcript', authenticateStudent, getStudentTranscript);

export default router;
