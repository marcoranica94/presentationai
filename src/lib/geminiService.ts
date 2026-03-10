import { getGeminiModel } from '@/config/gemini';
import type { GenerationConfig, PresentationUseCase } from '@/types';
import { PALETTES } from '@/types';

// Narrative arc per use case: defines chapter label vocabulary and emotional rhythm
const USE_CASE_NARRATIVE: Record<PresentationUseCase, {
  labels: string[];
  heroRole: string;
  arc: string;
  tone: string;
}> = {
  general: {
    labels: ['IL CONTESTO', 'I NUMERI', 'LA SCOPERTA', 'L\'ANALISI', 'L\'IMPATTO', 'LE PRIORITÀ', 'IL PERCORSO', 'LA RISPOSTA', 'LA VISIONE', 'IL PASSO SUCCESSIVO'],
    heroRole: 'Establish the ONE key finding that makes this document worth reading.',
    arc: 'Context → Evidence → Analysis → Priorities → Recommendations → Next Steps',
    tone: 'Authoritative, data-driven, precise. Every claim backed by a number.',
  },
  political: {
    labels: ['LA SITUAZIONE', 'I RISULTATI', 'IL CAMBIAMENTO', 'I DATI', 'LA VISIONE', 'L\'IMPEGNO', 'I PROSSIMI PASSI', 'LA CHIAMATA'],
    heroRole: 'Open with the boldest achievement or the sharpest contrast between past and future.',
    arc: 'Problem (current state) → Achievements (what changed) → Vision (what could be) → Call to Action',
    tone: 'Passionate, direct, values-driven. Use contrast: before/after, old/new, problem/solution.',
  },
  municipal: {
    labels: ['IL SERVIZIO', 'I NUMERI', 'COSA ABBIAMO FATTO', 'L\'IMPATTO', 'IL PROGETTO', 'LE FASI', 'I COSTI', 'I CONTATTI'],
    heroRole: 'State the purpose and direct benefit to citizens upfront.',
    arc: 'What it is → What was done → Impact on citizens → How to access → Contacts',
    tone: 'Clear, accessible, service-oriented. Lead with citizen benefit, not institutional process.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY SYSTEM — different per style to avoid same-every-time look
// ─────────────────────────────────────────────────────────────────────────────

interface FontSystem {
  googleFontsUrl: string;
  headingFont: string;
  bodyFont: string;
  monoFont?: string;
}

function getTypographySystem(style: string): FontSystem {
  // Each style gets a completely distinct type personality
  const systems: Record<string, FontSystem> = {
    minimal: {
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,700;0,900;1,300&family=DM+Sans:wght@300;400;500;600&display=swap",
      headingFont: "'Fraunces', Georgia, serif",
      bodyFont: "'DM Sans', system-ui, sans-serif",
    },
    professional: {
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Instrument+Sans:wght@300;400;500;600&display=swap",
      headingFont: "'Syne', sans-serif",
      bodyFont: "'Instrument Sans', sans-serif",
    },
    dark: {
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=Space+Grotesk:wght@300;400;500&display=swap",
      headingFont: "'Bricolage Grotesque', sans-serif",
      bodyFont: "'Space Grotesk', sans-serif",
    },
    vibrant: {
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;700;800;900&family=Satoshi:wght@300;400;500&display=swap",
      headingFont: "'Cabinet Grotesk', sans-serif",
      bodyFont: "'Satoshi', sans-serif",
    },
    // fallback for any other style
    default: {
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Mulish:wght@300;400;500;600&display=swap",
      headingFont: "'Playfair Display', Georgia, serif",
      bodyFont: "'Mulish', sans-serif",
    },
  };
  return systems[style] ?? systems.default;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1: DATA EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function buildExtractionPrompt(text: string): string {
  return `You are a data extraction expert. Your job is to extract EVERY piece of structured information from this document into JSON.

Be EXHAUSTIVE. Missing a number or fact means a worse presentation. Extract:
- Every number, percentage, date, monetary value
- Every list, category, classification
- Every step, phase, recommendation
- Every quote, conclusion, contact

DOCUMENT:
${text}

Return ONLY valid JSON (no markdown, no code blocks, no explanation):
{
  "title": "exact document title",
  "entity": "organization or author name",
  "doc_type": "report|plan|study|survey|census|policy|other",
  "year": "year of the document",
  "summary": "2-3 comprehensive sentences covering all key points",
  "key_stats": [
    {"value": "2.163", "unit": "alberi censiti", "context": "su tutto il territorio comunale", "icon": "park"}
  ],
  "charts_data": [
    {
      "chart_id": "species_distribution",
      "chart_type": "doughnut",
      "title": "Composizione per Specie",
      "labels": ["Tilia 31%", "Acer 20%", "Carpinus 9%"],
      "values": [31.07, 20.11, 9.2],
      "unit": "%",
      "description": "Distribution of tree species in the census",
      "axis_label": ""
    }
  ],
  "main_topics": [
    {
      "topic": "Topic heading",
      "key_points": [
        "Specific fact with number: 2.163 alberi totali",
        "Another specific fact with data"
      ]
    }
  ],
  "priority_or_risk_items": [
    {"rank": 1, "label": "Urgenza immediata", "value": 38, "percentage": 6.4, "description": "Descrizione intervento"}
  ],
  "timeline_events": [
    {"date": "2022", "event": "Descrizione dell'evento nel percorso temporale"}
  ],
  "rules_principles": [
    {"value": "Max 10%", "label": "Per singola specie", "explanation": "Regola biodiversità 10-20-30"}
  ],
  "benefits_outcomes": [
    "Benefit or outcome with specific details"
  ],
  "investment_costs": [
    {"label": "Investimento totale", "amount": "€ 46.340", "detail": "Suddiviso in fasi operative"}
  ],
  "process_steps": [
    {"step": 1, "title": "Nome della fase", "description": "Descrizione specifica della fase"}
  ],
  "contacts": {
    "entity": "Nome ente",
    "website": "",
    "email": "",
    "phone": "",
    "address": ""
  },
  "key_quotes": [
    "Exact important quote from the document"
  ],
  "tags": ["tag1", "tag2", "tag3"],
  "conclusions": [
    "Specific conclusion with data from the document"
  ],
  "additional_lists": [
    {"title": "List name", "items": ["item 1 with data", "item 2 with data"]}
  ]
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS DESIGN SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

function buildDesignSystem(
  palette: { primary: string; secondary: string; bg: string; text: string },
  style: string,
  fonts: FontSystem
): string {
  const isLight = style === 'minimal' || style === 'professional';

  const vars = isLight ? `
  --bg-base: #ffffff;
  --bg-alt: #f5f7fa;
  --bg-dark: #0f1e35;
  --text-base: #0f1e35;
  --text-muted: #5a6a7e;
  --text-on-dark: #f0f4f9;
  --text-muted-on-dark: rgba(240,244,249,0.65);
  --card-bg: color-mix(in srgb, ${palette.primary} 8%, #ffffff);
  --card-border: color-mix(in srgb, ${palette.primary} 22%, transparent);
  --card-bg-dark: rgba(255,255,255,0.07);
  --card-border-dark: rgba(255,255,255,0.12);
  --accent: ${palette.primary};
  --accent2: ${palette.secondary};
  --heading-font: ${fonts.headingFont};
  --body-font: ${fonts.bodyFont};` : `
  --bg-base: ${palette.bg};
  --bg-alt: color-mix(in srgb, ${palette.bg} 85%, ${palette.primary} 15%);
  --bg-dark: ${palette.bg};
  --text-base: ${palette.text};
  --text-muted: rgba(255,255,255,0.6);
  --text-on-dark: ${palette.text};
  --text-muted-on-dark: rgba(255,255,255,0.6);
  --card-bg: rgba(255,255,255,0.07);
  --card-border: rgba(255,255,255,0.14);
  --card-bg-dark: rgba(255,255,255,0.07);
  --card-border-dark: rgba(255,255,255,0.14);
  --accent: ${palette.primary};
  --accent2: ${palette.secondary};
  --heading-font: ${fonts.headingFont};
  --body-font: ${fonts.bodyFont};`;

  return `
:root { ${vars} }

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 16px; }
body { font-family: var(--body-font); background: var(--bg-base); color: var(--text-base); overflow-x: hidden; -webkit-font-smoothing: antialiased; }

/* ── SECTION TYPES ─────────────────────────────────── */
.section {
  display: flex; align-items: center; justify-content: center;
  padding: 80px 8%;
  position: relative; overflow: hidden;
}
.section-white { background: var(--bg-base); color: var(--text-base); }
.section-light { background: var(--bg-alt); color: var(--text-base); }
.section-dark  { background: var(--bg-dark); color: var(--text-on-dark); }

.section-white .text-muted, .section-light .text-muted { color: var(--text-muted); }
.section-dark  .text-muted { color: var(--text-muted-on-dark); }

.section-inner { width: 100%; max-width: 980px; z-index: 1; }

/* subtle bg blob */
.section::before {
  content:''; position:absolute; width:600px; height:600px; border-radius:50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent), transparent 65%);
  top:-200px; right:-200px; pointer-events:none; z-index:0;
}

/* ── CHAPTER LABEL ─────────────────────────────────── */
.chapter-label {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.72em; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--accent); margin-bottom: 14px;
}
.chapter-label::before { content:''; display:inline-block; width:20px; height:3px; background:var(--accent); border-radius:2px; }

/* ── HEADINGS ──────────────────────────────────────── */
.section-title {
  font-family: var(--heading-font);
  font-size: clamp(1.9em, 4.5vw, 3em);
  font-weight: 800; line-height: 1.1; letter-spacing: -0.02em;
  margin-bottom: 18px;
}
.section-white .section-title, .section-light .section-title { color: #0f1e35; }
.section-dark  .section-title { color: #ffffff; }
.section-title .accent { color: var(--accent); }
.section-title .gradient {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
}

.section-body {
  font-size: 1em; line-height: 1.75; max-width: 700px; margin-bottom: 32px;
}
.section-white .section-body, .section-light .section-body { color: var(--text-muted); }
.section-dark  .section-body { color: var(--text-muted-on-dark); }

/* ── HERO ──────────────────────────────────────────── */
.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  color: var(--accent); padding: 5px 14px; border-radius: 100px;
  font-size: 0.78em; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 20px;
}
.hero .section-title { font-size: clamp(2.4em, 6vw, 4em); }
.tags { display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; }
.tag {
  padding: 4px 14px; border-radius: 100px;
  font-size: 0.75em; font-weight: 600;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
}

/* ── STATS ─────────────────────────────────────────── */
.stats-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap:0; margin-top:36px; border:1px solid var(--card-border); border-radius:16px; overflow:hidden; }
.section-dark .stats-grid { border-color: var(--card-border-dark); }
.stat-item { padding:32px 20px; text-align:center; border-right:1px solid var(--card-border); position:relative; }
.section-dark .stat-item { border-color: var(--card-border-dark); }
.stat-item:last-child { border-right:none; }
.stat-number {
  font-family: var(--heading-font); font-size: clamp(2.4em,5vw,3.6em); font-weight:900; line-height:1;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  display:block; margin-bottom:8px;
}
.stat-label { font-size:0.82em; font-weight:600; }
.section-white .stat-label, .section-light .stat-label { color:#0f1e35; }
.section-dark  .stat-label { color:var(--text-on-dark); }
.stat-desc { font-size:0.75em; margin-top:4px; }
.section-white .stat-desc, .section-light .stat-desc { color:var(--text-muted); }
.section-dark  .stat-desc  { color:var(--text-muted-on-dark); }

/* ── CARDS ─────────────────────────────────────────── */
.cards-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; margin-top:32px; }
.card {
  border-radius:14px; padding:26px; transition:transform 0.25s ease, box-shadow 0.25s ease;
  position:relative; overflow:hidden;
}
.card:hover { transform:translateY(-3px); }
.card::before { content:''; position:absolute; top:0;left:0;right:0; height:3px; background:linear-gradient(90deg,var(--accent),var(--accent2)); }
.section-white .card, .section-light .card {
  background: var(--card-bg); border:1px solid var(--card-border);
  box-shadow:0 2px 12px rgba(0,0,0,0.06);
}
.section-dark .card {
  background: var(--card-bg-dark); border:1px solid var(--card-border-dark);
}
.card-icon { font-size:2em; margin-bottom:12px; display:block; }
.card-title { font-family:var(--heading-font); font-size:1em; font-weight:700; margin-bottom:8px; }
.section-white .card-title, .section-light .card-title { color:#0f1e35; }
.section-dark  .card-title { color:#ffffff; }
.card-body { font-size:0.86em; line-height:1.65; }
.section-white .card-body, .section-light .card-body { color:var(--text-muted); }
.section-dark  .card-body  { color:var(--text-muted-on-dark); }

/* ── PROCESS FLOW ──────────────────────────────────── */
.process-flow { display:flex; flex-wrap:wrap; gap:0; margin-top:32px; }
.process-step {
  flex:1; min-width:180px; padding:22px 28px 22px 36px;
  position:relative; text-align:center;
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 18px 50%);
}
.process-step:first-child { clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%); }
.process-step:last-child  { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 18px 50%); }
.section-white .process-step, .section-light .process-step { background: var(--card-bg); border:1px solid var(--card-border); }
.section-dark .process-step { background: var(--card-bg-dark); border:1px solid var(--card-border-dark); }
.process-step-icon { font-size:1.8em; margin-bottom:10px; }
.process-step-title { font-family:var(--heading-font); font-size:0.95em; font-weight:700; margin-bottom:6px; color:var(--accent); }
.process-step-body  { font-size:0.8em; line-height:1.5; }
.section-white .process-step-body, .section-light .process-step-body { color:var(--text-muted); }
.section-dark  .process-step-body  { color:var(--text-muted-on-dark); }

