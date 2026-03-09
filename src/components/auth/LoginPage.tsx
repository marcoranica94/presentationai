import { Github, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const { loginWithGitHub, loading, error, clearError } = useAuthStore();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Presentation className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">PresentationAI</h1>
          <p className="text-muted-foreground">
            Genera presentazioni web interattive con l'AI
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accedi</CardTitle>
            <CardDescription>
              Usa il tuo account GitHub per accedere alla piattaforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
                <button
                  onClick={clearError}
                  className="ml-2 underline hover:no-underline"
                >
                  Chiudi
                </button>
              </div>
            )}

            <Button
              onClick={loginWithGitHub}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Github className="h-5 w-5" />
              )}
              {loading ? 'Accesso in corso...' : 'Accedi con GitHub'}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              L'accesso e' riservato agli utenti autorizzati.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
