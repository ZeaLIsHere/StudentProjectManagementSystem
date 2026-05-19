import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth.js';
import api from '../api/axiosInstance.js';
import { ROLES } from '../utils/constants.js';
import { IconMail, IconCheck, IconX, IconPlus } from '../components/common/Icons.jsx';
import toast from 'react-hot-toast';

export default function InvitationsPage() {
  const { user } = useAuth();
  const isDosen = user?.role === ROLES.DOSEN;
  const isAsdos = user?.role === ROLES.ASISTEN_DOSEN;

  const [inviteEmail, setInviteEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [myAssistants, setMyAssistants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isDosen) {
          const res = await api.get('/projects/my-assistants');
          setMyAssistants(res.data.data.assistants);
        }
        if (isAsdos) {
          const res = await api.get('/users/pending-invites');
          setPendingInvite(res.data.data.invite);
        }
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, [isDosen, isAsdos]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users/invite-assistant', { email: inviteEmail });
      toast.success('Undangan berhasil dikirim');
      setInviteEmail('');
      if (isDosen) {
        const res = await api.get('/projects/my-assistants');
        setMyAssistants(res.data.data.assistants);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim undangan');
    } finally { setSubmitting(false); }
  };

  const handleAccept = async () => {
    try {
      await api.post('/users/accept-invite');
      toast.success('Undangan diterima');
      setPendingInvite(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menerima undangan');
    }
  };

  const handleReject = async () => {
    try {
      await api.post('/users/reject-invite');
      toast.success('Undangan ditolak');
      setPendingInvite(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menolak undangan');
    }
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2.5 mb-6">
        <IconMail size={22} className="text-slate-400" />
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Undangan</h1>
      </div>

      {/* Dosen View - Send invitations */}
      {isDosen && (
        <>
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Undang Asisten Dosen</h2>
            <p className="text-sm text-slate-400 mb-4">Masukkan email user yang sudah terdaftar sebagai Asisten Dosen</p>
            <form onSubmit={handleInvite} className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="Email asisten dosen"
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 transition-shadow"
              />
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer shadow-sm">
                <IconPlus size={14} />
                {submitting ? 'Mengirim...' : 'Undang'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Asisten Terhubung</h2>
            {myAssistants.length > 0 ? (
              <div className="space-y-2">
                {myAssistants.map((a) => (
                  <div key={a._id} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="w-9 h-9 bg-violet-50 rounded-full flex items-center justify-center ring-2 ring-violet-200/60">
                      <span className="text-xs font-semibold text-violet-600">{a.fullName?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{a.fullName}</p>
                      <p className="text-xs text-slate-400">{a.email}</p>
                    </div>
                    <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Terhubung</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Belum ada asisten yang terhubung</p>
            )}
          </div>
        </>
      )}

      {/* Asisten Dosen View - Receive invitations */}
      {isAsdos && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Undangan Pending</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Memuat...</p>
          ) : pendingInvite ? (
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
              <p className="text-sm font-medium text-violet-800 mb-1">Undangan dari Dosen</p>
              <p className="text-lg font-bold text-violet-900">{pendingInvite.from.fullName}</p>
              <p className="text-sm text-violet-600 mb-4">{pendingInvite.from.email}</p>
              <div className="flex gap-3">
                <button onClick={handleAccept} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors cursor-pointer">
                  <IconCheck size={16} />
                  Terima Undangan
                </button>
                <button onClick={handleReject} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-white text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer">
                  <IconX size={16} />
                  Tolak
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Tidak ada undangan pending saat ini</p>
          )}
        </div>
      )}
    </div>
  );
}
