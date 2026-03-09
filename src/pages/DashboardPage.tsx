import { Upload, FolderOpen, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const stats = [
    { label: 'Progetti', value: user?.usage.projectsCreated ?? 0, icon: FolderOpen },
    { label: 'Generazioni AI', value: user?.usage.htmlGenerated ?? 0, icon: Sparkles },
    { label: 'PDF Esportati', value: user?.usage.pdfExported ?? 0, icon: TrendingUp },
    { label: 'Pubblicati', value: user?.usage.published ?? 0, icon: Upload },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Ciao, {user?.githubUsername || 'utente'}
          </h2>
          <p className="text-muted-foreground">
            Cosa vuoi creare oggi?
          </p>
        </div>
        <Button onClick={() => navigate('/upload')}>
          <Upload className="h-4 w-4" />
          Nuovo Progetto
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inizia Subito</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <p className="text-sm text-muted-foreground">Visualizza e gestisci</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/upload')}
              className="flex flex-col items-center gap-3 rounded-xl border border-border p-6 text-center transition-colors hover:bg-accent"
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
        </CardContent>
      </Card>
    </div>
  );
}
