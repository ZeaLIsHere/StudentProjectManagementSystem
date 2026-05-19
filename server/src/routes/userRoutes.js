import { Router } from 'express';
import { body } from 'express-validator';
import {
  getUsers, getUserById, updateUser, updateProfile, updateUserRole,
  toggleUserActive, promoteToKetua, inviteAssistant, acceptInvite, rejectInvite, getPendingInvites,
} from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(authMiddleware);

router.get('/', authorize(ROLES.ADMIN, ROLES.DOSEN, ROLES.MAHASISWA_KETUA), getUsers);
router.get('/pending-invites', getPendingInvites);
router.get('/:id', getUserById);
router.put('/profile', updateUser);

router.put(
  '/profile/update',
  [
    body('fullName').optional().trim().notEmpty().withMessage('Nama tidak boleh kosong'),
    body('email').optional().isEmail().withMessage('Email tidak valid'),
  ],
  validateRequest,
  updateProfile
);

router.post(
  '/invite-assistant',
  authorize(ROLES.DOSEN),
  [body('email').isEmail().withMessage('Email tidak valid')],
  validateRequest,
  inviteAssistant
);

router.post('/accept-invite', authorize(ROLES.ASISTEN_DOSEN), acceptInvite);
router.post('/reject-invite', authorize(ROLES.ASISTEN_DOSEN), rejectInvite);

router.put('/:id/role', authorize(ROLES.ADMIN), updateUserRole);
router.put('/:id/toggle-active', authorize(ROLES.ADMIN), toggleUserActive);
router.put('/:id/promote', authorize(ROLES.DOSEN, ROLES.ADMIN), promoteToKetua);

export default router;
