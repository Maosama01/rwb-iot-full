import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Leaf,
  BarChart2,
  Settings, 
  LogOut,
  Plus,
  Flower,
  Scale,
  LayoutDashboard,
  Bell,
  BookOpen,
  Globe,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Today', icon: LayoutDashboard, path: '/dashboard', end: true, hideOnMobile: false },
    { name: 'Batches', icon: Leaf, path: '/dashboard/compost', end: false, hideOnMobile: false },
    { name: 'Library', icon: BookOpen, path: '/dashboard/library', end: false, hideOnMobile: false },
    { name: 'My Garden', icon: Flower, path: '/dashboard/garden', end: false, hideOnMobile: true },
    { name: 'My Impact', icon: Globe, path: '/dashboard/analytics', end: false, hideOnMobile: true },
    { name: 'Alerts', icon: Bell, path: '/dashboard/alerts', end: false, hideOnMobile: true },
    { name: 'Settings', icon: Settings, path: '/dashboard/device-settings', end: false, hideOnMobile: true },
  ];

  return (
    <aside className="fixed bottom-0 md:top-0 left-0 w-full md:h-screen md:w-64 bg-transparent md:bg-cream-100 border-t-0 md:border-r border-border flex flex-col md:flex-col shadow-none md:shadow-[0_-4px_20px_rgba(139,115,85,0.05)] z-50 pointer-events-none md:pointer-events-auto">
      <div className="hidden md:flex p-8 items-center gap-3">
        <div className="bg-leaf-600 p-2.5 rounded-2xl text-white shadow-organic-sm">
          <Leaf size={24} strokeWidth={2.5} />
        </div>
        <span className="text-3xl font-serif font-bold text-compost-900 tracking-tight">Rawbin</span>
      </div>

      {/* Floating Pill on Mobile, Standard Sidebar on Desktop */}
      <nav className="flex-1 px-4 py-4 md:py-0 flex flex-row md:flex-col justify-around md:justify-start gap-1 md:gap-2 md:mt-4 pointer-events-auto bg-white/80 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none shadow-organic-lg md:shadow-none rounded-full md:rounded-none mx-4 mb-6 md:mx-0 md:mb-0 border border-white/40 md:border-none">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 p-2 md:px-5 md:py-4 rounded-full md:rounded-2xl font-medium transition-all duration-300 ease-spring ${
                isActive
                  ? 'bg-leaf-600 text-white shadow-organic-sm md:scale-105'
                  : 'text-compost-700 hover:bg-cream-50 hover:text-leaf-600'
              } ${item.hideOnMobile ? 'hidden md:flex' : 'flex'} flex-1 md:flex-none`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] md:text-base md:inline mt-0.5 md:mt-0 font-bold">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
        
        {/* Mobile menu toggle */}
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden flex-1 flex flex-col items-center justify-center gap-1 p-2 text-compost-600 hover:text-leaf-600"
          aria-label="More options menu"
        >
          <Menu size={22} strokeWidth={2} />
          <span className="text-[10px] font-bold mt-0.5">More</span>
        </button>
        
        <NavLink
          to="/dashboard/setup"
          className={({ isActive }) =>
            `hidden md:flex flex-row items-center justify-start gap-3 px-5 py-4 rounded-2xl font-bold mt-6 border-2 border-dashed transition-all duration-300 ${
              isActive
                ? 'border-leaf-600 bg-leaf-100 text-leaf-900'
                : 'border-leaf-400/50 text-leaf-600 hover:bg-leaf-100/50 hover:border-leaf-600'
            }`
          }
        >
          <div className="bg-leaf-600 text-white rounded-full p-1"><Plus size={16} /></div>
          <span>Add New Rawbin</span>
        </NavLink>
      </nav>

      {/* User Info (Desktop only) */}
      <div className="hidden md:flex flex-col gap-2 p-5 bg-white m-5 rounded-3xl shadow-sm border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-leaf-100 text-leaf-600 flex items-center justify-center font-bold text-lg">
            {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-compost-900 font-bold truncate leading-tight">{user?.display_name}</p>
            <p className="text-compost-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="flex items-center justify-center gap-2 p-2 mt-2 text-alert-dark bg-alert/5 hover:bg-alert/10 rounded-xl transition-colors font-bold w-full text-sm"
          aria-label="Sign Out"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
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

      {/* Mobile More Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-compost-900/40 z-[100] md:hidden backdrop-blur-md animate-fade-in pointer-events-auto" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute bottom-0 left-0 w-full bg-cream-50/95 backdrop-blur-2xl rounded-t-[40px] p-6 pb-24 flex flex-col gap-3 animate-slide-up-spring shadow-organic-lg border-t border-white/40" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-compost-500/20 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif font-bold text-2xl text-compost-900">More</h3>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white rounded-full text-compost-500 hover:text-compost-900 border border-border shadow-sm active:scale-95 transition-transform" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              {navItems.filter(item => item.hideOnMobile).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-5 p-5 rounded-3xl font-bold transition-all duration-300 ease-spring ${
                      isActive
                        ? 'bg-leaf-600 text-white shadow-organic-md scale-[1.02]'
                        : 'text-compost-800 bg-white/80 shadow-sm border border-white/60 hover:bg-white active:scale-95'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : 'bg-cream-100 text-leaf-600'}`}>
                        <item.icon size={24} strokeWidth={2.5} />
                      </div>
                      <span className="text-xl">{item.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowSignOutConfirm(true);
              }}
              className="flex items-center gap-5 p-5 mt-6 text-alert-dark bg-alert/10 hover:bg-alert/20 border border-alert/10 rounded-3xl transition-all duration-300 ease-spring active:scale-95 font-bold w-full"
            >
              <div className="p-2 rounded-xl bg-alert/20">
                <LogOut size={24} strokeWidth={2.5} />
              </div>
              <span className="text-xl">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
