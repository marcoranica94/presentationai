import { Settings, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';

export function SettingsPage() {
  const { theme, toggle } = useThemeStore();
  const { user } = useAuthStore();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Impostazioni
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tema</p>
              <p className="text-sm text-muted-foreground">
                Scegli tra tema chiaro e scuro
              </p>
            </div>
            <Button variant="outline" onClick={toggle} className="gap-2">
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4" /> Chiaro
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" /> Scuro
                </>
              )}
            </Button>
          </div>

          <div className="border-t border-border pt-6">
            <p className="font-medium">Profilo</p>
            <div className="mt-3 space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Username:</span>{' '}
                {user?.githubUsername || '-'}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span>{' '}
                {user?.email || '-'}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <p className="font-medium">AI Provider</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Google Gemini (piano gratuito)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
