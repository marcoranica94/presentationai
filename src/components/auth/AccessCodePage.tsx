import { useState } from 'react';
import { KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';

const MIN_LENGTH = 4;

export function AccessCodePage() {
  const { verifyAccessCode, setAccessCode, isFirstAccess, error, loading, logout, clearError } =
    useAuthStore();
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < MIN_LENGTH) return;

    setSubmitting(true);
    clearError();

    if (isFirstAccess) {
      await setAccessCode(code);
    } else {
      await verifyAccessCode(code);
    }

    setSubmitting(false);
    setCode('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          {isFirstAccess ? (
            <ShieldCheck className="h-12 w-12 text-primary" />
          ) : (
            <KeyRound className="h-12 w-12 text-primary" />
          )}
          <h1 className="text-2xl font-bold tracking-tight">
            {isFirstAccess ? 'Imposta Codice di Accesso' : 'Codice di Accesso'}
          </h1>
          <p className="text-muted-foreground">
            {isFirstAccess
              ? 'Scegli un codice per proteggere il tuo account'
              : 'Inserisci il tuo codice per continuare'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isFirstAccess ? 'Nuovo Codice' : 'Verifica'}
            </CardTitle>
            <CardDescription className="text-center">
              {isFirstAccess
                ? `Minimo ${MIN_LENGTH} caratteri — lettere, numeri, simboli`
                : 'Inserisci il codice scelto al primo accesso'}
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
                  placeholder={isFirstAccess ? 'Scegli un codice...' : 'Inserisci il codice...'}
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

              {isFirstAccess && code.length > 0 && code.length < MIN_LENGTH && (
                <p className="text-xs text-muted-foreground">
                  Ancora {MIN_LENGTH - code.length} caratteri necessari
                </p>
              )}

              <Button
                type="submit"
                disabled={code.length < MIN_LENGTH || submitting || loading}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    {isFirstAccess ? 'Salvataggio...' : 'Verifica...'}
                  </>
                ) : isFirstAccess ? (
                  'Imposta Codice'
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
