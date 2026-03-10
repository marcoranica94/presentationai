import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, ChevronUp, ChevronDown, Trash2,
  Plus, Palette, Type, BarChart2, LayoutGrid,
  AlignLeft, Bold, Italic, Underline, ImagePlus,
  Quote, ListOrdered, Minus, Check
} from 'lucide-react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import type { GeneratedContent } from '@/types';

function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date();
}

interface SectionInfo {
  index: number;
  title: string;
  bgClass: string;
}

function extractSections(html: string): SectionInfo[] {
  try {
    const parser = new DOMParser();
    const d = parser.parseFromString(html, 'text/html');
    return Array.from(d.querySelectorAll('.section')).map((sec, i) => {
      const title =
        sec.querySelector('h1,h2,h3')?.textContent?.trim().slice(0, 28) ||
        `Sezione ${i + 1}`;
      const bgClass = ['section-white','section-light','section-dark','section-highlight']
        .find(c => sec.classList.contains(c)) || 'section-dark';
      return { index: i, title, bgClass };
    });
  } catch {
    return [];
  }
}

// Inject editing capabilities into HTML before loading in iframe
function prepareEditableHtml(html: string): string {
  const editorScript = `
<style>
  .section { cursor: default; transition: outline 0.15s; }
  .section:hover { outline: 2px solid rgba(99,102,241,0.4); outline-offset: -2px; }
  .section.__sel { outline: 2px solid #6366f1 !important; outline-offset: -2px; }
  [contenteditable]:focus { outline: none; }
  [contenteditable] { caret-color: #6366f1; }
  .section.__sel [contenteditable]:hover { background: rgba(99,102,241,0.05); border-radius:4px; }
</style>
<script>
(function(){
  var EDITABLE = 'h1,h2,h3,h4,p,li,.card-title,.card-body,.stat-number,.stat-label,.stat-desc,.section-body,.priority-title,.priority-body,.info-box-title,.info-box-body,.timeline-title,.timeline-body,.contact-value,.rule-number,.rule-label,.chart-subtitle,blockquote,.hero-badge,.tag,.chapter-label';
  var selIdx = -1;
  var changeTimer;

  function makeEditable() {
    document.querySelectorAll(EDITABLE).forEach(function(el) {
      el.setAttribute('contenteditable','true');
      el.style.outline = 'none';
    });
  }

  function bindSections() {
    document.querySelectorAll('.section').forEach(function(sec, i) {
      sec.dataset.si = i;
      sec.addEventListener('click', function(e) {
        document.querySelectorAll('.section.__sel').forEach(function(s){ s.classList.remove('__sel'); });
        sec.classList.add('__sel');
        selIdx = i;
        var bgClass = ['section-white','section-light','section-dark','section-highlight'].find(function(c){ return sec.classList.contains(c); }) || 'section-dark';
        window.parent.postMessage({ type:'sectionSelected', index:i, bgClass:bgClass }, '*');
      });
    });
  }

  function sendChange() {
    document.querySelectorAll('.section.__sel').forEach(function(s){ s.classList.remove('__sel'); });
    var h = document.documentElement.outerHTML;
    window.parent.postMessage({ type:'contentChanged', html:h }, '*');
    if (selIdx >= 0) {
      var sections = document.querySelectorAll('.section');
      if (sections[selIdx]) { sections[selIdx].classList.add('__sel'); }
    }
  }

  function reinit() {
    makeEditable();
    bindSections();
    document.querySelectorAll('.section').forEach(function(sec, i){ sec.dataset.si = i; });
  }

  document.addEventListener('DOMContentLoaded', function(){
    makeEditable();
    bindSections();

    document.addEventListener('input', function(){
      clearTimeout(changeTimer);
      changeTimer = setTimeout(sendChange, 800);
    });

    window.addEventListener('message', function(e){
      var d = e.data || {};
      if (d.type === 'scrollToSection') {
        var sections = document.querySelectorAll('.section');
        if (sections[d.index]) {
          document.querySelectorAll('.section.__sel').forEach(function(s){ s.classList.remove('__sel'); });
          sections[d.index].classList.add('__sel');
          selIdx = d.index;
          sections[d.index].scrollIntoView({ behavior:'smooth', block:'start' });
        }
      }
      if (d.type === 'deleteSection') {
        var sections = document.querySelectorAll('.section');
        if (sections.length > 1 && sections[d.index]) {
          sections[d.index].remove();
          selIdx = Math.max(0, d.index - 1);
          reinit();
          sendChange();
        }
      }
      if (d.type === 'moveSectionUp') {
        var sections = document.querySelectorAll('.section');
        var i = d.index;
        if (i > 0 && sections[i] && sections[i-1]) {
          sections[i-1].before(sections[i]);
          selIdx = i - 1;
          reinit();
          sendChange();
        }
      }
      if (d.type === 'moveSectionDown') {
        var sections = document.querySelectorAll('.section');
        var i = d.index;
        if (i < sections.length - 1 && sections[i] && sections[i+1]) {
          sections[i+1].after(sections[i]);
          selIdx = i + 1;
          reinit();
          sendChange();
        }
      }
      if (d.type === 'changeSectionBg') {
        var sections = document.querySelectorAll('.section');
        if (sections[d.index]) {
          sections[d.index].classList.remove('section-white','section-light','section-dark','section-highlight');
          sections[d.index].classList.add(d.bgClass);
          sendChange();
        }
      }
      if (d.type === 'addSection') {
        var sections = document.querySelectorAll('.section');
        var ref = sections[d.afterIndex] || sections[sections.length - 1];
        var tmp = document.createElement('div');
        tmp.innerHTML = d.html;
        var newEl = tmp.firstElementChild;
        if (newEl && ref) {
          ref.after(newEl);
        } else if (newEl) {
          document.body.insertBefore(newEl, document.querySelector('script'));
        }
        selIdx = d.afterIndex + 1;
        reinit();
        sendChange();
      }
      if (d.type === 'execFormat') {
        document.execCommand(d.cmd, false, d.val || null);
        clearTimeout(changeTimer);
        changeTimer = setTimeout(sendChange, 400);
      }
      if (d.type === 'insertImage') {
        var img = document.createElement('img');
        img.src = d.src;
        img.style.cssText = 'max-width:100%;border-radius:12px;margin:16px 0;';
        var sel = window.getSelection();
        if (sel && sel.rangeCount) {
          sel.getRangeAt(0).insertNode(img);
        }
        clearTimeout(changeTimer);
        changeTimer = setTimeout(sendChange, 400);
      }
    });
  });
})();
</script>`;

  return html.replace('</body>', editorScript + '\n</body>');
}

