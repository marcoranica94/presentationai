import { getGeminiModel } from '@/config/gemini';
import type { GenerationConfig, PresentationUseCase } from '@/types';
import { PALETTES } from '@/types';

const USE_CASE_INSTRUCTIONS: Record<PresentationUseCase, string> = {
  general: `Standard informative document. Clear, structured, balanced. Prioritize data over rhetoric.`,
  political: `
POLITICAL COMMUNICATION:
- Hero: powerful headline + emotionally resonant subtitle
- Persuasive, direct language — values and identity
- At least one CALL TO ACTION section with clear ask
- Achievements with numbers, before/after contrasts, future vision
- Structure: problem → solution → call to action → closing
- Tone: passionate, confident, inspiring`,
  municipal: `
MUNICIPAL/INSTITUTIONAL:
- Hero: institution name + topic clearly stated
- Plain accessible language, no jargon
- Structure: context → what was done → impact on citizens → contacts/next steps
- Practical info: dates, numbers, offices, procedures
- Tone: formal but approachable, service-oriented
- Last section: contacts, resources, how to find more info`,
};

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
  style: string
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
  --heading-font: 'Plus Jakarta Sans', sans-serif;
  --body-font: 'Inter', sans-serif;` : `
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
  --heading-font: 'Plus Jakarta Sans', sans-serif;
  --body-font: 'Inter', sans-serif;`;

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

function buildSectionPlan(count: number): string {
  const plans: Record<number, string[]> = {
    6: [
      '1. HERO — title, entity, key tags, 1-line summary',
      '2. STATS — 4 big numbers from key_stats with units and context',
      '3. CONTENT + FEATURE LIST — main topic with all key_points',
      '4. CHART — real data from charts_data (doughnut or bar)',
      '5. PRIORITY ROWS or CARDS — use priority_or_risk_items or process_steps',
      '6. CLOSING — conclusions, contacts, final call to action',
    ],
    8: [
      '1. HERO',
      '2. STATS — 4-5 numbers',
      '3. CONTENT A + feature list — topic 1',
      '4. CHART 1 — pie or doughnut from charts_data[0]',
      '5. CARDS — 3-4 cards from main topics or benefits',
      '6. CHART 2 — bar chart from charts_data[1] or different view',
      '7. HIGHLIGHT — key quote or key finding',
      '8. CLOSING',
    ],
    10: [
      '1. HERO',
      '2. STATS — 5 numbers',
      '3. CONTENT A + feature list',
      '4. CHART 1',
      '5. CARDS (3)',
      '6. PRIORITY ROWS — use all priority_or_risk_items',
      '7. CHART 2',
      '8. TWO-COL + info boxes — investment, rules',
      '9. HIGHLIGHT quote',
      '10. CLOSING',
    ],
    12: [
      '1. HERO',
      '2. STATS',
      '3. CONTENT A + feature list',
      '4. CHART 1 (pie/doughnut)',
      '5. CARDS (3-4)',
      '6. CONTENT B + feature list — second main topic',
      '7. CHART 2 (bar horizontal)',
      '8. PRIORITY ROWS — full list',
      '9. TWO-COL + info boxes — investment costs + benefits',
      '10. RULE CARDS or TIMELINE',
      '11. HIGHLIGHT quote',
      '12. CLOSING',
    ],
    15: [
      '1. HERO',
      '2. STATS (5 numbers)',
      '3. CONTENT A + feature list',
      '4. CHART 1 (pie)',
      '5. CARDS (3)',
      '6. CONTENT B + feature list',
      '7. CHART 2 (bar horizontal)',
      '8. PRIORITY ROWS',
      '9. TWO-COL + info boxes',
      '10. PROCESS FLOW — use process_steps',
      '11. TIMELINE or RULE CARDS',
      '12. CHART 3 (line or second doughnut)',
      '13. CONTENT C — benefits/outcomes with feature list',
      '14. HIGHLIGHT quote',
      '15. CLOSING',
    ],
  };

  const base = plans[count] ?? plans[10];
  if (base) return base.join('\n');

  const dynamic: string[] = ['1. HERO', '2. STATS'];
  const types = ['CONTENT + feature list', 'CHART (real data)', 'CARDS (3)', 'PRIORITY ROWS', 'TWO-COL + info boxes', 'PROCESS FLOW', 'TIMELINE'];
  for (let i = 3; i <= count - 2; i++) {
    dynamic.push(`${i}. ${types[(i - 3) % types.length]}`);
  }
  dynamic.push(`${count - 1}. HIGHLIGHT quote`);
  dynamic.push(`${count}. CLOSING`);
  return dynamic.join('\n');
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
  const useCaseInstructions = USE_CASE_INSTRUCTIONS[config.useCase];
  const truncatedText = text.length > 30000 ? text.slice(0, 30000) + '\n[...]' : text;
  const lang = config.language === 'auto'
    ? 'same language as the document (auto-detect)'
    : config.language === 'it' ? 'Italian' : 'English';

  const css = buildDesignSystem(palette, config.style);
  const isLight = config.style === 'minimal' || config.style === 'professional';
  const defaultSection = isLight ? 'section-white' : 'section-dark';

  const minCharts = config.slideCount >= 8 ? 3 : config.slideCount >= 6 ? 2 : 1;

  return `You are a world-class information designer. Create a premium, data-dense scrollable HTML presentation.
