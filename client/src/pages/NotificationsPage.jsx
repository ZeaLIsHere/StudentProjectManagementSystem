import { useState, useEffect } from 'react';
import api from '../api/axiosInstance.js';
import { formatRelative } from '../utils/formatDate.js';
import { IconBell } from '../components/common/Icons.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';

const TYPE_STYLES = {
  highPriorityTask: { bg: 'bg-red-50', ring: 'ring-red-200/60', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  taskRevision: { bg: 'bg-amber-50', ring: 'ring-amber-200/60', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  deadlineReminder: { bg: 'bg-orange-50', ring: 'ring-orange-200/60', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  taskApproved: { bg: 'bg-emerald-50', ring: 'ring-emerald-200/60', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  asistenInvite: { bg: 'bg-violet-50', ring: 'ring-violet-200/60', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
};

const TYPE_LABELS = {
  highPriorityTask: 'Prioritas Tinggi',
  taskRevision: 'Revisi',
  deadlineReminder: 'Deadline',
  taskApproved: 'Disetujui',
  asistenInvite: 'Undangan',
};

export default function NotificationsPage() {
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

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
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

            return (
              <div key={n._id} onClick={() => !n.isRead && handleMarkRead(n._id)} className={`bg-white rounded-xl border p-4 cursor-pointer transition-all duration-150 hover:shadow-sm ${n.isRead ? 'border-slate-200/80' : 'border-blue-200 ring-1 ring-blue-100'}`}>
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
