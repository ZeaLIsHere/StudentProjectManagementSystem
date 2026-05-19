import { Router } from 'express';
import { bulkUpdateTasks } from '../controllers/kanbanController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);
router.put('/bulk-update', bulkUpdateTasks);

export default router;
