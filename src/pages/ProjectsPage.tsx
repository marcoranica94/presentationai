import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Sparkles, Trash2, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { formatBytes, formatDate } from '@/lib/utils';
import type { Project } from '@/types';

const statusConfig = {
  ready:      { label: 'Pronto',      variant: 'success'  as const },
  processing: { label: 'Analisi...',  variant: 'warning'  as const },
  uploading:  { label: 'Upload...',   variant: 'info'     as const },
  error:      { label: 'Errore',      variant: 'error'    as const },
};

function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const { deleteProject } = useProjectStore();

  const status = statusConfig[project.status];

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            <p className="truncate font-medium">{project.name}</p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{formatBytes(project.originalFile.size)}</span>
          {project.metadata.wordCount > 0 && (
            <span>{project.metadata.wordCount.toLocaleString()} parole</span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(project.createdAt)}
          </span>
        </div>

        <div className="flex gap-2 mt-auto pt-1">
          <Button
            size="sm"
            disabled={project.status !== 'ready'}
            onClick={() => navigate(`/generate/${project.id}`)}
            className="flex-1"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Genera
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (confirm(`Eliminare "${project.name}"?`)) deleteProject(project);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, loading, fetchProjects } = useProjectStore();

  useEffect(() => {
    if (user) fetchProjects(user.uid);
  }, [user, fetchProjects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">I Miei Progetti ({projects.length})</h2>
        <Button size="sm" onClick={() => navigate('/upload')}>
          Nuovo Progetto
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="h-5 w-5" />
              Nessun progetto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Carica un documento per creare il tuo primo progetto.
            </p>
            <Button onClick={() => navigate('/upload')}>Carica Documento</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
