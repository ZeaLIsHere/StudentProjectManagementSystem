import { Router } from 'express';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, saveFcmToken } from '../controllers/notificationController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.post('/fcm-token', saveFcmToken);

export default router;
