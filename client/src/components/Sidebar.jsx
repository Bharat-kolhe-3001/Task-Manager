import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  ChevronLeft, ChevronRight, LogOut, Users
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import OrbitLogo from './OrbitLogo';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Planets' },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
];

const ROLE_COLORS = {
  admin: 'bg-orbit-purple/20 text-purple-400 border-orbit-purple/30',
  ADMIN: 'bg-orbit-purple/20 text-purple-400 border-orbit-purple/30',
  member: 'bg-orbit-blue/20 text-blue-400 border-orbit-blue/30',
  MEMBER: 'bg-orbit-blue/20 text-blue-400 border-orbit-blue/30',
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <aside
      className={`relative flex flex-col h-full flex-shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
      style={{
        background: 'rgba(7,10,20,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <OrbitLogo size={32} className="flex-shrink-0" />
        {!sidebarCollapsed && (
          <span
            className="text-xl font-heading font-bold text-gradient-space"
            style={{ whiteSpace: 'nowrap' }}
          >
            Orbit
          </span>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={sidebarCollapsed ? label : undefined}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-colors"
        style={{
          background: 'rgba(17,24,39,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* User Section */}
      <div className="p-3 border-t border-white/5">
        <div
          className={`flex items-center gap-3 p-2.5 rounded-lg mb-2 ${sidebarCollapsed ? 'justify-center' : ''}`}
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orbit-blue to-orbit-purple flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`badge text-[10px] border ${ROLE_COLORS[user?.role] || ROLE_COLORS.member}`}
                  style={{ padding: '1px 6px' }}
                >
                  {user?.role?.toLowerCase() || 'member'}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          title="Logout"
          className={`btn-danger-ghost w-full text-xs ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
        >
          <LogOut size={14} />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
