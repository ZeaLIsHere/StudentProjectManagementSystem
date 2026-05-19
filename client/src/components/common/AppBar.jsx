import useAuth from '../../hooks/useAuth.js';
import { IconMenu, IconBell } from './Icons.jsx';
import { useNavigate } from 'react-router-dom';

export default function AppBar({ onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-[var(--color-primary)] border-b border-white/10 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
      >
        <IconMenu size={20} className="text-slate-400" />
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer relative"
        >
          <IconBell size={18} className="text-slate-400" />
        </button>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-semibold">
              {user?.fullName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-slate-300 hidden sm:inline">{user?.fullName}</span>
        </button>
      </div>
    </header>
  );
}
