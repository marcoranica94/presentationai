import { useState, useRef, useEffect } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';

export function AccessCodePage() {
  const { verifyAccessCode, setAccessCode, isFirstAccess, error, loading, logout, clearError } =
    useAuthStore();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setSubmitting(true);
    clearError();

    if (isFirstAccess) {
      await setAccessCode(fullCode);
    } else {
      await verifyAccessCode(fullCode);
    }

    setSubmitting(false);
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
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
              ? 'Scegli un codice a 6 cifre per proteggere il tuo account'
              : 'Inserisci il tuo codice a 6 cifre'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isFirstAccess ? 'Nuovo Codice' : 'Verifica'}
            </CardTitle>
            <CardDescription className="text-center">
              {isFirstAccess
                ? 'Questo codice sara\' richiesto ad ogni accesso'
                : 'Inserisci il codice per continuare'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center">
                {error}
              </div>
            )}

            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-14 w-12 rounded-lg border border-input bg-transparent text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ))}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={code.join('').length !== 6 || submitting || loading}
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

            <Button variant="ghost" onClick={logout} className="w-full" size="sm">
              Torna al login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
