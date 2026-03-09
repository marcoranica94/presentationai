import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import {
  ArrowLeft, Save, Eye, Code2, RotateCcw,
  Maximize2, Minimize2, Check
} from 'lucide-react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useThemeStore } from '@/stores/themeStore';
import type { GeneratedContent } from '@/types';

function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date();
}

type Panel = 'split' | 'editor' | 'preview';

export function EditorPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const { theme } = useThemeStore();

  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [code, setCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [panel, setPanel] = useState<Panel>('split');
  const [previewKey, setPreviewKey] = useState<number>(0);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!contentId) return;
    getDoc(doc(db, 'generated_content', contentId))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as Record<string, unknown>;
        const gen = { id: snap.id, ...data, createdAt: toDate(data.createdAt) } as GeneratedContent;
        setContent(gen);
        setCode(gen.htmlContent);
        setOriginalCode(gen.htmlContent);
      })
      .finally(() => setLoading(false));
  }, [contentId]);

  const save = useCallback(async (htmlCode: string) => {
    if (!contentId) return;
    setSaving(true);
    await updateDoc(doc(db, 'generated_content', contentId), { htmlContent: htmlCode });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setOriginalCode(htmlCode);
  }, [contentId]);

  const handleChange = useCallback((value: string) => {
    setCode(value);
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => save(value), 4000);
  }, [save]);

  const handleSave = () => {
    clearTimeout(autoSaveTimer.current);
    save(code);
  };

  const handleReset = () => {
    if (confirm('Ripristinare la versione salvata? Le modifiche non salvate andranno perse.')) {
      setCode(originalCode);
    }
  };

  const handleRefreshPreview = () => setPreviewKey((k) => k + 1);

  const isDirty = code !== originalCode;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );

  if (!content) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-muted-foreground">Contenuto non trovato.</p>
      <Button onClick={() => navigate('/projects')} variant="outline">
        <ArrowLeft className="h-4 w-4" /> Torna ai Progetti
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/view/${contentId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm font-medium text-muted-foreground truncate max-w-40">
          {content.style} · {content.palette}
        </span>

        {isDirty && <span className="h-2 w-2 rounded-full bg-amber-400" title="Modifiche non salvate" />}

        <div className="flex-1" />

        {/* Panel toggle */}
        <div className="flex rounded-lg border border-border">
          {(['editor', 'split', 'preview'] as Panel[]).map((p) => (
            <button
              key={p}
              onClick={() => setPanel(p)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                panel === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === 'editor' ? <Code2 className="h-3.5 w-3.5" /> : p === 'preview' ? <Eye className="h-3.5 w-3.5" /> : (
                <span className="flex gap-0.5"><Code2 className="h-3.5 w-3.5" /><Eye className="h-3.5 w-3.5" /></span>
              )}
            </button>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={handleRefreshPreview} title="Aggiorna preview">
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>

        <Button variant="outline" size="sm" onClick={handleReset} disabled={!isDirty}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>

        <Button size="sm" onClick={handleSave} disabled={saving || !isDirty}>
          {saved
            ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Salvato</>
            : saving
            ? <><Spinner className="h-3.5 w-3.5" /> Salvo...</>
            : <><Save className="h-3.5 w-3.5" /> Salva</>
          }
        </Button>
      </div>

      {/* Auto-save info */}
      {isDirty && (
        <div className="shrink-0 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 text-xs text-amber-700 dark:text-amber-400">
          Salvataggio automatico tra 4 secondi — oppure clicca Salva
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Editor pane */}
        {(panel === 'editor' || panel === 'split') && (
          <div className={`flex flex-col min-h-0 overflow-hidden ${panel === 'split' ? 'w-1/2 border-r border-border' : 'flex-1'}`}>
            <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
              <Code2 className="h-3.5 w-3.5" /> HTML
            </div>
            <div className="flex-1 overflow-auto">
              <CodeMirror
                value={code}
                extensions={[html(), EditorView.lineWrapping]}
                theme={theme === 'dark' ? oneDark : undefined}
                onChange={handleChange}
                height="100%"
                style={{ fontSize: '13px', height: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Preview pane */}
        {(panel === 'preview' || panel === 'split') && (
          <div className={`flex flex-col min-h-0 ${panel === 'split' ? 'w-1/2' : 'flex-1'}`}>
            <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> Preview
              <button onClick={handleRefreshPreview} className="ml-auto hover:text-foreground">
                <Minimize2 className="h-3 w-3" />
              </button>
            </div>
            <iframe
              key={previewKey}
              srcDoc={code}
              className="flex-1 w-full"
              sandbox="allow-scripts allow-same-origin"
              title="Live Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
