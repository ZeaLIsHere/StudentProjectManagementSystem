import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../api/axiosInstance.js';
import { ROLES, ROLE_LABELS } from '../utils/constants.js';
import { IconFolder, IconClipboard, IconSearch, IconPlus, IconMail, IconBell, IconCheck } from '../components/common/Icons.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

function StatCard({ Icon, label, value, accent, to }) {
  const content = (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md hover:shadow-slate-200/50 transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return content;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    activeProjects: 0,
    tasks: 0,
    tasksDone: 0,
    tasksReview: 0,
    pendingReviews: 0,
    upcomingDeadlines: 0,
    unreadNotifications: 0,
    assignedToMe: 0,
    myTasksPending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data.stats);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;

  const isDosen = user?.role === ROLES.DOSEN;
  const isAsdos = user?.role === ROLES.ASISTEN_DOSEN;
  const isKetua = user?.role === ROLES.MAHASISWA_KETUA;
  const isAnggota = user?.role === ROLES.MAHASISWA_ANGGOTA;

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-slate-400 font-medium mb-1">Selamat datang kembali,</p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {user?.fullName}
        </h1>
        <div className="mt-2 inline-flex items-center px-2.5 py-1 bg-slate-100 rounded-md">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{ROLE_LABELS[user?.role]}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard Icon={IconFolder} label="Total Proyek" value={stats.projects} accent="bg-blue-50 text-blue-600" to="/projects" />
        {(isAnggota || isKetua) ? (
          <StatCard Icon={IconClipboard} label="Task Ditugaskan ke Saya" value={stats.assignedToMe} accent="bg-amber-50 text-amber-600" to="/projects" />
        ) : (
          <StatCard Icon={IconClipboard} label="Total Task" value={stats.tasks} accent="bg-amber-50 text-amber-600" />
        )}
        <StatCard Icon={IconCheck} label={isAnggota ? 'Task Saya Selesai' : 'Task Selesai'} value={stats.tasksDone} accent="bg-emerald-50 text-emerald-600" />
        <StatCard Icon={IconBell} label="Notifikasi Belum Dibaca" value={stats.unreadNotifications} accent="bg-violet-50 text-violet-600" to="/notifications" />
      </div>

      {isAnggota && stats.myTasksPending > 0 && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-sm text-blue-800">
            Anda memiliki <strong>{stats.myTasksPending}</strong> task yang belum selesai. Buka proyek → Kanban Board untuk mengunggah file progres.
          </p>
        </div>
      )}

      {(isKetua || isDosen) && (stats.pendingReviews > 0 || stats.tasksReview > 0 || stats.upcomingDeadlines > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.pendingReviews > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-700">{stats.pendingReviews}</p>
              <p className="text-xs text-amber-600 font-medium mt-0.5">Task Menunggu Review</p>
            </div>
          )}
          {stats.tasksReview > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-orange-700">{stats.tasksReview}</p>
              <p className="text-xs text-orange-600 font-medium mt-0.5">Task di Kolom Review</p>
            </div>
          )}
          {stats.upcomingDeadlines > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-700">{stats.upcomingDeadlines}</p>
              <p className="text-xs text-red-600 font-medium mt-0.5">Deadline Mendekat (2 hari)</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Aksi Cepat</h2>
          <div className="space-y-2">
            <Link
              to="/projects"
              className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-slate-50 transition-all duration-150 border border-transparent hover:border-slate-200/80 group"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <IconFolder size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Lihat Proyek</p>
                <p className="text-xs text-slate-400">{stats.activeProjects} proyek aktif</p>
              </div>
            </Link>
            {isKetua && (
              <Link
                to="/projects?tab=open"
                className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-slate-50 transition-all duration-150 border border-transparent hover:border-slate-200/80 group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <IconSearch size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Jelajahi Proyek</p>
                  <p className="text-xs text-slate-400">Klaim proyek yang tersedia</p>
                </div>
              </Link>
            )}
            {(isDosen || user?.role === ROLES.ADMIN) && (
              <>
                <Link
                  to="/projects?action=create"
                  className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-slate-50 transition-all duration-150 border border-transparent hover:border-slate-200/80 group"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <IconPlus size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Buat Proyek Baru</p>
                    <p className="text-xs text-slate-400">Buat proyek untuk mahasiswa</p>
                  </div>
                </Link>
                {isDosen && (
                  <Link
                    to="/invitations"
                    className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-slate-50 transition-all duration-150 border border-transparent hover:border-slate-200/80 group"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-violet-50 transition-colors">
                      <IconMail size={18} className="text-slate-400 group-hover:text-violet-600 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Kelola Asisten</p>
                      <p className="text-xs text-slate-400">Undang dan kelola asisten dosen</p>
                    </div>
                  </Link>
                )}
              </>
            )}
            {isAsdos && (
              <Link
                to="/invitations"
                className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-slate-50 transition-all duration-150 border border-transparent hover:border-slate-200/80 group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-violet-50 transition-colors">
                  <IconMail size={18} className="text-slate-400 group-hover:text-violet-600 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Undangan</p>
                  <p className="text-xs text-slate-400">Lihat undangan dari dosen</p>
                </div>
              </Link>
            )}
            {stats.unreadNotifications > 0 && (
              <Link
                to="/notifications"
                className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-slate-50 transition-all duration-150 border border-transparent hover:border-slate-200/80 group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-violet-50 transition-colors">
                  <IconBell size={18} className="text-slate-400 group-hover:text-violet-600 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Notifikasi</p>
                  <p className="text-xs text-slate-400">{stats.unreadNotifications} belum dibaca</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Informasi Akun</h2>
          <div className="space-y-0">
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-400">Nama</span>
              <span className="text-sm font-medium text-slate-700">{user?.fullName}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-400">Email</span>
              <span className="text-sm font-medium text-slate-700">{user?.email}</span>
            </div>
            {user?.nim && (
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-400">NIM</span>
                <span className="text-sm font-medium text-slate-700">{user.nim}</span>
              </div>
            )}
            {user?.nidn && (
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-400">NIDN</span>
                <span className="text-sm font-medium text-slate-700">{user.nidn}</span>
              </div>
            )}
            <div className="flex justify-between py-3">
              <span className="text-sm text-slate-400">Role</span>
              <span className="text-sm font-semibold text-slate-900">{ROLE_LABELS[user?.role]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
