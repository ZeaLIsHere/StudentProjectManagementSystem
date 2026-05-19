import { useState, useEffect } from 'react';
import api from '../api/axiosInstance.js';
import { ROLES, ROLE_LABELS } from '../utils/constants.js';
import { IconUsers } from '../components/common/Icons.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');

  const fetchUsers = async () => {
    try {
      const params = filterRole ? { role: filterRole } : {};
      const res = await api.get('/users', { params });
      setUsers(res.data.data.users);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [filterRole]);

  const handleToggleActive = async (id) => {
    try {
      const res = await api.put(`/users/${id}/toggle-active`);
      setUsers((prev) => prev.map((u) => u._id === id ? res.data.data.user : u));
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handlePromote = async (id) => {
    try {
      const res = await api.put(`/users/${id}/promote`);
      setUsers((prev) => prev.map((u) => u._id === id ? res.data.data.user : u));
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-6">
        <IconUsers size={22} className="text-slate-400" />
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kelola User</h1>
      </div>
      <div className="mb-4">
        <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setLoading(true); }} className="px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm outline-none text-slate-800 bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow">
          <option value="">Semua Role</option>
          {Object.entries(ROLE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/80">
              <tr>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nama</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{u.fullName}</td>
                  <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                  <td className="px-5 py-3.5"><span className="text-[11px] font-semibold px-2 py-1 bg-slate-100 rounded-md text-slate-600 uppercase tracking-wider">{ROLE_LABELS[u.role]}</span></td>
                  <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>{u.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-3">
                      <button onClick={() => handleToggleActive(u._id)} className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors">{u.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
                      {u.role === ROLES.MAHASISWA_ANGGOTA && (
                        <button onClick={() => handlePromote(u._id)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">Promosikan</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
