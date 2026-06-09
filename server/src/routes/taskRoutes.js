import { Router } from 'express';
import { body } from 'express-validator';
import { getTasks, createTask, updateTask, deleteTask, uploadTaskAttachment, deleteTaskAttachment, submitTask, reviewTask, addComment } from '../controllers/taskController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import upload from '../middleware/upload.js';

const router = Router();

router.use(authMiddleware);

router.get('/projects/:projectId/tasks', getTasks);

router.post(
  '/projects/:projectId/tasks',
  [
    body('title').trim().notEmpty().withMessage('Judul task wajib diisi'),
    body('assignee').notEmpty().withMessage('Assignee wajib dipilih'),
  ],
  validateRequest,
  createTask
);

router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

router.post('/tasks/:id/attachments', upload.single('file'), uploadTaskAttachment);
router.delete('/tasks/:id/attachments/:attachmentId', deleteTaskAttachment);
router.post('/tasks/:id/submit', submitTask);

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
