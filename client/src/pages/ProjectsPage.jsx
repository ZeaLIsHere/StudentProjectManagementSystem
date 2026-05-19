import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../api/axiosInstance.js';
import { ROLES, STATUS_COLORS } from '../utils/constants.js';
import { formatDate } from '../utils/formatDate.js';
import { IconPlus, IconUsers, IconCalendar } from '../components/common/Icons.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [openProjects, setOpenProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'my');
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('action') === 'create');
  const [claimTarget, setClaimTarget] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', maxMembers: 3, startDate: '', endDate: '' });
  const [submitting, setSubmitting] = useState(false);

  const canCreate = user?.role === ROLES.DOSEN || user?.role === ROLES.ADMIN;
  const isKetua = user?.role === ROLES.MAHASISWA_KETUA;

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data.projects);
      if (isKetua) {
        const openRes = await api.get('/projects/open');
        setOpenProjects(openRes.data.data.projects);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/projects', form);
      toast.success('Proyek berhasil dibuat');
      setShowCreateModal(false);
      setForm({ title: '', description: '', maxMembers: 3, startDate: '', endDate: '' });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat proyek');
    } finally { setSubmitting(false); }
  };

  const handleClaim = async () => {
    if (!claimTarget) return;
    try {
      await api.post(`/projects/${claimTarget._id}/claim`);
      toast.success('Proyek berhasil diklaim!');
      setClaimTarget(null);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengklaim proyek');
    }
  };

  if (loading) return <LoadingSpinner />;
  const displayProjects = activeTab === 'open' ? openProjects : projects;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Proyek</h1>
        {canCreate && (
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-sm">
            <IconPlus size={16} />
            Buat Proyek
          </button>
        )}
      </div>

      {isKetua && (
        <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
          {[{ key: 'my', label: 'Proyek Saya' }, { key: 'open', label: `Tersedia (${openProjects.length})` }].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 cursor-pointer ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {displayProjects.length === 0 ? (
        <EmptyState title={activeTab === 'open' ? 'Tidak ada proyek tersedia' : 'Belum ada proyek'} description="Proyek akan muncul di sini" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayProjects.map((p) => (
            <div key={p._id} className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md hover:shadow-slate-200/50 transition-all duration-200 cursor-pointer group" onClick={() => activeTab !== 'open' && navigate(`/projects/${p._id}`)}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{p.title}</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md text-white shrink-0 ml-2 uppercase tracking-wider" style={{ backgroundColor: STATUS_COLORS[p.status] }}>{p.status}</span>
              </div>
              <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">{p.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <IconCalendar size={13} className="text-slate-300" />
                  <span>{formatDate(p.startDate)} - {formatDate(p.endDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconUsers size={13} className="text-slate-300" />
                  <span>{p.members?.length || 0}/{p.maxMembers}</span>
                </div>
              </div>
              {p.owner && <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">Dosen: {p.owner.fullName}</p>}
              {activeTab === 'open' && isKetua && (
                <button onClick={(e) => { e.stopPropagation(); setClaimTarget(p); }} className="mt-4 w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-sm">Klaim Proyek</button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Buat Proyek Baru">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Judul Proyek</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 transition-shadow" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 resize-none transition-shadow" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Maks. Anggota (termasuk ketua)</label>
            <input type="number" min={2} value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: parseInt(e.target.value) })} required className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 transition-shadow" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal Mulai</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 transition-shadow" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal Selesai</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 transition-shadow" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer shadow-sm">{submitting ? 'Membuat...' : 'Buat Proyek'}</button>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!claimTarget} onClose={() => setClaimTarget(null)} onConfirm={handleClaim} title="Klaim Proyek" message={`Apakah Anda yakin ingin mengklaim proyek "${claimTarget?.title}"?`} />
    </div>
  );
}
