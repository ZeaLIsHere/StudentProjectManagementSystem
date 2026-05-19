import { Outlet } from 'react-router-dom';
import logoImg from '../assets/images/Gemini_Generated_Image_3wmn8h3wmn8h3wmn.png';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[480px] bg-[var(--color-primary)] flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-20 -left-20 w-72 h-72 border border-white/20 rounded-full" />
          <div className="absolute top-1/3 -right-16 w-56 h-56 border border-white/20 rounded-full" />
          <div className="absolute -bottom-12 left-1/4 w-40 h-40 border border-white/20 rounded-full" />
        </div>

        <div className="relative z-10">
          <img src={logoImg} alt="SPMS" className="w-12 h-12 rounded-xl object-cover mb-8" />
          <h1 className="text-3xl font-bold text-white leading-tight tracking-tight mb-3">
            Sistem Manajemen<br />Proyek Mahasiswa
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Platform kolaborasi untuk mengelola proyek akademik secara efisien dengan fitur Kanban, heatmap kontribusi, dan notifikasi real-time.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">Kanban board dengan drag & drop</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">Kolaborasi tim berbasis role</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">Heatmap kontribusi real-time</p>
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-slate-600">SPMS v1.0</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <img src={logoImg} alt="SPMS" className="w-12 h-12 mx-auto mb-4 rounded-xl object-cover" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">SPMS</h1>
            <p className="text-slate-400 text-sm mt-1">Sistem Manajemen Proyek Mahasiswa</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-200/80 p-7">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
