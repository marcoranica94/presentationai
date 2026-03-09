import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Maximize2 } from 'lucide-react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { GeneratedContent } from '@/types';

function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date();
}

export function ViewerPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!contentId) return;
    getDoc(doc(db, 'generated_content', contentId))
      .then((snap) => {
        if (!snap.exists()) {
          setError('Presentazione non trovata.');
          return;
        }
        const data = snap.data() as Record<string, unknown>;
        setContent({ id: snap.id, ...data, createdAt: toDate(data.createdAt) } as GeneratedContent);
      })
      .catch(() => setError('Errore caricamento presentazione.'))
      .finally(() => setLoading(false));
  }, [contentId]);

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation-${contentId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-muted-foreground">{error ?? 'Contenuto non disponibile.'}</p>
        <Button onClick={() => navigate('/projects')} variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Torna ai Progetti
        </Button>
      </div>
    );
  }

  return (
    <div className={fullscreen ? 'fixed inset-0 z-50 bg-black' : 'flex h-full flex-col gap-3'}>
      {!fullscreen && (
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Scarica HTML
          </Button>
          <Button size="sm" onClick={() => setFullscreen(true)}>
            <Maximize2 className="h-4 w-4" />
            Fullscreen
          </Button>
        </div>
      )}

      <div className={fullscreen ? 'h-full w-full' : 'flex-1 min-h-0 rounded-xl overflow-hidden border border-border'}>
        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-50 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <iframe
          srcDoc={content.htmlContent}
          className="h-full w-full"
          style={{ minHeight: fullscreen ? '100vh' : '70vh' }}
          sandbox="allow-scripts allow-same-origin"
          title="Presentation Viewer"
        />
      </div>
    </div>
  );
}