Think: award-winning annual report meets Gamma.app — packed with real data, beautiful typography, smooth animations.

⚠️ SECTION COUNT: EXACTLY ${config.slideCount} <section> elements. Count them. Non-negotiable.
⚠️ CHARTS: At least ${minCharts} Chart.js chart(s) with REAL data from the EXTRACTED DATA below.
⚠️ CONTENT DENSITY: Every sentence must contain a specific fact, number, or name from the document. NO filler.

LANGUAGE: ${lang}
USE CASE: ${config.useCase.toUpperCase()}
${useCaseInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXTRACTED DATA (USE ALL OF THIS IN THE PRESENTATION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${extractedData}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MANDATORY DATA USAGE:
- key_stats → Use ALL in the STATS section (section 2). Every single one.
- charts_data → Use each chart object to build a real Chart.js visualization. Use exact labels and values.
- main_topics → Each topic's key_points must appear as content bullets in the relevant sections.
- priority_or_risk_items → Use ALL in a PRIORITY ROWS section. Show count, percentage, label.
- process_steps → Use in a PROCESS FLOW section.
- rules_principles → Use in a RULE CARDS section.
- benefits_outcomes → Use in a CARDS or feature list section.
- investment_costs → Show in an INFO BOX with the exact amounts.
- timeline_events → Use in a TIMELINE section if ≥3 events exist.
- key_quotes → Use the best one in the HIGHLIGHT section.
- contacts → Use in the CLOSING section.

WRITING RULES (strictly follow):
- Headlines: MAX 6 words. Punchy, specific, data-driven. Example: "2.163 Alberi. Un Patrimonio Vivo."
- Body text: MAX 2 sentences per paragraph. Dense with facts. Use exact numbers.
- Bullets: always start with <strong>bold number or name</strong> — then explanation.
- NEVER write: "This section covers...", "Overview of...", "We will examine..."
- EVERY bullet point must contain a specific fact from the document.
- Stats must always show unit + context: "36,6 m²/ab — doppio della media EU"

SECTION PLAN:
${buildSectionPlan(config.slideCount)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USE THIS HTML SHELL:

<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[DOCUMENT TITLE]</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
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
  // AOS
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
});

// [CHART.JS INITIALIZATIONS HERE]
</script>
</body>
</html>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPONENT REFERENCE:

### HERO
<section class="section ${defaultSection} hero">
  <div class="section-inner">
    <div class="hero-badge"><span class="material-icons" style="font-size:0.9em">location_city</span> ENTITY NAME</div>
    <h1 class="section-title"><span class="gradient">Main Title</span><br>Subtitle Here</h1>
    <p class="section-body">Compelling 1-2 sentences with key facts from summary.</p>
    <div class="tags"><span class="tag">Tag 1</span><span class="tag">Tag 2</span><span class="tag">Tag 3</span></div>
  </div>
</section>

### STATS (use ALL key_stats entries)
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">Numeri Chiave</div>
    <h2 class="section-title">Il Patrimonio <span class="accent">in Cifre</span></h2>
    <p class="section-body">Context sentence with 1-2 most important numbers.</p>
    <div class="stats-grid" data-aos="zoom-in">
      <div class="stat-item">
        <span class="stat-number">2.163</span>
        <div class="stat-label">Alberi censiti</div>
        <div class="stat-desc">Intero territorio comunale</div>
      </div>
      <!-- REPEAT FOR EVERY key_stats ENTRY -->
    </div>
  </div>
</section>

### CHART (real data from charts_data)
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">Distribuzione Dati</div>
    <h2 class="section-title">Chart Title <span class="accent">Here</span></h2>
    <div class="two-col" style="align-items:center">
      <div data-aos="fade-right">
        <p class="section-body">Analytical sentence about what the data shows.</p>
        <ul class="feature-list">
          <li><strong>31,07%</strong> — Tilia spp., specie dominante</li>
          <li><strong>20,11%</strong> — Acer spp., secondo genere</li>
          <!-- 3-5 key insights from the chart data -->
        </ul>
      </div>
      <div data-aos="fade-left">
        <div class="chart-wrapper">
          <div class="chart-subtitle">COMPOSIZIONE SPECIE</div>
          <canvas id="chart1" height="280"></canvas>
        </div>
      </div>
    </div>
  </div>
</section>

### CARDS
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">Category Label</div>
    <h2 class="section-title">Cards <span class="accent">Section</span></h2>
    <div class="cards-grid">
      <div class="card" data-aos="fade-up" data-aos-delay="0">
        <span class="card-icon"><span class="material-icons" style="color:var(--accent)">eco</span></span>
        <div class="card-title">Card Title with Data</div>
        <div class="card-body"><strong>Specific number or fact</strong> — explanation from document.</div>
      </div>
      <!-- 3-4 cards -->
    </div>
  </div>
</section>

### PRIORITY ROWS (use ALL priority_or_risk_items)
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">Priorità di Intervento</div>
    <h2 class="section-title">Analisi del <span class="accent">Rischio</span></h2>
    <p class="section-body">Context sentence about the risk/priority classification.</p>
    <div class="priority-list">
      <div class="priority-row" data-aos="fade-up" data-aos-delay="0">
        <div class="priority-num">1</div>
        <div class="priority-content">
          <div class="priority-title">Urgenza Immediata</div>
          <div class="priority-body"><strong>38 alberi (6,4%)</strong> — Intervento entro 24 ore per rischio caduta.</div>
        </div>
        <div class="priority-badge">6,4%</div>
      </div>
      <!-- Repeat for EVERY item with real count + percentage -->
    </div>
  </div>
</section>

### PROCESS FLOW
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">Processo</div>
    <h2 class="section-title">Come <span class="accent">Funziona</span></h2>
    <div class="process-flow" data-aos="fade-up">
      <div class="process-step">
        <div class="process-step-icon">🌳</div>
        <div class="process-step-title">Step Title</div>
        <div class="process-step-body">Specific description with data.</div>
      </div>
      <!-- 3-5 steps from process_steps -->
    </div>
  </div>
</section>

### TWO-COL + INFO BOXES
<section class="section section-dark">
  <div class="section-inner">
    <div class="two-col">
      <div data-aos="fade-right">
        <div class="chapter-label">Topic</div>
        <h2 class="section-title">Title</h2>
        <ul class="feature-list">
          <li><strong>Fact 1</strong> — detail</li>
          <li><strong>Fact 2</strong> — detail</li>
        </ul>
      </div>
      <div data-aos="fade-left">
        <div class="info-box">
          <div class="info-box-icon">💰</div>
          <div>
            <div class="info-box-title">Investimento</div>
            <div class="info-box-body"><strong>€ 46.340</strong> — exact breakdown from investment_costs.</div>
          </div>
        </div>
        <div class="info-box">
          <div class="info-box-icon">📋</div>
          <div>
            <div class="info-box-title">Another Info</div>
            <div class="info-box-body">Specific fact from document.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

### RULE CARDS (for principles/rules from rules_principles)
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">Principi</div>
    <h2 class="section-title">Regola <span class="accent">10-20-30</span></h2>
    <p class="section-body">Explanation of the rule or principle.</p>
    <div class="rule-grid" data-aos="zoom-in">
      <div class="rule-card">
        <div class="rule-number">10%</div>
        <div class="rule-label">Per singola specie</div>
        <div class="rule-desc">Explanation of this rule threshold.</div>
      </div>
      <!-- one card per rule -->
    </div>
  </div>
</section>

### TIMELINE (if timeline_events has ≥3 items)
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">Cronologia</div>
    <h2 class="section-title">Il Percorso <span class="accent">nel Tempo</span></h2>
    <div class="timeline">
      <div class="timeline-item" data-aos="fade-up">
        <div class="timeline-dot"></div>
        <div class="timeline-date">2022</div>
        <div class="timeline-title">Event Title</div>
        <div class="timeline-body">Description from timeline_events.</div>
      </div>
    </div>
  </div>
</section>

### PROGRESS BARS (for percentage distributions)
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">Distribuzione</div>
    <h2 class="section-title">Title</h2>
    <div data-aos="fade-up">
      <div class="progress-item">
        <div class="progress-header">
          <span class="progress-label">Tilia spp.</span>
          <span class="progress-value">31,07%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" data-width="31.07%" style="width:0%"></div></div>
      </div>
      <!-- repeat for each item -->
    </div>
  </div>
</section>

### HIGHLIGHT (use best quote from key_quotes)
<section class="section section-highlight">
  <div class="section-inner" style="text-align:center">
    <div class="chapter-label">Il Messaggio Chiave</div>
    <blockquote>Exact quote or key finding from key_quotes.</blockquote>
  </div>
</section>

### CLOSING
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">Conclusioni</div>
    <h2 class="section-title">Il Futuro del <span class="accent">Verde Urbano</span></h2>
    <p class="section-body">Summary using conclusions array — specific facts only.</p>
    <div class="contact-grid" data-aos="fade-up">
      <div class="contact-item"><div class="contact-type">Ente</div><div class="contact-value">[entity from contacts]</div></div>
      <!-- use all contacts fields that exist -->
    </div>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHART.JS TEMPLATES:

// Doughnut/Pie — use exact labels+values from charts_data
new Chart(document.getElementById('chart1'), {
  type: 'doughnut',
  data: {
    labels: ['Tilia 31%', 'Acer 20%', 'Carpinus 9%'],
    datasets: [{ data: [31.07, 20.11, 9.2], backgroundColor: ['${palette.primary}', '${palette.secondary}', '${palette.primary}99', '${palette.secondary}66', '${palette.primary}44', '${palette.secondary}33'], borderWidth: 0, hoverOffset: 8 }]
  },
  options: { responsive: true, cutout: '60%', plugins: { legend: { position: 'right', labels: { color: '${isLight ? '#0f1e35' : palette.text}', font: { family: 'Inter', size: 11 }, padding: 14, boxWidth: 10, borderRadius: 3 } } } }
});

// Horizontal Bar
new Chart(document.getElementById('chart2'), {
  type: 'bar',
  data: { labels: ['Label A', 'Label B', 'Label C'], datasets: [{ data: [120, 80, 45], backgroundColor: '${palette.primary}cc', borderRadius: 6, borderSkipped: false }] },
  options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '${isLight ? '#5a6a7e' : 'rgba(255,255,255,0.6)'}' }, grid: { color: '${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)'}' } }, y: { ticks: { color: '${isLight ? '#5a6a7e' : 'rgba(255,255,255,0.6)'}' }, grid: { display: false } } } }
});

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORIGINAL DOCUMENT (for additional context and exact quotes):
Filename: ${filename}

${truncatedText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ FINAL SELF-CHECK before outputting:
1. Count <section class="section ..."> elements → must be EXACTLY ${config.slideCount}
2. Every number in key_stats appears in the STATS section
3. Every charts_data entry has a matching Chart.js init in the <script> block
4. Every priority_or_risk_item appears in a PRIORITY ROWS section with real count+%
5. ZERO filler sentences — every line has a specific fact
6. At least ${minCharts} charts included

OUTPUT: Return ONLY raw HTML. No markdown, no backticks. Start with <!DOCTYPE html>.`;
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
