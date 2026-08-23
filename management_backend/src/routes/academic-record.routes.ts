import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { createAcademicRecord, deleteAcademicRecord, getAcademicRecord, getAcademicRecordOptions, listAcademicRecords, updateAcademicRecord } from '../controllers/academic-record.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate, authorize(UserRole.ADMIN, UserRole.STAFF));
router.get('/form-options', getAcademicRecordOptions);
router.get('/', listAcademicRecords);
router.get('/:id', getAcademicRecord);
router.post('/', createAcademicRecord);
router.put('/:id', updateAcademicRecord);
router.delete('/:id', deleteAcademicRecord);
export default router;
