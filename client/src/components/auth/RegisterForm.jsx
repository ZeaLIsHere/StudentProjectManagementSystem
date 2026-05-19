import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import toast from 'react-hot-toast';

const registerRoles = [
  { value: 'dosen', label: 'Dosen' },
  { value: 'asisten-dosen', label: 'Asisten Dosen' },
  { value: 'mahasiswa-ketua', label: 'Ketua Kelompok' },
  { value: 'mahasiswa-anggota', label: 'Anggota Kelompok' },
];

export default function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [nim, setNim] = useState('');
  const [nidn, setNidn] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const isMahasiswa = role === 'mahasiswa-ketua' || role === 'mahasiswa-anggota';
  const isDosen = role === 'dosen';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      toast.error('Pilih role terlebih dahulu');
      return;
    }
    if (isMahasiswa && !nim.trim()) {
      toast.error('NIM wajib diisi untuk mahasiswa');
      return;
    }
    if (isDosen && !nidn.trim()) {
      toast.error('NIDN wajib diisi untuk dosen');
      return;
    }
    setSubmitting(true);
    try {
      const data = { fullName, email, password, role };
      if (isMahasiswa) data.nim = nim.trim();
      if (isDosen) data.nidn = nidn.trim();
      await register(data);
      toast.success('Registrasi berhasil');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registrasi gagal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Buat akun baru</h2>
        <p className="text-sm text-slate-400 mt-1">Lengkapi data berikut untuk mendaftar</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <div>
          <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Nama Lengkap
          </label>
          <input
            id="reg-name"
            name="reg-name-field"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm text-slate-800 hover:border-slate-300"
            placeholder="Nama lengkap Anda"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            id="reg-email"
            name="reg-email-field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm text-slate-800 hover:border-slate-300"
            placeholder="nama@email.com"
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            id="reg-password"
            name="reg-password-field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm text-slate-800 hover:border-slate-300"
            placeholder="Minimal 6 karakter"
          />
        </div>
        <div>
          <label htmlFor="reg-role" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Role
          </label>
          <select
            id="reg-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm text-slate-800 bg-white hover:border-slate-300"
          >
            <option value="">Pilih Role</option>
            {registerRoles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        {isMahasiswa && (
          <div>
            <label htmlFor="reg-nim" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              NIM
            </label>
            <input
              id="reg-nim"
              name="reg-nim-field"
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              required
              autoComplete="off"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm text-slate-800 hover:border-slate-300"
              placeholder="Masukkan NIM Anda"
            />
          </div>
        )}
        {isDosen && (
          <div>
            <label htmlFor="reg-nidn" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              NIDN
            </label>
            <input
              id="reg-nidn"
              name="reg-nidn-field"
              type="text"
              value={nidn}
              onChange={(e) => setNidn(e.target.value)}
              required
              autoComplete="off"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm text-slate-800 hover:border-slate-300"
              placeholder="Masukkan NIDN Anda"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          {submitting ? 'Memproses...' : 'Daftar'}
        </button>
      </form>
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-400">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-[var(--color-primary)] hover:underline font-semibold">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