// Section type templates
const SECTION_TEMPLATES: Record<string, { label: string; icon: React.ReactNode; html: string }> = {
  content: {
    label: 'Testo',
    icon: <AlignLeft className="h-4 w-4" />,
    html: `<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">Sezione</div>
    <h2 class="section-title">Titolo della sezione</h2>
    <p class="section-body">Inserisci qui il contenuto della sezione. Clicca per modificare il testo.</p>
    <ul class="feature-list">
      <li><strong>Punto chiave 1</strong> — Descrizione del punto.</li>
      <li><strong>Punto chiave 2</strong> — Descrizione del punto.</li>
      <li><strong>Punto chiave 3</strong> — Descrizione del punto.</li>
    </ul>
  </div>
</section>`,
  },
  stats: {
    label: 'Statistiche',
    icon: <ListOrdered className="h-4 w-4" />,
    html: `<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">Dati</div>
    <h2 class="section-title">I <span class="accent">numeri</span></h2>
    <div class="stats-grid" data-aos="zoom-in">
      <div class="stat-item"><span class="stat-number">1.234</span><div class="stat-label">Etichetta</div><div class="stat-desc">Descrizione</div></div>
      <div class="stat-item"><span class="stat-number">56%</span><div class="stat-label">Etichetta</div><div class="stat-desc">Descrizione</div></div>
      <div class="stat-item"><span class="stat-number">789</span><div class="stat-label">Etichetta</div><div class="stat-desc">Descrizione</div></div>
    </div>
  </div>
</section>`,
  },
  cards: {
    label: 'Cards',
    icon: <LayoutGrid className="h-4 w-4" />,
    html: `<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">Categoria</div>
    <h2 class="section-title">Titolo</h2>
    <div class="cards-grid">
      <div class="card" data-aos="fade-up"><span class="card-icon">💡</span><div class="card-title">Card 1</div><div class="card-body">Descrizione della prima card.</div></div>
      <div class="card" data-aos="fade-up" data-aos-delay="100"><span class="card-icon">🎯</span><div class="card-title">Card 2</div><div class="card-body">Descrizione della seconda card.</div></div>
      <div class="card" data-aos="fade-up" data-aos-delay="200"><span class="card-icon">🚀</span><div class="card-title">Card 3</div><div class="card-body">Descrizione della terza card.</div></div>
    </div>
  </div>
</section>`,
  },
  chart: {
    label: 'Grafico',
    icon: <BarChart2 className="h-4 w-4" />,
    html: `<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">Dati</div>
    <h2 class="section-title">Grafico</h2>
    <div class="chart-wrapper" data-aos="zoom-in">
      <div class="chart-subtitle">TITOLO GRAFICO</div>
      <canvas id="chart_new_${Date.now()}" height="300"></canvas>
    </div>
  </div>
</section>`,
  },
  highlight: {
    label: 'Citazione',
    icon: <Quote className="h-4 w-4" />,
    html: `<section class="section section-highlight">
  <div class="section-inner" style="text-align:center">
    <div class="chapter-label">Messaggio chiave</div>
    <blockquote>Inserisci qui una citazione o un messaggio importante.</blockquote>
  </div>
</section>`,
  },
  divider: {
    label: 'Separatore',
    icon: <Minus className="h-4 w-4" />,
    html: `<section class="section section-light" style="min-height:40vh">
  <div class="section-inner" style="text-align:center">
    <div class="chapter-label">Sezione</div>
    <h2 class="section-title">Titolo breve</h2>
    <p class="section-body">Testo introduttivo o di raccordo.</p>
  </div>
</section>`,
  },
};

