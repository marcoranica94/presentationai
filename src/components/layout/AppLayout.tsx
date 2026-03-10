import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

function getTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (pathname === '/upload') return 'Nuovo Progetto';
  if (pathname === '/projects') return 'I Miei Progetti';
  if (pathname === '/presentations') return 'Presentazioni';
  if (pathname === '/settings') return 'Impostazioni';
  if (pathname.startsWith('/generate/')) return 'Genera Presentazione';
  return 'PresentationAI';
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
