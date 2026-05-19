import { Router } from 'express';
import { getProjectHeatmapData, getUserHeatmapData } from '../controllers/heatmapController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);
router.get('/project/:projectId', getProjectHeatmapData);
router.get('/user/:userId', getUserHeatmapData);

export default router;
