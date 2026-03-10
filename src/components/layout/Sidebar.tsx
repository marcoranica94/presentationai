import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FolderOpen,
  Settings,
  LogOut,
  Presentation,
  BarChart2,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload',         icon: Upload,          label: 'Nuovo Progetto' },
  { to: '/projects',       icon: FolderOpen,      label: 'Progetti', badge: true },
  { to: '/presentations',  icon: BarChart2,        label: 'Presentazioni' },
  { to: '/settings',       icon: Settings,        label: 'Impostazioni' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { projects } = useProjectStore();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-accent">
          <div className="flex items-center gap-2">
            <Presentation className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">PresentationAI</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                {label}
              </span>
              {badge && projects.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-bold text-primary">
                  {projects.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="border-t border-sidebar-accent p-3">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <img
                src={user.avatarUrl}
                alt={user.githubUsername}
                className="h-8 w-8 rounded-full"
              />
              <div className="flex-1 truncate">
                <p className="text-sm font-medium truncate">{user.githubUsername}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Esci
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