/* ── PRIORITY ROWS ─────────────────────────────────── */
.priority-list { margin-top:28px; display:flex; flex-direction:column; gap:10px; }
.priority-row {
  display:flex; align-items:flex-start; gap:16px; padding:16px 20px; border-radius:12px;
  border:1px solid var(--card-border);
}
.section-white .priority-row, .section-light .priority-row { background:var(--card-bg); }
.section-dark  .priority-row { background:var(--card-bg-dark); border-color:var(--card-border-dark); }
.priority-num {
  flex-shrink:0; width:36px; height:36px; border-radius:8px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  color:#fff; font-family:var(--heading-font); font-size:0.85em; font-weight:800;
  display:flex; align-items:center; justify-content:center;
}
.priority-content { flex:1; }
.priority-title { font-family:var(--heading-font); font-size:0.95em; font-weight:700; margin-bottom:4px; }
.section-white .priority-title, .section-light .priority-title { color:#0f1e35; }
.section-dark  .priority-title { color:#ffffff; }
.priority-body { font-size:0.84em; line-height:1.55; }
.section-white .priority-body, .section-light .priority-body { color:var(--text-muted); }
.section-dark  .priority-body  { color:var(--text-muted-on-dark); }
.priority-badge {
  flex-shrink:0; padding:2px 10px; border-radius:100px; font-size:0.75em; font-weight:700; align-self:center;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
}

/* ── INFO BOX ──────────────────────────────────────── */
.info-box {
  border-radius:12px; padding:20px 24px; margin:16px 0;
  border:1px solid var(--card-border); display:flex; gap:14px; align-items:flex-start;
}
.section-white .info-box, .section-light .info-box { background:var(--card-bg); }
.section-dark  .info-box { background:var(--card-bg-dark); border-color:var(--card-border-dark); }
.info-box-icon { font-size:1.4em; flex-shrink:0; margin-top:2px; }
.info-box-title { font-family:var(--heading-font); font-size:0.95em; font-weight:700; margin-bottom:6px; color:var(--accent); }
.info-box-body  { font-size:0.86em; line-height:1.6; }
.section-white .info-box-body, .section-light .info-box-body { color:var(--text-muted); }
.section-dark  .info-box-body  { color:var(--text-muted-on-dark); }

/* ── TWO COLUMN ────────────────────────────────────── */
.two-col { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:start; }
@media (max-width:768px) { .two-col { grid-template-columns:1fr; } }

/* ── FEATURE LIST ──────────────────────────────────── */
.feature-list { list-style:none; padding:0; margin-top:20px; }
.feature-list li {
  display:flex; align-items:flex-start; gap:12px; padding:12px 0;
  border-bottom:1px solid color-mix(in srgb, var(--card-border) 60%, transparent);
  font-size:0.92em; line-height:1.65;
}
.feature-list li:last-child { border-bottom:none; }
.section-white .feature-list li, .section-light .feature-list li { color:var(--text-muted); }
.section-dark  .feature-list li { color:var(--text-muted-on-dark); }
.feature-list li::before {
  content:''; flex-shrink:0; width:20px; height:20px; border-radius:50%; margin-top:2px;
  background: color-mix(in srgb, var(--accent) 15%, transparent) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E") center/12px no-repeat;
}
.feature-list li strong { font-weight:600; }
.section-white .feature-list li strong, .section-light .feature-list li strong { color:#0f1e35; }
.section-dark  .feature-list li strong { color:#ffffff; }

/* ── CHART WRAPPER ─────────────────────────────────── */
.chart-wrapper { border-radius:14px; padding:28px; margin-top:28px; }
.section-white .chart-wrapper, .section-light .chart-wrapper { background:var(--card-bg); border:1px solid var(--card-border); }
.section-dark  .chart-wrapper { background:var(--card-bg-dark); border:1px solid var(--card-border-dark); }
.chart-subtitle { font-size:0.78em; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--accent); text-align:center; margin-bottom:18px; }

/* ── HIGHLIGHT / QUOTE ─────────────────────────────── */
.section-highlight { background:linear-gradient(135deg, var(--accent), var(--accent2)) !important; }
.section-highlight::before { display:none; }
.section-highlight .section-title { color:#fff !important; }
.section-highlight .chapter-label { color:rgba(255,255,255,0.7); }
.section-highlight .chapter-label::before { background:rgba(255,255,255,0.5); }
blockquote {
  font-family:var(--heading-font); font-size:clamp(1.4em,3vw,2.2em); font-weight:700; line-height:1.35;
  color:#fff; max-width:760px; margin:0 auto; text-align:center; padding:16px 32px; position:relative;
}
blockquote::before { content:'\u201C'; font-size:4.5em; color:rgba(255,255,255,0.2); position:absolute; top:-10px; left:0; line-height:1; font-family:Georgia,serif; }

/* ── PROGRESS BAR ──────────────────────────────────── */
.progress-item { margin-bottom:18px; }
.progress-header { display:flex; justify-content:space-between; margin-bottom:7px; }
.progress-label { font-size:0.88em; font-weight:600; }
.section-white .progress-label, .section-light .progress-label { color:#0f1e35; }
.section-dark  .progress-label { color:var(--text-on-dark); }
.progress-value { font-size:0.88em; font-weight:700; color:var(--accent); }
.progress-bar { height:8px; border-radius:100px; overflow:hidden; }
.section-white .progress-bar, .section-light .progress-bar { background:color-mix(in srgb, var(--accent) 14%, transparent); }
.section-dark  .progress-bar { background:rgba(255,255,255,0.12); }
.progress-fill { height:100%; background:linear-gradient(90deg,var(--accent),var(--accent2)); border-radius:100px; transition: width 1.5s ease; }

/* ── TIMELINE ──────────────────────────────────────── */
.timeline { position:relative; padding-left:36px; margin-top:28px; }
.timeline::before { content:''; position:absolute; left:10px; top:0; bottom:0; width:2px; background:linear-gradient(to bottom,var(--accent),var(--accent2)); }
.timeline-item { position:relative; margin-bottom:32px; }
.timeline-dot { position:absolute; left:-30px; top:4px; width:14px; height:14px; border-radius:50%; background:var(--accent); border:3px solid var(--bg-base); }
.section-dark .timeline-dot { border-color:var(--bg-dark); }
.timeline-date { font-size:0.76em; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:5px; }
.timeline-title { font-family:var(--heading-font); font-size:1em; font-weight:700; margin-bottom:5px; }
.section-white .timeline-title, .section-light .timeline-title { color:#0f1e35; }
.section-dark  .timeline-title { color:#ffffff; }
.timeline-body { font-size:0.86em; line-height:1.6; }
.section-white .timeline-body, .section-light .timeline-body { color:var(--text-muted); }
.section-dark  .timeline-body  { color:var(--text-muted-on-dark); }

/* ── RULE CARDS ────────────────────────────────────── */
.rule-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:16px; margin-top:28px; }
.rule-card { border-radius:14px; padding:28px 20px; text-align:center; border:2px solid var(--accent); }
.section-white .rule-card, .section-light .rule-card { background:var(--card-bg); }
.section-dark  .rule-card { background:var(--card-bg-dark); }
.rule-number { font-family:var(--heading-font); font-size:2.8em; font-weight:900; color:var(--accent); line-height:1; margin-bottom:8px; }
.rule-label { font-size:0.84em; font-weight:600; }
.section-white .rule-label, .section-light .rule-label { color:var(--text-muted); }
.section-dark  .rule-label { color:var(--text-muted-on-dark); }
.rule-desc { font-size:0.78em; margin-top:8px; line-height:1.5; }
.section-white .rule-desc, .section-light .rule-desc { color:var(--text-muted); }
.section-dark  .rule-desc { color:var(--text-muted-on-dark); }

/* ── CTA / CONTACTS ────────────────────────────────── */
.contact-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-top:28px; }
.contact-item { border-radius:10px; padding:18px; }
.section-white .contact-item, .section-light .contact-item { background:var(--card-bg); border:1px solid var(--card-border); }
.section-dark  .contact-item { background:var(--card-bg-dark); border:1px solid var(--card-border-dark); }
.contact-type { font-size:0.72em; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:5px; }
.contact-value { font-size:0.9em; font-weight:500; }
.section-white .contact-value, .section-light .contact-value { color:#0f1e35; }
.section-dark  .contact-value { color:var(--text-on-dark); }

/* ── HORIZONTAL BAR COMPARISON ─────────────────────── */
.hbar-list { margin-top:24px; display:flex; flex-direction:column; gap:14px; }
.hbar-item { display:flex; align-items:center; gap:12px; }
.hbar-label { font-size:0.84em; font-weight:600; width:120px; flex-shrink:0; text-align:right; }
.section-white .hbar-label, .section-light .hbar-label { color:#0f1e35; }
.section-dark  .hbar-label { color:var(--text-on-dark); }
.hbar-track { flex:1; height:10px; border-radius:100px; overflow:hidden; }
.section-white .hbar-track, .section-light .hbar-track { background:color-mix(in srgb, var(--accent) 14%, transparent); }
.section-dark  .hbar-track { background:rgba(255,255,255,0.1); }
.hbar-fill { height:100%; background:linear-gradient(90deg,var(--accent),var(--accent2)); border-radius:100px; }
.hbar-value { font-size:0.82em; font-weight:700; color:var(--accent); width:60px; flex-shrink:0; }

/* ── AOS ANIMATIONS ────────────────────────────────── */
[data-aos] { opacity:0; transition:opacity 0.65s ease, transform 0.65s ease; }
[data-aos].aos-animate { opacity:1; }
[data-aos="fade-up"]    { transform:translateY(28px); }
[data-aos="fade-up"].aos-animate    { transform:translateY(0); }
[data-aos="fade-right"] { transform:translateX(-28px); }
[data-aos="fade-right"].aos-animate { transform:translateX(0); }
[data-aos="fade-left"]  { transform:translateX(28px); }
[data-aos="fade-left"].aos-animate  { transform:translateX(0); }
[data-aos="zoom-in"]    { transform:scale(0.93); }
[data-aos="zoom-in"].aos-animate    { transform:scale(1); }

/* ── RESPONSIVE ────────────────────────────────────── */
@media (max-width:768px) {
  .section { padding:80px 6%; }
  .stats-grid { grid-template-columns:repeat(2,1fr); }
  .cards-grid { grid-template-columns:1fr; }
  .process-flow { flex-direction:column; }
  .process-step { clip-path:none !important; }
}

/* ── SCROLLBAR ─────────────────────────────────────── */
::-webkit-scrollbar { width:5px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:var(--accent); border-radius:3px; }
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION PLAN
// ─────────────────────────────────────────────────────────────────────────────

// Narrative-driven section plan: each section has a PURPOSE and CONTENT TYPE
// Titles are ASSERTIONS (conclusions with data), NOT labels
function buildSectionPlan(count: number, useCase: PresentationUseCase): string {
  const narrative = USE_CASE_NARRATIVE[useCase];

  // Core narrative skeleton — always present
  const core = [
    `1. HERO
   Purpose: ${narrative.heroRole}
   Title: The single most important conclusion from the document, with the biggest number. Example: "Titolo Audace con Il Numero Più Importante"
   Content: hero-badge (entity), gradient title, 2-sentence body with 2+ key facts, tags from data
   Chapter label: [first label from the narrative arc — e.g. "LA SFIDA" or "IL PATRIMONIO"]`,

    `2. STATS GRID
   Purpose: Shock the audience with the scale of what's at stake.
   Title: Not "Numeri Chiave" — write the CONCLUSION the numbers prove. E.g.: "Un Patrimonio che Vale Più di Quanto Pensiamo"
   Content: Use ALL key_stats entries. Each stat: big gradient number + unit + 1-line context that explains WHY it matters.
   Chapter label: [narrative label for this phase, e.g. "I NUMERI CHE CONTANO"]`,

    `3. FIRST CONTENT SECTION + FEATURE LIST
   Purpose: Establish the main topic with the deepest insight from main_topics[0].
   Title: The KEY FINDING of this topic as a conclusion sentence. E.g.: "Il 31% delle Specie Domina il Verde Cittadino" — never "Analisi della Vegetazione"
   Content: two-col layout — left: assertion paragraph (2 sentences, 2+ numbers) + feature list where each bullet = BOLD FACT — explanation; right: chart OR info visual
   Chapter label: [narrative label, e.g. "LA SCOPERTA"]`,

    `4. CHART 1 (data visualization)
   Purpose: Visual proof of the most important distribution or comparison.
   Title: The insight the chart proves. E.g.: "Tre Specie Coprono il 60% del Verde — Un Rischio Sistemico" — never "Distribuzione Dati"
   Content: two-col — left: 3-5 key insight bullets from chart data; right: Chart.js canvas (doughnut or pie from charts_data[0])
   Chapter label: [e.g. "L'EVIDENZA"]`,
  ];

  const middle6: string[] = [
    `5. CARDS (3-4)
   Purpose: Break down the main topics or benefits into memorable takeaways.
   Title: The overarching conclusion they all share. E.g.: "Tre Interventi Cambieranno la Città nei Prossimi 5 Anni"
   Content: 3-4 cards, each with: icon, bold title that IS the takeaway, body with specific number + consequence
   Chapter label: [e.g. "LE SOLUZIONI" or "I BENEFICI"]`,

    `6. PRIORITY ROWS
   Purpose: Show the urgency ranking — what must happen first and why.
   Title: The stakes sentence. E.g.: "38 Alberi Rischiano di Cadere: Serve Agire Ora" — never "Analisi del Rischio"
   Content: All priority_or_risk_items — each row: rank number, bold label with count+%, description of consequence
   Chapter label: [e.g. "LE URGENZE"]`,

    `7. CHART 2 (different type from Chart 1)
   Purpose: Show a second dimension of the data — comparison, ranking, or trend.
   Title: The conclusion this chart proves. E.g.: "Le Zone Nord Concentrano il 70% degli Interventi Urgenti"
   Content: horizontal bar chart or line chart from charts_data[1] — left: analytical paragraph; right: canvas
   Chapter label: [e.g. "IL CONFRONTO"]`,

    `8. TWO-COL + INFO BOXES
   Purpose: Reveal the concrete investment and rules behind the plan.
   Title: The bottom-line takeaway. E.g.: "€ 46.340 per Salvare 2.163 Alberi: un Investimento che Si Ripaga"
   Content: left: feature list from benefits_outcomes or rules_principles; right: 2-3 info-boxes with exact investment_costs amounts
   Chapter label: [e.g. "IL PIANO"]`,

    `9. PROCESS FLOW
   Purpose: Show HOW it works — the step-by-step path to results.
   Title: The outcome of the process. E.g.: "In 4 Fasi: dal Censimento alla Città Sicura"
   Content: process-flow component with all process_steps — each step: icon, title that IS the result of that step, body with specific data
   Chapter label: [e.g. "IL METODO"]`,

    `10. TIMELINE or RULE CARDS
   Purpose: Show the historical path or the governing principles.
   Title: The meaning of the timeline or rules. E.g.: "Dal 2019 al 2024: Come è Cambiata la Città" OR "La Regola 10-20-30: Biodiversità per Legge"
   Content: timeline items from timeline_events OR rule-cards from rules_principles
   Chapter label: [e.g. "IL PERCORSO" or "LE REGOLE"]`,
  ];

  const highlight = `[N-1]. HIGHLIGHT — KEY MESSAGE MOMENT
   Purpose: The emotional peak — the ONE thing the audience must remember.
   Title: (no section title here — just the blockquote)
   Content: section-highlight (gradient bg) + blockquote with the most powerful quote from key_quotes OR a constructed summary sentence that is THE ARROW: the single key takeaway of the entire presentation
   Chapter label: "IL MESSAGGIO"`;

  const closing = `[N]. CLOSING + CONTACTS
   Purpose: Turn understanding into action — what should the audience do next?
   Title: A forward-looking call. E.g.: "Il Verde Urbano non Aspetta: Ecco i Prossimi Passi" — never just "Conclusioni"
   Content: 2-sentence summary using conclusions array (specific facts only) + contact-grid with all contacts fields
   Chapter label: [e.g. "IL PROSSIMO PASSO"]`;

  const sections: string[] = [...core];

  if (count <= 6) {
    // Squeeze: combine some sections
    sections.push(middle6[0]); // CARDS
    sections.push(middle6[1]); // PRIORITY ROWS
    sections.push(highlight.replace('[N-1]', '5'));
    sections.push(closing.replace('[N]', '6'));
  } else if (count <= 8) {
    sections.push(middle6[0]); // CARDS
    sections.push(middle6[2]); // CHART 2
    sections.push(middle6[1]); // PRIORITY ROWS
    sections.push(highlight.replace('[N-1]', '7'));
    sections.push(closing.replace('[N]', '8'));
  } else if (count <= 10) {
    sections.push(middle6[0]); // CARDS
    sections.push(middle6[1]); // PRIORITY ROWS
    sections.push(middle6[2]); // CHART 2
    sections.push(middle6[3]); // TWO-COL
    sections.push(highlight.replace('[N-1]', '9'));
    sections.push(closing.replace('[N]', '10'));
  } else if (count <= 12) {
    sections.push(middle6[0]); // CARDS
    sections.push(middle6[1]); // PRIORITY ROWS
    sections.push(middle6[2]); // CHART 2
    sections.push(middle6[3]); // TWO-COL
    sections.push(middle6[5]); // TIMELINE or RULE CARDS
    sections.push(middle6[4]); // PROCESS FLOW
    sections.push(highlight.replace('[N-1]', '11'));
    sections.push(closing.replace('[N]', '12'));
  } else {
    // 15+: use all middle sections
    sections.push(...middle6);
    // Fill remaining slots with extra content sections
    for (let i = core.length + middle6.length + 1; i <= count - 2; i++) {
      sections.push(`${i}. CONTENT SECTION — Use remaining main_topics or additional_lists not yet covered. Same rules: title = conclusion, bullets = bold fact → explanation.`);
    }
    sections.push(highlight.replace('[N-1]', `${count - 1}`));
    sections.push(closing.replace('[N]', `${count}`));
  }

  return sections.map((s, i) => (s.startsWith(`${i + 1}.`) ? s : `${i + 1}. ${s.replace(/^\[?\d+\]?\.?\s*/, '')}`)).join('\n\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2: HTML GENERATION
// ─────────────────────────────────────────────────────────────────────────────

function buildHtmlPrompt(
  text: string,
  filename: string,
  config: GenerationConfig,
  extractedData: string
): string {
  const palette = PALETTES[config.palette] ?? PALETTES['indigo'];
  const narrative = USE_CASE_NARRATIVE[config.useCase];
  const truncatedText = text.length > 30000 ? text.slice(0, 30000) + '\n[...]' : text;
  const lang = config.language === 'auto'
    ? 'same language as the document (auto-detect)'
    : config.language === 'it' ? 'Italian' : 'English';

  const fonts = getTypographySystem(config.style);
  const css = buildDesignSystem(palette, config.style, fonts);
  const isLight = config.style === 'minimal' || config.style === 'professional';
  const defaultSection = isLight ? 'section-white' : 'section-dark';

  const minCharts = config.slideCount >= 8 ? 3 : config.slideCount >= 6 ? 2 : 1;
  const labelColor = isLight ? '#0f1e35' : palette.text;
  const gridColor = isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)';
  const tickColor = isLight ? '#5a6a7e' : 'rgba(255,255,255,0.6)';

  return `You are a world-class information designer and narrative strategist.
Create a premium, data-dense scrollable HTML presentation that tells a STORY — not just displays data.
Think: award-winning annual report × Gamma.app × NYT data journalism. Real data, bold assertions, emotional arc.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD CONSTRAINTS — VIOLATION = FAILURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ SECTIONS: EXACTLY ${config.slideCount} <section class="section ..."> elements. Count before outputting.
⚠️ CHARTS: At least ${minCharts} Chart.js chart(s) using REAL numbers from extracted data.
⚠️ CONTENT: Every sentence must contain a specific fact, number, or name. ZERO filler.
⚠️ TITLES: Every section title must be a CONCLUSION/ASSERTION — never a generic label.

LANGUAGE: ${lang}
USE CASE: ${config.useCase.toUpperCase()} — Narrative tone: ${narrative.tone}
NARRATIVE ARC: ${narrative.arc}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXTRACTED DATA (USE ALL OF THIS — NONE CAN BE SKIPPED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${extractedData}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 0 — BEFORE WRITING ANY HTML, DEFINE YOUR NARRATIVE DNA:
(Think this through internally — it shapes every title and section)

THE ARROW (the one thing the audience must remember):
→ Extract the single most important conclusion from the data. Write it as: "[Entity] [verb] [specific number/outcome]."
→ This arrow will appear as the HIGHLIGHT blockquote in section N-1.

THE CONTRAST (current state vs. ideal state):
→ What is the problem or gap revealed by this document?
→ What does the future look like if the recommendations are followed?
→ Weave this contrast through the first 3 sections.

NARRATIVE LABELS (chapter-label text for each section):
→ Choose from: ${narrative.labels.map(l => `"${l}"`).join(', ')}
→ Each label must describe WHERE we are in the story, not just the data type.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TITLE RULES — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every section title (h1, h2) must be a TAKEAWAY — the conclusion of that section stated as a fact.

❌ BAD (generic labels — FORBIDDEN):
- "Numeri Chiave" / "Key Numbers"
- "Analisi del Rischio" / "Risk Analysis"
- "Distribuzione Dati" / "Data Overview"
- "Conclusioni" / "Conclusions"
- "Come Funziona" / "How It Works"

✅ GOOD (assertions with data):
- "2.163 Alberi Producono 8.500 Tonnellate di CO₂ l'Anno"
- "38 Alberi Rischiano di Cadere: Serve Intervenire Subito"
- "Il 60% del Verde È Concentrato in 3 Specie — Un Rischio Sistemico"
- "Tre Fasi per Mettere in Sicurezza la Città Entro il 2026"
- "€ 46.340 Investiti Ora Evitano Danni da Milioni"

Rule: if the title could apply to ANY document, rewrite it. Titles must be UNIQUE to this specific data.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT DENSITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ASSERTION-EVIDENCE structure for every section:
1. ASSERTION: The section title IS the conclusion (assertion). Bold, specific, with a number.
2. EVIDENCE: The body text + visual prove the assertion with supporting data.
3. FOCAL POINT: Every section has ONE dominant element the eye goes to first (huge stat, bold quote, chart).

Writing rules:
- Body text: MAX 2 sentences per paragraph. Dense with facts. Exact numbers always.
- Bullets: <strong>Bold specific fact or number</strong> — consequence or explanation.
- Stats: always show unit + context: "36,6 m²/ab — doppio della media UE"
- Cards: title = the takeaway conclusion; body = the proof with a specific number.
- FORBIDDEN phrases: "This section covers", "Overview of", "We will examine", "In questa sezione", "Come possiamo vedere"

MANDATORY DATA MAPPING:
- key_stats → STATS GRID section: ALL entries, each with gradient number + unit + context of WHY it matters
- charts_data → Chart.js: each entry gets its own chart canvas with EXACT labels and values from the JSON
- main_topics → Content sections: each key_point becomes one feature-list bullet (bold fact → explanation)
- priority_or_risk_items → PRIORITY ROWS: ALL entries with rank, count, percentage, consequence
- process_steps → PROCESS FLOW: each step title = the RESULT of that step (not just its name)
- rules_principles → RULE CARDS: value large, label below, description = why this threshold matters
- benefits_outcomes → CARDS or feature list: each as a bold outcome with a measurable number
- investment_costs → INFO BOX: exact amounts, breakdown, ROI if available
- timeline_events → TIMELINE: if ≥3 events, use them in chronological order
- key_quotes → HIGHLIGHT blockquote: use the most powerful one as THE ARROW moment
- contacts → CLOSING contact-grid: all available fields
- conclusions → CLOSING body text: 2 sentences, specific facts from conclusions array

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION PLAN (${config.slideCount} sections — each with purpose + content type)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${buildSectionPlan(config.slideCount, config.useCase)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HTML SHELL (use exactly this structure)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[DOCUMENT TITLE]</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${fonts.googleFontsUrl}" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/material-icons@1.13.12/iconfont/material-icons.min.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<style>
${css}
</style>
</head>
<body>

[YOUR ${config.slideCount} SECTIONS HERE]

<script>
document.addEventListener('DOMContentLoaded', () => {
  // Scroll animations
  const obs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('aos-animate');
  }), { threshold: 0.08 });
  document.querySelectorAll('[data-aos]').forEach(el => obs.observe(el));

  // Animate progress bars
  const barObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) {
      const fill = e.target.querySelector('.progress-fill');
      if (fill) { const w = fill.dataset.width; setTimeout(() => fill.style.width = w, 100); }
    }
  }), { threshold: 0.3 });
  document.querySelectorAll('.progress-item').forEach(el => barObs.observe(el));

  // [ALL CHART.JS INITIALIZATIONS HERE — one per charts_data entry]
});
</script>
</body>
</html>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### HERO — The hook. Opens with the biggest, boldest claim.
<section class="section ${defaultSection} hero">
  <div class="section-inner">
    <div class="hero-badge"><span class="material-icons" style="font-size:0.9em">eco</span> ENTITY NAME</div>
    <!-- Title IS the arrow — the one key message. Make it unforgettable. -->
    <h1 class="section-title"><span class="gradient">[Key insight with biggest number]</span><br>[Supporting fact or contrast]</h1>
    <p class="section-body">[2 sentences. Each sentence must contain a specific number or named fact from summary.]</p>
    <div class="tags"><span class="tag">[tag from tags array]</span><span class="tag">[tag]</span><span class="tag">[tag]</span></div>
  </div>
</section>

### STATS GRID — Scale shock. Every stat shows WHY it matters.
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL e.g. "I NUMERI CHE CAMBIANO TUTTO"]</div>
    <!-- Title = the conclusion these numbers prove together -->
    <h2 class="section-title">[Assertion title with key number] <span class="accent">[key word]</span></h2>
    <p class="section-body">[1-2 sentences: what do these numbers collectively mean? What is the implication?]</p>
    <div class="stats-grid" data-aos="zoom-in">
      <div class="stat-item">
        <span class="stat-number">2.163</span>
        <div class="stat-label">Alberi censiti</div>
        <!-- Context explains WHY this number matters — not just what it is -->
        <div class="stat-desc">36,6 m² per abitante — doppio media UE</div>
      </div>
      <!-- ONE STAT-ITEM PER key_stats ENTRY — ALL entries, no exceptions -->
    </div>
  </div>
</section>

### CHART SECTION — Visual proof of the key distribution.
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <!-- Title = the insight THIS SPECIFIC chart proves -->
    <h2 class="section-title">[What this chart reveals] <span class="accent">[key number]</span></h2>
    <div class="two-col" style="align-items:center">
      <div data-aos="fade-right">
        <!-- Assertion paragraph: state the conclusion before showing proof -->
        <p class="section-body">[2 sentences: the analytical conclusion drawn from this chart's data.]</p>
        <ul class="feature-list">
          <li><strong>[31,07%]</strong> — [Tilia spp.: specific consequence or meaning]</li>
          <li><strong>[20,11%]</strong> — [Acer spp.: specific consequence]</li>
          <!-- 3-5 bullets, each with exact chart label+value as the BOLD part -->
        </ul>
      </div>
      <div data-aos="fade-left">
        <div class="chart-wrapper">
          <div class="chart-subtitle">[CHART TITLE IN CAPS]</div>
          <canvas id="chart1" height="280"></canvas>
        </div>
      </div>
    </div>
  </div>
</section>

### CARDS — Break down complex info into memorable takeaways.
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <!-- Title = the overarching conclusion all cards together prove -->
    <h2 class="section-title">[What these N things share as a conclusion] <span class="accent">[key word]</span></h2>
    <div class="cards-grid">
      <div class="card" data-aos="fade-up" data-aos-delay="0">
        <span class="card-icon"><span class="material-icons" style="color:var(--accent)">eco</span></span>
        <!-- Card title = the takeaway of THIS specific card -->
        <div class="card-title">[Specific takeaway: what this one does or means]</div>
        <div class="card-body"><strong>[Exact number or fact]</strong> — [consequence or why it matters].</div>
      </div>
      <!-- 3-4 cards total -->
    </div>
  </div>
</section>

### PRIORITY ROWS — Urgency ranking. Every row: what, how many, why urgent.
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL e.g. "LE URGENZE"]</div>
    <!-- Title = the stakes: what happens if we don't act -->
    <h2 class="section-title">[N items at risk + consequence if ignored] <span class="accent">[key word]</span></h2>
    <p class="section-body">[What is the classification system? What do these categories mean for action?]</p>
    <div class="priority-list">
      <div class="priority-row" data-aos="fade-up" data-aos-delay="0">
        <div class="priority-num">1</div>
        <div class="priority-content">
          <!-- Title = label from data; body = count + % + specific consequence -->
          <div class="priority-title">[priority label]</div>
          <div class="priority-body"><strong>[count] ([percentage]%)</strong> — [what this means in practice].</div>
        </div>
        <div class="priority-badge">[percentage]%</div>
      </div>
      <!-- ONE ROW PER priority_or_risk_items ENTRY — ALL entries -->
    </div>
  </div>
</section>

### PROCESS FLOW — The path to results. Each step title = its outcome.
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL e.g. "IL METODO"]</div>
    <!-- Title = the final outcome the whole process leads to -->
    <h2 class="section-title">[What the process achieves in total] <span class="accent">[key outcome]</span></h2>
    <div class="process-flow" data-aos="fade-up">
      <div class="process-step">
        <div class="process-step-icon">🔍</div>
        <!-- Step title = what is ACHIEVED in this step, not just its name -->
        <div class="process-step-title">[Outcome of this step]</div>
        <div class="process-step-body">[Specific description: what happens, who does it, what data is produced.]</div>
      </div>
      <!-- one step per process_steps entry -->
    </div>
  </div>
</section>

### TWO-COL + INFO BOXES — Investment and rules side by side.
<section class="section section-dark">
  <div class="section-inner">
    <div class="two-col">
      <div data-aos="fade-right">
        <div class="chapter-label">[NARRATIVE LABEL]</div>
        <!-- Title = the bottom-line conclusion -->
        <h2 class="section-title">[Conclusion about investment or rules] <span class="accent">[number or key word]</span></h2>
        <ul class="feature-list">
          <li><strong>[Specific benefit or rule value]</strong> — [why it matters, consequence]</li>
          <!-- 4-5 bullets from benefits_outcomes or rules_principles -->
        </ul>
      </div>
      <div data-aos="fade-left">
        <!-- One info-box per investment_costs entry -->
        <div class="info-box">
          <div class="info-box-icon">💰</div>
          <div>
            <div class="info-box-title">[Investment label]</div>
            <div class="info-box-body"><strong>[exact amount]</strong> — [what this covers, ROI if available].</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

### RULE CARDS — Each rule as a bold number/value + why it exists.
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <h2 class="section-title">[The principle these rules enforce — as a conclusion] <span class="accent">[key number]</span></h2>
    <p class="section-body">[Why these thresholds exist: what risk do they prevent?]</p>
    <div class="rule-grid" data-aos="zoom-in">
      <div class="rule-card">
        <div class="rule-number">[value from rules_principles]</div>
        <div class="rule-label">[label]</div>
        <div class="rule-desc">[explanation: what happens if this is violated?]</div>
      </div>
      <!-- one card per rules_principles entry -->
    </div>
  </div>
</section>

### TIMELINE — The historical arc. Each event = a turning point.
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL e.g. "IL PERCORSO"]</div>
    <!-- Title = what the full timeline collectively shows -->
    <h2 class="section-title">[What changed from start to end of timeline] <span class="accent">[year range]</span></h2>
    <div class="timeline">
      <div class="timeline-item" data-aos="fade-up">
        <div class="timeline-dot"></div>
        <div class="timeline-date">[date]</div>
        <!-- Event title = why this moment mattered -->
        <div class="timeline-title">[Significance of this event — not just its name]</div>
        <div class="timeline-body">[What specifically happened, what changed, any numbers involved.]</div>
      </div>
      <!-- one item per timeline_events entry -->
    </div>
  </div>
</section>

### HIGHLIGHT — The emotional peak. THE ARROW moment.
<section class="section section-highlight">
  <div class="section-inner" style="text-align:center">
    <div class="chapter-label" style="color:rgba(255,255,255,0.7)">IL MESSAGGIO</div>
    <!-- This IS the arrow — the single most important takeaway of the whole presentation -->
    <!-- Use best key_quote OR construct: "[Entity] [verb] [specific outcome] — [implication for the audience]" -->
    <blockquote>[The arrow: the one sentence the audience will remember. Specific. Bold. With a number if possible.]</blockquote>
  </div>
</section>

### CLOSING — Forward-looking. What should happen next?
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL e.g. "IL PASSO SUCCESSIVO"]</div>
    <!-- Title = what needs to happen NOW — forward-looking, action-oriented -->
    <h2 class="section-title">[Call to action or next-step conclusion — never just "Conclusioni"] <span class="accent">[key word]</span></h2>
    <!-- 2 sentences using conclusions array — specific facts that prove why action is needed now -->
    <p class="section-body">[Conclusion sentence 1 with specific number]. [Conclusion sentence 2 with specific outcome or deadline].</p>
    <div class="contact-grid" data-aos="fade-up">
      <div class="contact-item"><div class="contact-type">Ente</div><div class="contact-value">[contacts.entity]</div></div>
      <!-- one item per contacts field that has a value -->
    </div>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHART.JS INITIALIZATION TEMPLATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Doughnut/Pie — use EXACT labels and values from charts_data JSON
new Chart(document.getElementById('chart1'), {
  type: 'doughnut',
  data: {
    labels: [/* exact labels from charts_data[0].labels */],
    datasets: [{ data: [/* exact values from charts_data[0].values */], backgroundColor: ['${palette.primary}', '${palette.secondary}', '${palette.primary}99', '${palette.secondary}66', '${palette.primary}44', '${palette.secondary}33'], borderWidth: 0, hoverOffset: 8 }]
  },
  options: { responsive: true, cutout: '60%', plugins: { legend: { position: 'right', labels: { color: '${labelColor}', font: { size: 11 }, padding: 14, boxWidth: 10, borderRadius: 3 } } } }
});

// Horizontal Bar — for rankings, comparisons
new Chart(document.getElementById('chart2'), {
  type: 'bar',
  data: { labels: [/* exact labels */], datasets: [{ data: [/* exact values */], backgroundColor: '${palette.primary}cc', borderRadius: 6, borderSkipped: false }] },
  options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '${tickColor}' }, grid: { color: '${gridColor}' } }, y: { ticks: { color: '${tickColor}' }, grid: { display: false } } } }
});

// Vertical Bar — for time series or category comparison
new Chart(document.getElementById('chart3'), {
  type: 'bar',
  data: { labels: [/* labels */], datasets: [{ data: [/* values */], backgroundColor: '${palette.primary}cc', borderRadius: 8, borderSkipped: false }] },
  options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '${tickColor}' }, grid: { color: '${gridColor}' } }, x: { ticks: { color: '${tickColor}' }, grid: { display: false } } } }
});

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORIGINAL DOCUMENT (additional context and exact quotes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Filename: ${filename}
${truncatedText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL SELF-CHECK — verify before outputting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Count <section class="section ..."> elements → EXACTLY ${config.slideCount}? ✓
2. Every section title is a CONCLUSION/ASSERTION with a specific fact or number? ✓ (no generic labels)
3. Every key_stats entry appears in the STATS GRID? ✓
4. Every charts_data entry has a Chart.js canvas + init? ✓ (at least ${minCharts})
5. Every priority_or_risk_item appears in PRIORITY ROWS with count + percentage? ✓
6. HIGHLIGHT section contains THE ARROW — the single most important takeaway? ✓
7. CLOSING title is forward-looking and action-oriented (not "Conclusioni")? ✓
8. Zero filler sentences — every line contains a specific fact? ✓

OUTPUT: Return ONLY raw HTML. No markdown, no backticks, no explanation. Start with <!DOCTYPE html>.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePresentation(
  text: string,
  filename: string,
  config: GenerationConfig,
  onProgress?: (status: string) => void
): Promise<string> {
  const model = getGeminiModel(config.model || 'gemini-2.0-flash');
  const truncatedText = text.length > 40000 ? text.slice(0, 40000) + '\n[...]' : text;

  // ── Phase 1: Extract structured data ──────────────────────────────────────
  onProgress?.('Analisi del documento in corso...');
  const extractionPrompt = buildExtractionPrompt(truncatedText);
  let extractedData = '';
  try {
    const extractResult = await model.generateContent(extractionPrompt);
    extractedData = extractResult.response.text().trim();
    // Strip markdown code blocks if present
    extractedData = extractedData
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  } catch (err) {
    // If extraction fails, continue with empty extracted data
    onProgress?.('Estrazione dati parziale, continuo...');
    extractedData = '{}';
  }

  // ── Phase 2: Generate HTML ─────────────────────────────────────────────────
  onProgress?.(`Generazione presentazione con ${config.model || 'Gemini'}...`);
  const htmlPrompt = buildHtmlPrompt(text, filename, config, extractedData);
  const result = await model.generateContent(htmlPrompt);
  const response = result.response.text();

  onProgress?.('Elaborazione risposta...');
  const cleaned = response
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!cleaned.toLowerCase().includes('<!doctype html')) {
    throw new Error('La risposta AI non contiene HTML valido. Riprova.');
  }
  return cleaned;
}
