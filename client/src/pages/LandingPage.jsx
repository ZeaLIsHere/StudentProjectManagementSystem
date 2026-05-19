import { Link } from 'react-router-dom';
import logoImg from '../assets/images/Gemini_Generated_Image_3wmn8h3wmn8h3wmn.png';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-20 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="SPMS" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-base tracking-tight text-slate-900">SPMS</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#fitur" className="text-sm text-slate-400 hover:text-slate-700 transition-colors hidden sm:block">Fitur</a>
          <a href="#peran" className="text-sm text-slate-400 hover:text-slate-700 transition-colors hidden sm:block">Peran</a>
          <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Masuk</Link>
          <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">Daftar</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 lg:px-20 pt-24 lg:pt-40 pb-28 lg:pb-44 max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <h1 className="text-4xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-slate-900 mb-6">
            Kelola Proyek<br />Akademik dengan<br />Lebih Efisien
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-lg">
            Sistem manajemen proyek terintegrasi dengan Kanban board, heatmap kontribusi, dan monitoring real-time untuk dosen dan mahasiswa.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all text-sm shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/25 active:scale-[0.98]"
          >
            Mulai Sekarang
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Features */}
      <section id="fitur" className="px-6 lg:px-20 py-24 lg:py-32 max-w-7xl mx-auto">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3">Fitur Utama</p>
        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight mb-16 max-w-md">Semua yang Anda butuhkan dalam satu platform</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {[
            {
              title: 'Kanban Board',
              desc: 'Drag & drop task management dengan kolom To Do, In Progress, Review, dan Done.',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
              ),
            },
            {
              title: 'Kolaborasi Tim',
              desc: 'Empat peran berbeda dengan hak akses spesifik untuk kolaborasi yang terstruktur.',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              ),
            },
            {
              title: 'Monitoring',
              desc: 'Dosen dan Asdos dapat memantau progres, file upload, dan aktivitas tim secara detail.',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              ),
            },
            {
              title: 'Notifikasi',
              desc: 'Pemberitahuan otomatis untuk task prioritas tinggi dan deadline yang mendekat.',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              ),
            },
          ].map((f, i) => (
            <div key={i}>
              <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 mb-4">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Roles */}
      <section id="peran" className="px-6 lg:px-20 py-24 lg:py-32 max-w-7xl mx-auto">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3">Kelas Pengguna</p>
        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight mb-16 max-w-md">Setiap peran memiliki hak fungsional yang berbeda</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { role: 'Dosen', id: 'NIDN', desc: 'Menciptakan proyek, mengatur kuota anggota, memantau heatmap kontribusi, dan mengekspor laporan akhir.' },
            { role: 'Asisten Dosen', id: 'Referensi Dosen', desc: 'Super Observer untuk mengobservasi workspace kelompok mahasiswa di bawah arahan dosen.' },
            { role: 'Ketua Kelompok', id: 'NIM Mahasiswa', desc: 'Klaim proyek, delegasi task, membentuk sub-task, dan melakukan approval hasil kerja anggota.' },
            { role: 'Anggota Kelompok', id: 'NIM Mahasiswa', desc: 'Kolaborasi real-time, update kartu Kanban, upload bukti pengerjaan, dan komentar per-task.' },
          ].map((r, i) => (
            <div key={i} className="p-6 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">{r.role}</h3>
                <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{r.id}</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* CTA */}
      <section className="px-6 lg:px-20 py-24 lg:py-32 max-w-7xl mx-auto text-center">
        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight mb-4">Siap untuk memulai?</h2>
        <p className="text-sm text-slate-400 mb-10 max-w-sm mx-auto">Daftarkan akun Anda dan mulai kelola proyek akademik dengan lebih baik.</p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all text-sm shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/25 active:scale-[0.98]"
        >
          Mulai Sekarang
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-20 py-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="SPMS" className="w-6 h-6 rounded-md object-cover opacity-60" />
            <span className="text-sm text-slate-300 font-medium">SPMS v1.0</span>
          </div>
          <p className="text-xs text-slate-300">Sistem Manajemen Proyek Mahasiswa</p>
        </div>
      </footer>
    </div>
  );
}
