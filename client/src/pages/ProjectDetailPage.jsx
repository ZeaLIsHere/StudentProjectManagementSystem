import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../api/axiosInstance.js';
import { ROLES, STATUS_COLORS, ROLE_LABELS } from '../utils/constants.js';
import { formatDate } from '../utils/formatDate.js';
import { IconArrowLeft, IconClipboard, IconTrendingUp, IconPlus, IconUsers, IconX, IconEye, IconShield } from '../components/common/Icons.jsx';
import Modal from '../components/common/Modal.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAssignAsdos, setShowAssignAsdos] = useState(false);
  const [memberNim, setMemberNim] = useState('');
  const [myAssistants, setMyAssistants] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.data.project);
    } catch { navigate('/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const isClaimedBy = project?.claimedBy?._id === user?._id;
  const isOwner = project?.owner?._id === user?._id;
  const isAdmin = user?.role === ROLES.ADMIN;
  const isDosen = user?.role === ROLES.DOSEN;
  const canManageMembers = isClaimedBy || isAdmin;

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post(`/projects/${id}/members`, { memberNim });
      setProject(res.data.data.project);
      toast.success('Anggota berhasil ditambahkan');
      setMemberNim('');
      setShowAddMember(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan anggota');
    } finally { setSubmitting(false); }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const res = await api.delete(`/projects/${id}/members/${memberId}`);
      setProject(res.data.data.project);
      toast.success('Anggota dihapus');
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus'); }
  };

  const openAssignAsdos = async () => {
    try {
      const res = await api.get('/projects/my-assistants');
      setMyAssistants(res.data.data.assistants);
      setShowAssignAsdos(true);
    } catch (err) {
      toast.error('Gagal memuat daftar asisten');
    }
  };

  const handleAssignAsdos = async (e) => {
    e.preventDefault();
    if (!selectedAssistant) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/projects/${id}/assistants`, { assistantId: selectedAssistant });
      setProject(res.data.data.project);
      toast.success('Asisten berhasil ditambahkan ke proyek');
      setSelectedAssistant('');
      setShowAssignAsdos(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan asisten');
    } finally { setSubmitting(false); }
  };

  const handleRemoveAsdos = async (asdosId) => {
    try {
      const res = await api.delete(`/projects/${id}/assistants/${asdosId}`);
      setProject(res.data.data.project);
      toast.success('Asisten dihapus dari proyek');
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus asisten'); }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return null;

  return (
    <div>
      <button onClick={() => navigate('/projects')} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-5 transition-colors cursor-pointer">
        <IconArrowLeft size={16} />
        <span>Kembali ke Proyek</span>
      </button>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{project.title}</h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-2xl">{project.description}</p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md text-white uppercase tracking-wider shrink-0 ml-4" style={{ backgroundColor: STATUS_COLORS[project.status] }}>{project.status}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Dosen</p>
            <p className="font-semibold text-slate-800 text-sm">{project.owner?.fullName}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Ketua</p>
            <p className="font-semibold text-slate-800 text-sm">{project.claimedBy?.fullName || '-'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Periode</p>
            <p className="font-semibold text-slate-800 text-sm">{formatDate(project.startDate)} - {formatDate(project.endDate)}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Anggota</p>
            <p className="font-semibold text-slate-800 text-sm">{project.members?.length || 0} / {project.maxMembers}</p>
          </div>
        </div>
        {project.status === 'active' && (
          <div className="mt-5 pt-5 border-t border-slate-100 flex gap-3 flex-wrap">
            <button onClick={() => navigate(`/kanban/${id}`)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-sm">
              <IconClipboard size={16} />
              Kanban Board
            </button>
            <button onClick={() => navigate(`/heatmap/${id}`)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
              <IconTrendingUp size={16} />
              Heatmap
            </button>
            {(isOwner || user?.role === ROLES.ASISTEN_DOSEN) && (
              <button onClick={() => navigate(`/monitoring/${id}`)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <IconEye size={16} />
                Monitoring
              </button>
            )}
          </div>
        )}
      </div>

      {/* Assistants section for Dosen */}
      {isOwner && isDosen && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <IconShield size={18} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Asisten Dosen</h2>
            </div>
            <button onClick={openAssignAsdos} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
              <IconPlus size={14} />
              Tambah
            </button>
          </div>
          {project.assistants?.length > 0 ? (
            <div className="space-y-2">
              {project.assistants.map((asdos) => (
                <div key={asdos._id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-violet-50 rounded-full flex items-center justify-center ring-2 ring-violet-200/60">
                      <span className="text-xs font-semibold text-violet-600">{asdos.fullName?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{asdos.fullName}</p>
                      <p className="text-xs text-slate-400">{asdos.email}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveAsdos(asdos._id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                    <IconX size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Belum ada asisten dosen yang ditambahkan</p>
          )}
        </div>
      )}

      {/* Members section */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <IconUsers size={18} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Anggota Tim</h2>
          </div>
          {canManageMembers && project.members.length < project.maxMembers && (
            <button onClick={() => setShowAddMember(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
              <IconPlus size={14} />
              Tambah
            </button>
          )}
        </div>
        <div className="space-y-2">
          {project.members?.map((member) => (
            <div key={member._id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center ring-2 ring-slate-200/60">
                  <span className="text-xs font-semibold text-slate-600">{member.fullName?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{member.fullName}</p>
                  <p className="text-xs text-slate-400">{member.nim ? `NIM: ${member.nim}` : member.email} · <span className="font-medium">{ROLE_LABELS[member.role]}</span></p>
                </div>
              </div>
              {canManageMembers && member._id !== project.claimedBy?._id && (
                <button onClick={() => handleRemoveMember(member._id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                  <IconX size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal - NIM based */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Tambah Anggota">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">NIM Mahasiswa</label>
            <input type="text" value={memberNim} onChange={(e) => setMemberNim(e.target.value)} required placeholder="Masukkan NIM mahasiswa" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 transition-shadow" />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer shadow-sm">{submitting ? 'Menambahkan...' : 'Tambah Anggota'}</button>
        </form>
      </Modal>

      {/* Assign Asdos Modal */}
      <Modal isOpen={showAssignAsdos} onClose={() => setShowAssignAsdos(false)} title="Tambah Asisten ke Proyek">
        <form onSubmit={handleAssignAsdos} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pilih Asisten Dosen</label>
            {myAssistants.length > 0 ? (
              <select value={selectedAssistant} onChange={(e) => setSelectedAssistant(e.target.value)} required className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none text-sm text-slate-800 bg-white">
                <option value="">Pilih asisten</option>
                {myAssistants
                  .filter(a => !project.assistants?.some(pa => pa._id === a._id))
                  .map(a => <option key={a._id} value={a._id}>{a.fullName} ({a.email})</option>)
                }
              </select>
            ) : (
              <p className="text-sm text-slate-400">Belum ada asisten yang terhubung. Undang asisten terlebih dahulu dari menu Undangan.</p>
            )}
          </div>
          {myAssistants.length > 0 && (
            <button type="submit" disabled={submitting} className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer shadow-sm">{submitting ? 'Menambahkan...' : 'Tambah Asisten'}</button>
          )}
        </form>
      </Modal>
    </div>
  );
}
