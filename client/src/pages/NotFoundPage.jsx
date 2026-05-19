import { Link } from 'react-router-dom';
import { IconArrowLeft } from '../components/common/Icons.jsx';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-slate-200 mb-4 tracking-tighter">404</h1>
        <p className="text-base text-slate-500 mb-8">Halaman yang Anda cari tidak ditemukan</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
          <IconArrowLeft size={16} />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
