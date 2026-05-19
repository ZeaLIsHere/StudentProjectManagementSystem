import { useState } from 'react';
import useAuth from '../hooks/useAuth.js';
import api from '../api/axiosInstance.js';
import { ROLE_LABELS } from '../utils/constants.js';
import { IconLock } from '../components/common/Icons.jsx';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { fullName, email };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const res = await api.put('/users/profile/update', payload);
      updateUser(res.data.data.user);
      toast.success('Profil berhasil diperbarui');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Profil</h1>
      <div className="bg-white rounded-xl border border-slate-200/80 p-6">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{user?.fullName?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{user?.fullName}</p>
            <span className="inline-block text-[11px] font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wider mt-1">{ROLE_LABELS[user?.role]}</span>
            {user?.nim && <p className="text-xs text-slate-400 mt-1">NIM: {user.nim}</p>}
            {user?.nidn && <p className="text-xs text-slate-400 mt-1">NIDN: {user.nidn}</p>}
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 transition-shadow" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 transition-shadow" />
          </div>

          {!showPasswordSection ? (
            <button type="button" onClick={() => setShowPasswordSection(true)} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
              <IconLock size={14} />
              <span>Ubah Password</span>
            </button>
          ) : (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ubah Password</p>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password Lama</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 transition-shadow" placeholder="Masukkan password lama" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password Baru</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 transition-shadow" placeholder="Minimal 6 karakter" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Konfirmasi Password Baru</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm text-slate-800 transition-shadow" placeholder="Ulangi password baru" />
              </div>
              <button type="button" onClick={() => { setShowPasswordSection(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">Batal ubah password</button>
            </div>
          )}

          <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer shadow-sm">{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
        </form>
      </div>
    </div>
  );
}
