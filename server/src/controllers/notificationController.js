import Notification from '../models/Notification.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user.userId })
    .populate('sender', 'fullName avatar')
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user.userId,
    isRead: false,
  });

  res.json({ success: true, data: { notifications, unreadCount } });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user.userId,
    isRead: false,
  });

  res.json({ success: true, data: { unreadCount } });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notifikasi tidak ditemukan');
  res.json({ success: true, data: { notification } });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user.userId, isRead: false },
    { isRead: true }
  );
  res.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca' });
});

const saveFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  await User.findByIdAndUpdate(req.user.userId, { fcmToken });
  res.json({ success: true, message: 'FCM token berhasil disimpan' });
});

export { getNotifications, getUnreadCount, markAsRead, markAllAsRead, saveFcmToken };
