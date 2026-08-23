import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { createProgramme, deleteProgramme, getProgramme, listProgrammes, updateProgramme } from '../controllers/programme.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate, authorize(UserRole.ADMIN));
router.get('/', listProgrammes);
router.get('/:id', getProgramme);
router.post('/', createProgramme);
router.put('/:id', updateProgramme);
router.delete('/:id', deleteProgramme);
export default router;
