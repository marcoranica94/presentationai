import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FolderOpen, Sparkles, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { formatDate } from '@/lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, fetchProjects, loading } = useProjectStore();

  useEffect(() => {
    if (user) fetchProjects(user.uid);
  }, [user, fetchProjects]);

  const readyProjects = projects.filter((p) => p.status === 'ready');
  const recentProjects = projects.slice(0, 3);

  const stats = [
    { label: 'Totale Progetti', value: projects.length, icon: FolderOpen },
    { label: 'Pronti', value: readyProjects.length, icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ciao, {user?.githubUsername || 'utente'}</h2>
          <p className="text-muted-foreground">Cosa vuoi creare oggi?</p>
        </div>
        <Button onClick={() => navigate('/upload')}>
          <Upload className="h-4 w-4" />
          Nuovo Progetto
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <button
          onClick={() => navigate('/upload')}
          className="flex flex-col items-center gap-3 rounded-xl border border-border p-6 text-center transition-colors hover:bg-accent"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium">Carica Documento</p>
            <p className="text-sm text-muted-foreground">PDF, DOCX o TXT</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/projects')}
          className="flex flex-col items-center gap-3 rounded-xl border border-border p-6 text-center transition-colors hover:bg-accent"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium">I Miei Progetti</p>
            <p className="text-sm text-muted-foreground">{projects.length} documenti</p>
          </div>
        </button>

        <button
          onClick={() => readyProjects[0] && navigate(`/generate/${readyProjects[0].id}`)}
          disabled={readyProjects.length === 0}
          className="flex flex-col items-center gap-3 rounded-xl border border-border p-6 text-center transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium">Genera con AI</p>
            <p className="text-sm text-muted-foreground">Powered by Gemini</p>
          </div>
        </button>
      </div>

      {recentProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Progetti Recenti
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {recentProjects.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Badge
                    variant={
                      p.status === 'ready' ? 'success' :
                      p.status === 'error' ? 'error' : 'warning'
                    }
                  >
                    {p.status === 'ready' ? 'Pronto' : p.status === 'error' ? 'Errore' : 'In corso'}
                  </Badge>
                  {p.status === 'ready' && (
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/generate/${p.id}`)}>
                      <Sparkles className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {loading && recentProjects.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">Caricamento...</p>
      )}
    </div>
  );
}
