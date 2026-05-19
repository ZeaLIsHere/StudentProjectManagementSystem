import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth.js';
import api from '../../api/axiosInstance.js';
import { ROLES, ROLE_LABELS } from '../../utils/constants.js';
import { IconDashboard, IconFolder, IconBell, IconUser, IconSettings, IconLogout, IconX, IconMail, IconEye } from './Icons.jsx';
import logoImg from '../../assets/images/Gemini_Generated_Image_3wmn8h3wmn8h3wmn.png';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', Icon: IconDashboard, roles: null },
  { path: '/projects', label: 'Proyek', Icon: IconFolder, roles: null },
  { path: '/notifications', label: 'Notifikasi', Icon: IconBell, roles: null, hasBadge: true },
  { path: '/invitations', label: 'Undangan', Icon: IconMail, roles: [ROLES.DOSEN, ROLES.ASISTEN_DOSEN] },
  { path: '/profile', label: 'Profil', Icon: IconUser, roles: null },
  { path: '/admin/users', label: 'Kelola User', Icon: IconSettings, roles: [ROLES.ADMIN] },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.data.unreadCount);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--color-primary)] z-50 transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex flex-col`}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="SPMS" className="w-9 h-9 rounded-lg object-cover" />
              <div>
                <h2 className="font-semibold text-white text-sm tracking-tight">SPMS</h2>
                <p className="text-[11px] text-slate-400 leading-tight">Manajemen Proyek</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
              <IconX size={18} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center ring-2 ring-white/10">
              <span className="text-white text-xs font-semibold">
                {user?.fullName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
              <p className="text-[11px] text-slate-400">{ROLE_LABELS[user?.role]}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Menu</p>
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 mb-0.5 ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.Icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
                  <span className="flex-1">{item.label}</span>
                  {item.hasBadge && unreadCount > 0 && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all duration-150 w-full cursor-pointer"
          >
            <IconLogout size={18} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
