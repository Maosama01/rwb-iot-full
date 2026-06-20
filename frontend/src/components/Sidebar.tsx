import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  BellRing, 
  Settings, 
  LogOut,
  Leaf,
  BarChart2,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ConfirmModal from './ConfirmModal';

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', end: true },
    { name: 'Compost', icon: Activity, path: '/dashboard/compost', end: false },
    { name: 'Analytics', icon: BarChart2, path: '/dashboard/analytics', end: false },
    { name: 'Alerts', icon: BellRing, path: '/dashboard/alerts', end: false },
    { name: 'Settings', icon: Settings, path: '/dashboard/device-settings', end: false },
  ];

  return (
    <aside className="fixed bottom-0 md:top-0 left-0 w-full md:h-screen md:w-64 bg-surface border-t md:border-r md:border-t-0 border-border flex flex-row md:flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-organic-sm z-50">
      <div className="hidden md:flex p-8 items-center gap-3">
        <div className="bg-emerald/10 p-2 rounded-xl text-emerald">
          <Leaf size={24} strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-bold text-text-primary tracking-tight">Rawbin</span>
      </div>

      <nav className="flex-1 px-2 md:px-4 py-3 md:py-0 flex flex-row md:flex-col justify-around md:justify-start gap-1 md:gap-2 md:mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-2xl font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald/10 md:bg-emerald text-emerald md:text-white shadow-none md:shadow-organic-sm'
                  : 'text-text-secondary hover:bg-background hover:text-emerald'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-[10px] md:text-base md:inline">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-2 md:p-4 md:border-t border-border flex flex-col gap-2">
        <button
          onClick={toggleTheme}
          className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 text-text-secondary hover:bg-background hover:text-emerald rounded-2xl transition-colors font-medium w-full"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span className="text-[10px] md:text-base md:inline">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 text-text-muted hover:text-alert hover:bg-alert-bg rounded-2xl transition-colors font-medium w-full"
        >
          <LogOut size={20} />
          <span className="text-[10px] md:text-base md:inline">Sign Out</span>
        </button>
      </div>

      <ConfirmModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of Rawbin?"
        confirmText="Sign Out"
      />
    </aside>
  );
};

export default Sidebar;
