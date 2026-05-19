import { Router } from 'express';
import { body } from 'express-validator';
import { getTasks, createTask, updateTask, deleteTask, submitTask, reviewTask, addComment } from '../controllers/taskController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import upload from '../middleware/upload.js';

const router = Router();

router.use(authMiddleware);

router.get('/projects/:projectId/tasks', getTasks);

router.post(
  '/projects/:projectId/tasks',
  [body('title').trim().notEmpty().withMessage('Judul task wajib diisi')],
  validateRequest,
  createTask
);

router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

router.post('/tasks/:id/submit', upload.single('file'), submitTask);

router.put(
  '/tasks/:id/review',
  [body('action').isIn(['approve', 'revision']).withMessage('Action harus approve atau revision')],
  validateRequest,
  reviewTask
);

router.post(
  '/tasks/:id/comments',
  [body('content').trim().notEmpty().withMessage('Komentar tidak boleh kosong')],
  validateRequest,
  addComment
);

export default router;
