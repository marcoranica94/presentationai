import { useState } from 'react';
import {
  Settings, Moon, Sun, User, Sparkles, Trash2,
  Github, Key, LogOut, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';

export function SettingsPage() {
  const { theme, toggle } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { projects } = useProjectStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const totalProjects = projects.length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">

      {/* Profilo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Profilo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt={user.githubUsername} className="h-12 w-12 rounded-full" />
            )}
            <div>
              <p className="font-medium">{user?.githubUsername}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="success" className="ml-auto">Autorizzato</Badge>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm text-muted-foreground">
            <Github className="h-4 w-4 shrink-0" />
            Autenticato via GitHub OAuth
          </div>
        </CardContent>
      </Card>

      {/* Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Tema Interfaccia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Attualmente: <span className="font-medium text-foreground">{theme === 'dark' ? 'Scuro' : 'Chiaro'}</span>
            </p>
            <Button variant="outline" onClick={toggle} size="sm">
              {theme === 'dark' ? <><Sun className="h-4 w-4" /> Passa a Chiaro</> : <><Moon className="h-4 w-4" /> Passa a Scuro</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" /> AI Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Google Gemini 2.0 Flash</p>
              <p className="text-sm text-muted-foreground">Piano gratuito</p>
            </div>
            <Badge variant="success">Attivo</Badge>
          </div>
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1"><Info className="h-3 w-3" /> Limiti piano gratuito:</p>
            <p>• 15 richieste/minuto · 1 milione token/minuto</p>
            <p>• 1.500 richieste/giorno — più che sufficiente per uso personale</p>
          </div>
        </CardContent>
      </Card>

      {/* Statistiche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" /> Utilizzo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-border p-3">
              <p className="text-2xl font-bold">{totalProjects}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Progetti</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-2xl font-bold">{user?.usage.htmlGenerated ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Presentazioni AI</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sicurezza */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" /> Sicurezza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Il codice di accesso è configurato come variabile d'ambiente (<code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_ACCESS_CODE</code>).</p>
          <p>Per cambiarlo, aggiorna il valore nei GitHub Secrets e rideploya.</p>
        </CardContent>
      </Card>

      {/* Azioni account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={logout} className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" /> Esci dall'account
          </Button>

          {!confirmDelete ? (
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Elimina tutti i dati
            </Button>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-2">
              <p className="text-sm text-destructive font-medium">Sei sicuro? Questa azione è irreversibile.</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)} className="flex-1">
                  Annulla
                </Button>
                <Button size="sm" variant="destructive" className="flex-1" onClick={logout}>
                  Conferma ed esci
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
