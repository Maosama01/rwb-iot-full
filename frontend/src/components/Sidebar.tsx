import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  BellRing, 
  Settings, 
  LogOut,
  Leaf
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Analytics', icon: Activity, path: '/compost' },
    { name: 'Alerts', icon: BellRing, path: '/alerts' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border flex flex-col shadow-organic-sm z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="bg-emerald/10 p-2 rounded-xl text-emerald">
          <Leaf size={24} strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-bold text-text-primary tracking-tight">Rawbin</span>
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald text-white shadow-organic-sm'
                  : 'text-text-secondary hover:bg-background hover:text-emerald'
              }`
            }
          >
            <item.icon size={20} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 text-text-muted hover:text-alert hover:bg-alert-bg rounded-2xl transition-colors font-medium"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
