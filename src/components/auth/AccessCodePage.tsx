import { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';

export function AccessCodePage() {
  const { verifyAccessCode, error, loading, logout, clearError } = useAuthStore();
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setSubmitting(true);
    clearError();
    await verifyAccessCode(code);
    setSubmitting(false);
    setCode('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <KeyRound className="h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Codice di Accesso</h1>
          <p className="text-muted-foreground">Inserisci il tuo codice per continuare</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Verifica</CardTitle>
            <CardDescription className="text-center">
              Inserisci il codice configurato nelle impostazioni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center">
                  {error}
                </div>
              )}

              <div className="relative">
                <Input
                  type={showCode ? 'text' : 'password'}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Inserisci il codice..."
                  autoFocus
                  autoComplete="off"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCode((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={!code || submitting || loading}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Verifica...
                  </>
                ) : (
                  'Accedi'
                )}
              </Button>

              <Button type="button" variant="ghost" onClick={logout} className="w-full" size="sm">
                Torna al login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
