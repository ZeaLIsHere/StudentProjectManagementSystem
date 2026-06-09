import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance.js';
import { formatRelative } from '../utils/formatDate.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';

const TYPE_STYLES = {
  taskAssigned: { bg: 'bg-blue-50', ring: 'ring-blue-200/60', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  taskSubmitted: { bg: 'bg-indigo-50', ring: 'ring-indigo-200/60', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
  taskComment: { bg: 'bg-slate-50', ring: 'ring-slate-200/60', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' },
  highPriorityTask: { bg: 'bg-red-50', ring: 'ring-red-200/60', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  taskRevision: { bg: 'bg-amber-50', ring: 'ring-amber-200/60', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  deadlineReminder: { bg: 'bg-orange-50', ring: 'ring-orange-200/60', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  deadline: { bg: 'bg-orange-50', ring: 'ring-orange-200/60', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  taskApproved: { bg: 'bg-emerald-50', ring: 'ring-emerald-200/60', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  asistenInvite: { bg: 'bg-violet-50', ring: 'ring-violet-200/60', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  projectClaimed: { bg: 'bg-cyan-50', ring: 'ring-cyan-200/60', text: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-700' },
};

const TYPE_LABELS = {
  taskAssigned: 'Task Baru',
  taskSubmitted: 'Disubmit',
  taskComment: 'Komentar',
  highPriorityTask: 'Prioritas Tinggi',
  taskRevision: 'Revisi',
  deadlineReminder: 'Deadline Proyek',
  deadline: 'Deadline Task',
  taskApproved: 'Disetujui',
  asistenInvite: 'Undangan',
  projectClaimed: 'Proyek Diklaim',
};

const getNotificationLink = (notification) => {
  if (notification.type === 'asistenInvite') return '/invitations';
  if (notification.relatedTask && notification.relatedProject) {
    return `/kanban/${notification.relatedProject._id || notification.relatedProject}`;
  }
  if (notification.relatedProject) {
    return `/projects/${notification.relatedProject._id || notification.relatedProject}`;
  }
  return null;
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Semua notifikasi ditandai dibaca');
    } catch {}
  };

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await api.put(`/notifications/${notification._id}/read`);
        setNotifications((prev) => prev.map((n) => n._id === notification._id ? { ...n, isRead: true } : n));
      } catch {}
    }

    const link = getNotificationLink(notification);
    if (link) navigate(link);
  };

  if (loading) return <LoadingSpinner />;

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifikasi</h1>
          {unread > 0 && <p className="text-sm text-slate-400 mt-0.5">{unread} belum dibaca</p>}
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer uppercase tracking-wider">Tandai Semua Dibaca</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="Tidak ada notifikasi" description="Notifikasi akan muncul di sini" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const typeStyle = TYPE_STYLES[n.type];
            const typeLabel = TYPE_LABELS[n.type];
            const avatarBg = !n.isRead ? (typeStyle?.bg || 'bg-blue-50') : 'bg-slate-100';
            const avatarRing = !n.isRead ? (typeStyle?.ring || 'ring-blue-200/60') : 'ring-slate-200/60';
            const avatarText = !n.isRead ? (typeStyle?.text || 'text-blue-600') : 'text-slate-500';
            const hasLink = !!getNotificationLink(n);

            return (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={`bg-white rounded-xl border p-4 transition-all duration-150 hover:shadow-sm ${hasLink ? 'cursor-pointer' : 'cursor-default'} ${n.isRead ? 'border-slate-200/80' : 'border-blue-200 ring-1 ring-blue-100'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-2 ${avatarBg} ${avatarRing}`}>
                    <span className={`text-xs font-semibold ${avatarText}`}>{n.sender?.fullName?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      {typeLabel && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeStyle?.badge || 'bg-slate-100 text-slate-600'}`}>{typeLabel}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{formatRelative(n.createdAt)}</p>
                    {hasLink && <p className="text-[10px] text-blue-500 mt-1 font-medium">Klik untuk melihat →</p>}
                  </div>
                  {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
