import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, Layers, Globe, GlobeLock, BarChart2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { PALETTES, STYLES, USE_CASES } from '@/types';
import type { GeneratedContent, PresentationUseCase } from '@/types';
import { formatDate } from '@/lib/utils';

function styleLabel(style: string) {
  return STYLES[style as keyof typeof STYLES]?.name ?? style;
}

function useCaseLabel(uc: string) {
  return USE_CASES[uc as PresentationUseCase]?.emoji ?? '📊';
}

function PresentationCard({
  gen,
  onDelete,
}: {
  gen: GeneratedContent;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const palette = PALETTES[gen.palette];

  return (
    <Card className="flex flex-col overflow-hidden group hover:shadow-md transition-shadow">
      {/* Colour bar */}
      <div
        className="h-1.5 w-full shrink-0"
        style={{
          background: palette
            ? `linear-gradient(90deg, ${palette.primary}, ${palette.secondary})`
            : 'hsl(var(--primary))',
        }}
      />

      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{useCaseLabel(gen.useCase ?? 'general')}</span>
            <div>
              <p className="font-semibold text-sm leading-tight">{styleLabel(gen.style)}</p>
              <p className="text-xs text-muted-foreground">{palette?.name ?? gen.palette}</p>
            </div>
          </div>
          {gen.isPublic ? (
            <Globe className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <GlobeLock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BarChart2 className="h-3 w-3" />
            {gen.slideCount} sezioni
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(gen.createdAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 mt-auto pt-1">
          <Button
            size="sm"
            className="flex-1 h-8"
            onClick={() => navigate(`/view/${gen.id}`)}
          >
            <Eye className="h-3.5 w-3.5" /> Apri
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2"
            onClick={() => navigate(`/visual-edit/${gen.id}`)}
            title="Editor visuale"
          >
            <Layers className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2"
            onClick={() => navigate(`/edit/${gen.id}`)}
            title="Editor HTML"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(gen.id)}
            title="Elimina"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PresentationsPage() {
  const { user } = useAuthStore();
  const { fetchAllGenerations, deleteGeneration } = useProjectStore();
  const [gens, setGens] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAllGenerations(user.uid).then((data) => {
      setGens(data);
      setLoading(false);
    });
  }, [user, fetchAllGenerations]);

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa presentazione?')) return;
    await deleteGeneration(id);
    setGens((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Le Mie Presentazioni
          {gens.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({gens.length})
            </span>
          )}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      ) : gens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nessuna presentazione ancora.</p>
            <p className="text-sm mt-1">Genera la prima da un progetto.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gens.map((g) => (
            <PresentationCard key={g.id} gen={g} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
