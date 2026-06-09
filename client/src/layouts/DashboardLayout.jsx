import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import usePushNotifications from '../hooks/usePushNotifications.js';
import Sidebar from '../components/common/Sidebar.jsx';
import AppBar from '../components/common/AppBar.jsx';
import OfflineBanner from '../components/common/OfflineBanner.jsx';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  usePushNotifications(user);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <AppBar onMenuClick={() => setSidebarOpen(true)} />
        <OfflineBanner />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
