import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Download, Maximize2, FileDown,
  Share2, Copy, Check, Globe, GlobeLock, Minimize2, Code, ImageDown
} from 'lucide-react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { downloadHTML, printAsPDF } from '@/lib/exportService';
import { setContentPublic, buildShareUrl, copyToClipboard } from '@/lib/shareService';
import { exportAsInstagram } from '@/lib/instagramExport';
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
  const [isPublic, setIsPublic] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [exportingIG, setExportingIG] = useState(false);
  const [igProgress, setIgProgress] = useState('');
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentId) return;
    getDoc(doc(db, 'generated_content', contentId))
      .then((snap) => {
        if (!snap.exists()) { setError('Presentazione non trovata.'); return; }
        const data = snap.data() as Record<string, unknown>;
        const gen = { id: snap.id, ...data, createdAt: toDate(data.createdAt) } as GeneratedContent & { isPublic?: boolean };
        setContent(gen);
        setIsPublic(gen.isPublic ?? false);
      })
      .catch(() => setError('Errore caricamento.'))
      .finally(() => setLoading(false));
  }, [contentId]);

  // Close share panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShare(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filename = content ? `presentazione-${content.style}-${content.palette}` : 'presentazione';

  const handleTogglePublic = async () => {
    if (!contentId) return;
    setToggling(true);
    const next = !isPublic;
    await setContentPublic(contentId, next);
    setIsPublic(next);
    setToggling(false);
  };

  const handleCopy = async () => {
    if (!contentId) return;
    const ok = await copyToClipboard(buildShareUrl(contentId));
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleInstagramExport = async () => {
    if (!content) return;
    setExportingIG(true);
    setIgProgress('Avvio...');
    try {
      await exportAsInstagram(
        content.htmlContent,
        filename,
        (current, total, status) => setIgProgress(total > 0 ? `${current}/${total} — ${status}` : status)
      );
    } catch (err) {
      alert(String(err));
    } finally {
      setExportingIG(false);
      setIgProgress('');
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );

  if (error || !content) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-muted-foreground">{error ?? 'Contenuto non disponibile.'}</p>
      <Button onClick={() => navigate('/projects')} variant="outline">
        <ArrowLeft className="h-4 w-4" /> Torna ai Progetti
      </Button>
    </div>
  );

  return (
    <div className={fullscreen ? 'fixed inset-0 z-50 bg-black flex flex-col' : 'flex h-full flex-col gap-3'}>

      {/* Toolbar */}
      {!fullscreen && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {/* Edit */}
          <Button variant="outline" size="sm" onClick={() => navigate(`/edit/${content.id}`)}>
            <Code className="h-4 w-4" /> Modifica
          </Button>

          {/* Export */}
          <Button variant="outline" size="sm" onClick={() => downloadHTML(content.htmlContent, filename)}>
            <Download className="h-4 w-4" /> HTML
          </Button>
          <Button variant="outline" size="sm" onClick={() => printAsPDF(content.htmlContent, filename)}>
            <FileDown className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleInstagramExport} disabled={exportingIG}>
            <ImageDown className="h-4 w-4" /> {exportingIG ? igProgress : 'Instagram'}
          </Button>

          {/* Share */}
          <div className="relative" ref={shareRef}>
            <Button size="sm" onClick={() => setShowShare((v) => !v)}>
              <Share2 className="h-4 w-4" /> Condividi
            </Button>

            {showShare && (
              <div className="absolute right-0 top-full mt-2 z-30 w-80 rounded-xl border border-border bg-card p-4 shadow-lg space-y-3">
                <p className="font-medium text-sm">Condivisione</p>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    {isPublic
                      ? <Globe className="h-4 w-4 text-emerald-500" />
                      : <GlobeLock className="h-4 w-4 text-muted-foreground" />
                    }
                    <div>
                      <p className="text-sm font-medium">{isPublic ? 'Pubblica' : 'Privata'}</p>
                      <p className="text-xs text-muted-foreground">
                        {isPublic ? 'Chiunque con il link può vederla' : 'Solo tu puoi vederla'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleTogglePublic}
                    disabled={toggling}
                    className={`relative h-6 w-11 rounded-full transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-muted'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                {isPublic && (
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={buildShareUrl(content.id)}
                      className="flex-1 truncate rounded-lg border border-input bg-muted px-3 py-1.5 text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={handleCopy}>
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button size="sm" variant="ghost" onClick={() => setFullscreen(true)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Iframe */}
      <div className={fullscreen ? 'flex-1 relative' : 'flex-1 min-h-0 rounded-xl overflow-hidden border border-border'}>
        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-50 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
          >
            <Minimize2 className="h-5 w-5" />
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
