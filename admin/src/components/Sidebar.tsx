// admin/src/components/Sidebar.tsx
// ─────────────────────────────────
// The admin navigation rail. Reuses the dashboard's organic theme but keeps a
// simpler, desktop-first layout (operators are on a big screen). Each NavLink
// maps to a page we build in Phase 4. The active route is highlighted by
// react-router's isActive.

import {
  LayoutDashboard,
  Users,
  Cpu,
  Activity,
  Bell,
  Leaf,
  Scale,
  LogOut,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Overview', icon: LayoutDashboard, path: '/', end: true },
  { name: 'Users', icon: Users, path: '/users', end: false },
  { name: 'Devices', icon: Cpu, path: '/devices', end: false },
  { name: 'Telemetry', icon: Activity, path: '/telemetry', end: false },
  { name: 'Alerts', icon: Bell, path: '/alerts', end: false },
  { name: 'Cycles', icon: Leaf, path: '/cycles', end: false },
  { name: 'Waste', icon: Scale, path: '/waste', end: false },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-cream-100 border-r border-border flex flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 p-7">
        <div className="bg-leaf-600 p-2.5 rounded-2xl text-white shadow-organic-sm">
          <Leaf size={22} strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <span className="block text-2xl font-serif font-bold text-compost-900">
            Rawbin
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-leaf-600">
            Admin
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 flex flex-col gap-1 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 rounded-2xl font-bold transition-all duration-300 ${
                isActive
                  ? 'bg-leaf-600 text-white shadow-organic-sm'
                  : 'text-compost-700 hover:bg-cream-50 hover:text-leaf-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Operator + sign out */}
      <div className="flex flex-col gap-2 p-5 bg-white m-4 rounded-3xl shadow-sm border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-leaf-100 text-leaf-600 flex items-center justify-center font-bold text-lg">
            {user?.display_name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-compost-900 font-bold truncate leading-tight">
              {user?.display_name}
            </p>
            <p className="text-compost-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 p-2 mt-2 text-terracotta-500 bg-terracotta-500/5 hover:bg-terracotta-500/10 rounded-xl transition-colors font-bold w-full text-sm"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