const BG_OPTIONS = [
  { label: 'Bianco', value: 'section-white', color: '#ffffff' },
  { label: 'Chiaro', value: 'section-light', color: '#f5f7fa' },
  { label: 'Scuro', value: 'section-dark', color: '#0f1e35' },
  { label: 'Accento', value: 'section-highlight', color: '#6366f1' },
];

const FONTS = [
  'Plus Jakarta Sans',
  'Inter',
  'Georgia',
  'Merriweather',
  'Roboto',
  'Montserrat',
];

export function VisualEditorPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();

  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [html, setHtml] = useState('');
  const [sections, setSections] = useState<SectionInfo[]>([]);
  const [selectedSection, setSelectedSection] = useState<SectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'add' | 'style' | 'format'>('add');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const currentHtmlRef = useRef('');

  // Load content
  useEffect(() => {
    if (!contentId) return;
    getDoc(doc(db, 'generated_content', contentId))
      .then((snap) => {
        if (!snap.exists()) { setError('Documento non trovato.'); return; }
        const data = snap.data() as Record<string, unknown>;
        const gen = { id: snap.id, ...data, createdAt: toDate(data.createdAt) } as GeneratedContent;
        setContent(gen);
        setHtml(gen.htmlContent);
        currentHtmlRef.current = gen.htmlContent;
        setSections(extractSections(gen.htmlContent));
      })
      .catch(() => setError('Errore caricamento.'))
      .finally(() => setLoading(false));
  }, [contentId]);

  // Listen for iframe messages
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'sectionSelected') {
        setSelectedSection({ index: e.data.index, title: '', bgClass: e.data.bgClass });
        setRightTab('style');
      }
      if (e.data?.type === 'contentChanged') {
        const newHtml = e.data.html as string;
        currentHtmlRef.current = newHtml;
        setSections(extractSections(newHtml));
        setSaved(false);
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => autoSave(newHtml), 4000);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [contentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const autoSave = useCallback(async (newHtml: string) => {
    if (!contentId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'generated_content', contentId), {
        htmlContent: newHtml,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [contentId]);

  const handleSave = async () => {
    clearTimeout(saveTimerRef.current);
    await autoSave(currentHtmlRef.current);
  };

  const postToIframe = (msg: object) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*');
  };

  const handleSectionClick = (index: number) => {
    setSelectedSection(sections[index] ? { ...sections[index], index } : null);
    postToIframe({ type: 'scrollToSection', index });
  };

  const handleDelete = (index: number) => {
    postToIframe({ type: 'deleteSection', index });
  };

  const handleMoveUp = (index: number) => {
    postToIframe({ type: 'moveSectionUp', index });
  };

  const handleMoveDown = (index: number) => {
    postToIframe({ type: 'moveSectionDown', index });
  };

  const handleChangeBg = (bgClass: string) => {
    if (selectedSection == null) return;
    setSelectedSection(s => s ? { ...s, bgClass } : null);
    postToIframe({ type: 'changeSectionBg', index: selectedSection.index, bgClass });
  };

  const handleAddSection = (type: string) => {
    const template = SECTION_TEMPLATES[type];
    if (!template) return;
    const afterIndex = selectedSection?.index ?? sections.length - 1;
    postToIframe({ type: 'addSection', html: template.html, afterIndex });
  };

  const handleFormat = (cmd: string, val?: string) => {
    postToIframe({ type: 'execFormat', cmd, val });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      postToIframe({ type: 'insertImage', src: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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

  const editableHtml = prepareEditableHtml(html);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">

      {/* Top bar */}
      <div className="flex h-12 items-center gap-2 border-b border-border px-3 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium truncate flex-1">{content.style} · Editor Visuale</span>
        <span className="text-xs text-muted-foreground mr-2">
          {saving ? 'Salvataggio...' : saved ? '✓ Salvato' : ''}
        </span>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save className="h-3.5 w-3.5" /> Salva
        </Button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Section list */}
        <div className="w-44 shrink-0 border-r border-border bg-muted/30 overflow-y-auto flex flex-col gap-1 p-2">
          {sections.map((sec, i) => (
            <button
              key={i}
              onClick={() => handleSectionClick(i)}
              className={cn(
                'group w-full rounded-lg border px-2 py-2 text-left text-xs transition-colors',
                selectedSection?.index === i
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/30 hover:bg-muted'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-muted-foreground">{i + 1}</span>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMoveUp(i); }}
                    className="rounded p-0.5 hover:bg-primary/10"
                  ><ChevronUp className="h-3 w-3" /></button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMoveDown(i); }}
                    className="rounded p-0.5 hover:bg-primary/10"
                  ><ChevronDown className="h-3 w-3" /></button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(i); }}
                    className="rounded p-0.5 hover:bg-destructive/10 text-destructive"
                  ><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <p className="mt-1 truncate text-xs font-medium leading-tight">{sec.title}</p>
              <div className="mt-1 flex items-center gap-1">
                <span className={cn(
                  'inline-block h-2 w-2 rounded-full border',
                  sec.bgClass === 'section-white' && 'bg-white border-gray-300',
                  sec.bgClass === 'section-light' && 'bg-gray-100 border-gray-300',
                  sec.bgClass === 'section-dark'  && 'bg-slate-800 border-slate-600',
                  sec.bgClass === 'section-highlight' && 'bg-indigo-500 border-indigo-400',
                )} />
                <span className="text-muted-foreground" style={{ fontSize: '10px' }}>
                  {sec.bgClass.replace('section-', '')}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* CENTER — Iframe */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <iframe
            ref={iframeRef}
            srcDoc={editableHtml}
            className="h-full w-full border-none"
            sandbox="allow-scripts allow-same-origin"
            title="Visual Editor"
          />
        </div>

        {/* RIGHT — Tools */}
        <div className="w-64 shrink-0 border-l border-border bg-background flex flex-col overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-border">
            {([
              { id: 'add', label: 'Aggiungi', icon: <Plus className="h-3.5 w-3.5" /> },
              { id: 'style', label: 'Stile', icon: <Palette className="h-3.5 w-3.5" /> },
              { id: 'format', label: 'Testo', icon: <Type className="h-3.5 w-3.5" /> },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors border-b-2',
                  rightTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">

            {/* ADD TAB */}
            {rightTab === 'add' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  Aggiunge dopo la sezione selezionata
                </p>
                {Object.entries(SECTION_TEMPLATES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => handleAddSection(key)}
                    className="w-full flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:border-primary/40 hover:bg-muted transition-colors"
                  >
                    <span className="text-primary">{t.icon}</span>
                    <span className="font-medium">{t.label}</span>
                  </button>
                ))}

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Immagine</p>
                  <label className="w-full flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm hover:border-primary/40 hover:bg-muted transition-colors cursor-pointer">
                    <ImagePlus className="h-4 w-4 text-primary" />
                    <span className="font-medium">Inserisci immagine</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
            )}

            {/* STYLE TAB */}
            {rightTab === 'style' && (
              <div className="space-y-4">
                {selectedSection ? (
                  <>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Sezione {selectedSection.index + 1} — Sfondo
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {BG_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => handleChangeBg(opt.value)}
                            className={cn(
                              'flex items-center gap-2 rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                              selectedSection.bgClass === opt.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:border-primary/40'
                            )}
                          >
                            <span
                              className="h-4 w-4 rounded-full border border-border shrink-0"
                              style={{ background: opt.color }}
                            />
                            {opt.label}
                            {selectedSection.bgClass === opt.value && (
                              <Check className="h-3 w-3 ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Clicca una sezione nel documento per modificarne lo stile.
                  </p>
                )}
              </div>
            )}

            {/* FORMAT TAB */}
            {rightTab === 'format' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Formattazione testo</p>
                  <p className="text-xs text-muted-foreground mb-3">Seleziona del testo nel documento, poi applica la formattazione.</p>
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => handleFormat('bold')}
                      className="rounded border border-border p-2 hover:bg-muted transition-colors"
                      title="Grassetto"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleFormat('italic')}
                      className="rounded border border-border p-2 hover:bg-muted transition-colors"
                      title="Corsivo"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleFormat('underline')}
                      className="rounded border border-border p-2 hover:bg-muted transition-colors"
                      title="Sottolineato"
                    >
                      <Underline className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Dimensione testo</p>
                  <div className="flex gap-2">
                    {[
                      { label: 'S', size: '0.85em' },
                      { label: 'M', size: '1em' },
                      { label: 'L', size: '1.2em' },
                      { label: 'XL', size: '1.5em' },
                    ].map(s => (
                      <button
                        key={s.label}
                        onClick={() => handleFormat('fontSize', s.size)}
                        className="flex-1 rounded border border-border py-1.5 text-xs font-medium hover:bg-muted hover:border-primary/40 transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Font</p>
                  <div className="flex flex-col gap-1">
                    {FONTS.map(f => (
                      <button
                        key={f}
                        onClick={() => handleFormat('fontName', f)}
                        className="rounded border border-border px-3 py-1.5 text-left text-xs hover:border-primary/40 hover:bg-muted transition-colors"
                        style={{ fontFamily: f }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Allineamento</p>
                  <div className="flex gap-1">
                    {[
                      { cmd: 'justifyLeft', label: '←' },
                      { cmd: 'justifyCenter', label: '↔' },
                      { cmd: 'justifyRight', label: '→' },
                    ].map(a => (
                      <button
                        key={a.cmd}
                        onClick={() => handleFormat(a.cmd)}
                        className="flex-1 rounded border border-border py-1.5 text-sm hover:bg-muted hover:border-primary/40 transition-colors"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
