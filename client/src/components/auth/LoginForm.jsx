import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Login berhasil');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Masuk ke akun Anda</h2>
        <p className="text-sm text-slate-400 mt-1">Masukkan email dan password untuk melanjutkan</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            id="login-email"
            name="login-email-field"
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
          <label htmlFor="login-password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            id="login-password"
            name="login-password-field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm text-slate-800 hover:border-slate-300"
            placeholder="Masukkan password"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          {submitting ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-400">
          Belum punya akun?{' '}
          <Link to="/register" className="text-[var(--color-primary)] hover:underline font-semibold">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
