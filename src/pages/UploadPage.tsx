import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { DropZone } from '@/components/upload/DropZone';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { formatBytes } from '@/lib/utils';

export function UploadPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { uploadProject, uploading, uploadProgress, error, clearError } = useProjectStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const handleFile = (file: File) => {
    clearError();
    setSelectedFile(file);
    setDone(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    const id = await uploadProject(selectedFile, user.uid);
    if (id) {
      setProjectId(id);
      setDone(true);
    }
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    return '📃';
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuovo Progetto</CardTitle>
          <CardDescription>
            Carica un documento per generare una presentazione con AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!done ? (
            <>
              <DropZone onFile={handleFile} disabled={uploading} />

              {selectedFile && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-accent/30 p-3">
                  <span className="text-2xl">{getFileIcon(selectedFile.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    disabled={uploading}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {uploadProgress < 100 ? 'Upload in corso...' : 'Analisi documento...'}
                    </span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
              )}

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? 'Elaborazione...' : 'Carica e Analizza'}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle className="h-14 w-14 text-emerald-500" />
              <div>
                <p className="text-lg font-semibold">Documento pronto!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Il documento è stato analizzato. Ora puoi generare la presentazione.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setDone(false);
                    setProjectId(null);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Carica altro
                </Button>
                <Button onClick={() => navigate(`/generate/${projectId}`)}>
                  Genera Presentazione
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
