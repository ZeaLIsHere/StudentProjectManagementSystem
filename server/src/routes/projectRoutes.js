import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProjects, getOpenProjects, getProjectById, createProject,
  claimProject, updateProject, deleteProject, addMember, removeMember,
  assignAssistant, removeAssistant, getMyAssistants,
} from '../controllers/projectController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getProjects);
router.get('/open', authorize(ROLES.MAHASISWA_KETUA, ROLES.ADMIN), getOpenProjects);
router.get('/my-assistants', authorize(ROLES.DOSEN), getMyAssistants);
router.get('/:id', getProjectById);

router.post(
  '/',
  authorize(ROLES.DOSEN, ROLES.ADMIN),
  [
    body('title').trim().notEmpty().withMessage('Judul wajib diisi'),
    body('description').trim().notEmpty().withMessage('Deskripsi wajib diisi'),
    body('maxMembers').isInt({ min: 2 }).withMessage('Minimal 2 anggota'),
    body('startDate').isISO8601().withMessage('Tanggal mulai tidak valid'),
    body('endDate').isISO8601().withMessage('Tanggal selesai tidak valid'),
  ],
  validateRequest,
  createProject
);

router.post('/:id/claim', authorize(ROLES.MAHASISWA_KETUA), claimProject);
router.put('/:id', authorize(ROLES.DOSEN, ROLES.ADMIN), updateProject);
router.delete('/:id', authorize(ROLES.DOSEN, ROLES.ADMIN), deleteProject);

router.post(
  '/:id/members',
  authorize(ROLES.MAHASISWA_KETUA, ROLES.ADMIN),
  [body('memberNim').trim().notEmpty().withMessage('NIM wajib diisi')],
  validateRequest,
  addMember
);

router.delete('/:id/members/:userId', authorize(ROLES.MAHASISWA_KETUA, ROLES.ADMIN), removeMember);

router.post(
  '/:id/assistants',
  authorize(ROLES.DOSEN),
  [body('assistantId').trim().notEmpty().withMessage('ID Asisten wajib diisi')],
  validateRequest,
  assignAssistant
);

router.delete('/:id/assistants/:assistantId', authorize(ROLES.DOSEN), removeAssistant);

export default router;
