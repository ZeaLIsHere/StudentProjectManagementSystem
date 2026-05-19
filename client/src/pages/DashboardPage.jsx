import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../api/axiosInstance.js';
import { ROLES, ROLE_LABELS } from '../utils/constants.js';
import { IconFolder, IconClipboard, IconSearch, IconPlus, IconMail } from '../components/common/Icons.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

function StatCard({ Icon, label, value, accent }) {
  return (
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
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const projectRes = await api.get('/projects');
        const projects = projectRes.data.data.projects;

        let totalTasks = 0;

        for (const proj of projects) {
          try {
            const taskRes = await api.get(`/projects/${proj._id}/tasks`);
            const tasks = taskRes.data.data.tasks;
            totalTasks += tasks.length;
          } catch {}
        }

        setStats({
          projects: projects.length,
          tasks: totalTasks,
        });
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;

  const isDosen = user?.role === ROLES.DOSEN;
  const isAsdos = user?.role === ROLES.ASISTEN_DOSEN;

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard Icon={IconFolder} label="Total Proyek" value={stats.projects} accent="bg-blue-50 text-blue-600" />
        <StatCard Icon={IconClipboard} label="Total Task" value={stats.tasks} accent="bg-amber-50 text-amber-600" />
      </div>

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
                <p className="text-xs text-slate-400">Kelola semua proyek Anda</p>
              </div>
            </Link>
            {(user?.role === ROLES.MAHASISWA_KETUA) && (
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
