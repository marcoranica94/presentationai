import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoginPage } from '@/components/auth/LoginPage';
import { AccessCodePage } from '@/components/auth/AccessCodePage';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { UploadPage } from '@/pages/UploadPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { GeneratePage } from '@/pages/GeneratePage';
import { ViewerPage } from '@/pages/ViewerPage';
import { EditorPage } from '@/pages/EditorPage';
import { SharePage } from '@/pages/SharePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { Spinner } from '@/components/ui/Spinner';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, user, loading, needsAccessCode } = useAuthStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!firebaseUser) return <LoginPage />;
  if (needsAccessCode) return <AccessCodePage />;
  if (!user) return <LoginPage />;

  return <>{children}</>;
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Route pubblica — nessuna autenticazione richiesta */}
        <Route path="/share/:contentId" element={<SharePage />} />

        {/* Route protette */}
        <Route path="*" element={
          <AuthGuard>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/generate/:projectId" element={<GeneratePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="/view/:contentId" element={<ViewerPage />} />
              <Route path="/edit/:contentId" element={<EditorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthGuard>
        } />
      </Routes>
    </BrowserRouter>
  );
}
