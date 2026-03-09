import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, ArrowLeft, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { PALETTES, STYLES, USE_CASES } from '@/types';
import type { GenerationConfig, PresentationStyle, PresentationUseCase, GeneratedContent } from '@/types';
import { GEMINI_MODELS } from '@/config/gemini';
import { cn } from '@/lib/utils';

const SLIDE_COUNTS = [6, 8, 10, 12, 15];
const DEFAULT_MODEL = 'gemini-2.0-flash';

export function GeneratePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, fetchProjects, generateHTML, generating, generatingStatus, error, generations, fetchGenerations } =
    useProjectStore();

  const project = projects.find((p) => p.id === projectId);

  const [config, setConfig] = useState<GenerationConfig>({
    style: 'modern',
    palette: 'indigo',
    slideCount: 10,
    language: 'auto',
    useCase: 'general',
    model: DEFAULT_MODEL,
  });

  const [lastGenerated, setLastGenerated] = useState<GeneratedContent | null>(null);

  useEffect(() => {
    if (user && projects.length === 0) fetchProjects(user.uid);
  }, [user, projects.length, fetchProjects]);

  useEffect(() => {
    if (projectId) fetchGenerations(projectId);
  }, [projectId, fetchGenerations]);

  const handleGenerate = async () => {
    if (!project) return;
    const result = await generateHTML(project, config);
    if (result) setLastGenerated(result);
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-muted-foreground">Caricamento progetto...</p>
      </div>
    );
  }

  const projectGenerations = generations[projectId ?? ''] ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{project.name}</h2>
          <p className="text-sm text-muted-foreground">
            {project.metadata.wordCount.toLocaleString()} parole · {project.metadata.language.toUpperCase()}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurazione Presentazione</CardTitle>
          <CardDescription>Scegli tipo, modello AI, stile, palette e numero di slide</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Use Case */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Tipologia</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(Object.keys(USE_CASES) as PresentationUseCase[]).map((uc) => (
                <button
                  key={uc}
                  onClick={() => setConfig((c) => ({ ...c, useCase: uc }))}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    config.useCase === uc
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <p className="text-base">{USE_CASES[uc].emoji}</p>
                  <p className="text-sm font-medium mt-1">{USE_CASES[uc].name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{USE_CASES[uc].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Modello AI</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(GEMINI_MODELS).map(([id, m]) => (
                <button
                  key={id}
                  onClick={() => setConfig((c) => ({ ...c, model: id }))}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                    config.model === id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">max {m.rpm}/min</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Stile</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(STYLES) as PresentationStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setConfig((c) => ({ ...c, style: s }))}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    config.style === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <p className="text-sm font-medium">{STYLES[s].name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{STYLES[s].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Palette */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Palette Colori</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PALETTES).map(([key, pal]) => (
                <button
                  key={key}
                  onClick={() => setConfig((c) => ({ ...c, palette: key }))}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                    config.palette === key
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <span className="h-4 w-4 rounded-full" style={{ background: pal.primary }} />
                  {pal.name}
                </button>
              ))}
            </div>
          </div>

          {/* Slide count */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Numero Slide</p>
            <div className="flex gap-2">
              {SLIDE_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setConfig((c) => ({ ...c, slideCount: n }))}
                  className={cn(
                    'h-9 w-12 rounded-lg border text-sm font-medium transition-colors',
                    config.slideCount === n
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Lingua</p>
            <div className="flex gap-2">
              {(['auto', 'it', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setConfig((c) => ({ ...c, language: lang }))}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    config.language === lang
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  {lang === 'auto' ? 'Auto' : lang === 'it' ? 'Italiano' : 'English'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}

          {generating ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Spinner className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">{generatingStatus}</p>
            </div>
          ) : (
            <Button onClick={handleGenerate} size="lg" className="w-full">
              <Sparkles className="h-5 w-5" />
              Genera con {GEMINI_MODELS[config.model]?.name ?? 'Gemini'}
            </Button>
          )}
        </CardContent>
      </Card>

      {lastGenerated && (
        <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="font-medium text-emerald-700 dark:text-emerald-400">Presentazione generata!</p>
              <p className="text-sm text-muted-foreground">
                {USE_CASES[lastGenerated.style as unknown as PresentationUseCase]?.emoji ?? '📊'}{' '}
                {STYLES[lastGenerated.style].name} · {PALETTES[lastGenerated.palette]?.name}
              </p>
            </div>
            <Button onClick={() => navigate(`/view/${lastGenerated.id}`)}>
              <Eye className="h-4 w-4" /> Visualizza
            </Button>
          </CardContent>
        </Card>
      )}

      {projectGenerations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Presentazioni precedenti</p>
          {projectGenerations.map((gen) => (
            <Card key={gen.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="text-sm">
                  <span className="font-medium">{STYLES[gen.style].name}</span>
                  <span className="text-muted-foreground mx-1">·</span>
                  <span className="text-muted-foreground">
                    {PALETTES[gen.palette]?.name} · {gen.slideCount} slide
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(`/view/${gen.id}`)}>
                  <Eye className="h-3.5 w-3.5" /> Apri
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
