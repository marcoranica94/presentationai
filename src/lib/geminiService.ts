import { getGeminiModel } from '@/config/gemini';
import type { GenerationConfig, PresentationUseCase } from '@/types';
import { PALETTES } from '@/types';

// Narrative arc per use case: labels, tone, arc
const USE_CASE_NARRATIVE: Record<PresentationUseCase, {
  labels: string[];
  heroRole: string;
  arc: string;
  tone: string;
}> = {
  general: {
    labels: ['IL CONTESTO', 'PERCHÉ CONTA', 'LA METODOLOGIA', 'I NUMERI', 'LA SCOPERTA', 'L\'ANALISI', 'IL RISCHIO', 'LE URGENZE', 'LA RISPOSTA', 'I BENEFICI', 'IL FUTURO', 'IL PASSO SUCCESSIVO'],
    heroRole: 'Open with the single most important finding + why the audience should care.',
    arc: 'WHY → WHAT IS IT → NUMBERS → RISK/ANALYSIS → SOLUTIONS → BENEFITS → FUTURE',
    tone: 'Authoritative, data-driven, precise. Every claim backed by a number. Explain before showing data.',
  },
  political: {
    labels: ['LA SFIDA', 'I RISULTATI', 'IL CAMBIAMENTO', 'I DATI', 'LA VISIONE', 'L\'IMPEGNO', 'I PROSSIMI PASSI', 'LA CHIAMATA'],
    heroRole: 'Open with the boldest achievement or the sharpest contrast between past and future.',
    arc: 'Problem → Achievements → Vision → Call to Action',
    tone: 'Passionate, direct, values-driven. Use before/after contrast. End with clear CTA.',
  },
  municipal: {
    labels: ['IL PROGETTO', 'PERCHÉ LO ABBIAMO FATTO', 'LA METODOLOGIA', 'I NUMERI', 'L\'ANALISI', 'L\'IMPATTO', 'COSA ABBIAMO FATTO', 'I COSTI', 'I BENEFICI', 'IL FUTURO', 'I CONTATTI'],
    heroRole: 'State purpose and direct citizen benefit. Who benefits and how.',
    arc: 'Why → What → Numbers → Risk/Results → Interventions → Benefits → Future → Contacts',
    tone: 'Clear, accessible, citizen-first. Lead with benefit, not process. Address common questions.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY SYSTEM — distinct per style
// ─────────────────────────────────────────────────────────────────────────────

interface FontSystem {
  googleFontsUrl: string;
  headingFont: string;
  bodyFont: string;
}

function getTypographySystem(style: string): FontSystem {
  const systems: Record<string, FontSystem> = {
    minimal: {
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,700;0,900;1,300&family=DM+Sans:wght@300;400;500;600&display=swap',
      headingFont: "'Fraunces', Georgia, serif",
      bodyFont: "'DM Sans', system-ui, sans-serif",
    },
    professional: {
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Instrument+Sans:wght@300;400;500;600&display=swap',
      headingFont: "'Syne', sans-serif",
      bodyFont: "'Instrument Sans', sans-serif",
    },
    dark: {
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Space+Grotesk:wght@300;400;500&display=swap',
      headingFont: "'Bricolage Grotesque', sans-serif",
      bodyFont: "'Space Grotesk', sans-serif",
    },
    vibrant: {
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Outfit:wght@300;400;500&display=swap',
      headingFont: "'Nunito', sans-serif",
      bodyFont: "'Outfit', sans-serif",
    },
    default: {
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Mulish:wght@300;400;500;600&display=swap',
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

Be EXHAUSTIVE. Extract everything: numbers, lists, explanations, quotes, methodology, FAQ, team info, benefits, future steps.

DOCUMENT:
${text}

Return ONLY valid JSON (no markdown, no code blocks, no explanation):
{
  "title": "exact document title",
  "entity": "organization or author name",
  "doc_type": "report|plan|study|survey|census|policy|other",
  "year": "year of the document",
  "summary": "2-3 comprehensive sentences covering all key points",
  "opening_quote": "Best short impactful quote from the document (for hero section)",
  "main_message": "The single most important conclusion in 1 sentence with a specific fact",

  "document_purpose": {
    "problem": "What gap or risk prompted this document? (1-2 sentences)",
    "beneficiaries": "Who benefits and in what concrete way?",
    "motivation_pillars": [
      {"icon": "🔒", "title": "Pillar title (e.g. Sicurezza)", "desc": "1-sentence specific description of this benefit/reason"}
    ]
  },

  "methodology": {
    "overview": "Brief description of HOW the study/analysis was conducted",
    "protocol_name": "Name of protocol, standard, or methodology used (if any)",
    "levels": [
      {"icon": "📋", "number": "1", "name": "Level or phase name", "desc": "What this covers and how", "result": "What it produces"}
    ]
  },

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

  "objections_faq": [
    {
      "question": "Common objection or question the audience might have (e.g. 'Perché tagliate alberi che sembrano sani?')",
      "answer": "The document's response — clear, factual, 2-3 sentences"
    }
  ],

  "benefits": [
    {"icon": "🌡️", "title": "Short benefit title", "desc": "1-2 sentence description with specific data if available"}
  ],

  "timeline_events": [
    {"date": "2022", "event": "Descrizione dell'evento"}
  ],

  "rules_principles": [
    {"value": "Max 10%", "label": "Per singola specie", "explanation": "Regola biodiversità 10-20-30"}
  ],

  "investment_costs": [
    {"label": "Investimento totale", "amount": "€ 46.340", "detail": "Suddiviso in fasi operative"}
  ],

  "process_steps": [
    {"step": 1, "title": "Nome della fase", "description": "Descrizione specifica della fase"}
  ],

  "next_steps": [
    {"step": 1, "title": "Next action title", "desc": "What specifically needs to happen and why"}
  ],

  "benefits_outcomes": [
    "Benefit or outcome with specific details"
  ],

  "priority_or_risk_items": [
    {"rank": 1, "label": "Urgenza immediata", "value": 38, "percentage": 6.4, "description": "Cosa comporta questo livello"}
  ],

  "team_credits": {
    "entity": "Organization that conducted the work",
    "person": "Lead professional name and title",
    "method": "Methodology or protocol used",
    "period": "When the work was done"
  },

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

/* ── INLINE PULL QUOTE ─────────────────────────────── */
.inline-quote {
  border-left: 3px solid var(--accent);
  padding: 12px 20px; margin: 24px 0;
  font-family: var(--heading-font); font-style: italic;
  font-size: 1.05em; line-height: 1.6;
}
.section-white .inline-quote, .section-light .inline-quote { color: #0f1e35; background: var(--card-bg); }
.section-dark  .inline-quote { color: var(--text-on-dark); background: var(--card-bg-dark); }

/* ── MOTIVATION PILLARS ────────────────────────────── */
.motivation-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-top:32px; }
.motivation-card {
  border-radius:16px; padding:28px 24px;
  border:1px solid var(--card-border);
  display:flex; flex-direction:column; gap:10px;
}
.section-white .motivation-card, .section-light .motivation-card { background:var(--card-bg); }
.section-dark  .motivation-card { background:var(--card-bg-dark); border-color:var(--card-border-dark); }
.motivation-icon { font-size:2em; }
.motivation-title { font-family:var(--heading-font); font-size:1em; font-weight:700; }
.section-white .motivation-title, .section-light .motivation-title { color:#0f1e35; }
.section-dark  .motivation-title { color:#fff; }
.motivation-desc { font-size:0.86em; line-height:1.6; }
.section-white .motivation-desc, .section-light .motivation-desc { color:var(--text-muted); }
.section-dark  .motivation-desc { color:var(--text-muted-on-dark); }

/* ── METHODOLOGY LEVELS ────────────────────────────── */
.method-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px; margin-top:32px; }
.method-card {
  border-radius:16px; padding:32px 28px;
  border:2px solid color-mix(in srgb, var(--accent) 30%, transparent);
  position:relative;
}
.section-white .method-card, .section-light .method-card { background:var(--card-bg); }
.section-dark  .method-card { background:var(--card-bg-dark); }
.method-number {
  display:inline-flex; align-items:center; justify-content:center;
  width:36px; height:36px; border-radius:50%;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  color:#fff; font-family:var(--heading-font); font-size:0.9em; font-weight:800;
  margin-bottom:14px;
}
.method-icon { font-size:1.6em; display:block; margin-bottom:10px; }
.method-title { font-family:var(--heading-font); font-size:1.05em; font-weight:700; margin-bottom:8px; color:var(--accent); }
.method-desc { font-size:0.88em; line-height:1.65; margin-bottom:10px; }
.section-white .method-desc, .section-light .method-desc { color:var(--text-muted); }
.section-dark  .method-desc { color:var(--text-muted-on-dark); }
.method-result { font-size:0.82em; font-weight:600; color:var(--accent); border-top:1px solid var(--card-border); padding-top:10px; margin-top:4px; }

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

/* ── BENEFIT GRID (6-item) ─────────────────────────── */
.benefit-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-top:32px; }
.benefit-item {
  border-radius:14px; padding:24px 20px;
  border:1px solid var(--card-border);
  display:flex; flex-direction:column; gap:8px;
}
.section-white .benefit-item, .section-light .benefit-item { background:var(--card-bg); }
.section-dark  .benefit-item { background:var(--card-bg-dark); border-color:var(--card-border-dark); }
.benefit-icon { font-size:1.8em; }
.benefit-title { font-family:var(--heading-font); font-size:0.95em; font-weight:700; color:var(--accent); }
.benefit-desc { font-size:0.84em; line-height:1.6; }
.section-white .benefit-desc, .section-light .benefit-desc { color:var(--text-muted); }
.section-dark  .benefit-desc { color:var(--text-muted-on-dark); }

/* ── FAQ LIST ──────────────────────────────────────── */
.faq-list { margin-top:28px; display:flex; flex-direction:column; gap:16px; }
.faq-item {
  border-radius:12px; padding:24px 28px;
  border:1px solid var(--card-border);
}
.section-white .faq-item, .section-light .faq-item { background:var(--card-bg); }
.section-dark  .faq-item { background:var(--card-bg-dark); border-color:var(--card-border-dark); }
.faq-question {
  font-family:var(--heading-font); font-size:1em; font-weight:700;
  margin-bottom:10px; display:flex; align-items:flex-start; gap:10px;
}
.section-white .faq-question, .section-light .faq-question { color:#0f1e35; }
.section-dark  .faq-question { color:#fff; }
.faq-question::before {
  content:'?'; flex-shrink:0; width:26px; height:26px; border-radius:50%;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  color:#fff; font-size:0.85em; font-weight:900;
  display:flex; align-items:center; justify-content:center; margin-top:1px;
}
.faq-answer { font-size:0.88em; line-height:1.7; padding-left:36px; }
.section-white .faq-answer, .section-light .faq-answer { color:var(--text-muted); }
.section-dark  .faq-answer { color:var(--text-muted-on-dark); }

/* ── ROADMAP (numbered future steps) ───────────────── */
.roadmap-list { margin-top:28px; display:flex; flex-direction:column; gap:0; }
.roadmap-step {
  display:flex; gap:20px; padding:20px 0;
  border-bottom:1px solid color-mix(in srgb, var(--card-border) 50%, transparent);
}
.roadmap-step:last-child { border-bottom:none; }
.roadmap-num {
  flex-shrink:0; width:42px; height:42px; border-radius:50%;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  color:#fff; font-family:var(--heading-font); font-size:1em; font-weight:800;
  display:flex; align-items:center; justify-content:center; margin-top:2px;
}
.roadmap-content { flex:1; }
.roadmap-title { font-family:var(--heading-font); font-size:1em; font-weight:700; margin-bottom:5px; }
.section-white .roadmap-title, .section-light .roadmap-title { color:#0f1e35; }
.section-dark  .roadmap-title { color:#fff; }
.roadmap-desc { font-size:0.86em; line-height:1.6; }
.section-white .roadmap-desc, .section-light .roadmap-desc { color:var(--text-muted); }
.section-dark  .roadmap-desc { color:var(--text-muted-on-dark); }

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
  .benefit-grid { grid-template-columns:1fr; }
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
// SECTION PLAN — Gamma-style narrative arc
// ─────────────────────────────────────────────────────────────────────────────

function buildSectionPlan(count: number, useCase: PresentationUseCase): string {
  const narrative = USE_CASE_NARRATIVE[useCase];

  // The full 15-section Gamma-style arc
  const fullArc = [
    // 1
    `HERO
  Title: [Opening sentence with key finding + most important number. Make it the hook.]
  Chapter label: [e.g. "${narrative.labels[0]}"]
  Content: hero-badge with entity name + icon; h1 with gradient span; 2-sentence body with 2+ key facts from summary; opening_quote as inline-quote if available; tags from data
  Note: This section HOOKS the audience. Why should they care? State the stakes immediately.`,

    // 2
    `WHY / MOTIVATION — "Perché abbiamo fatto questo?"
  Title: An explanatory title is OK here. E.g. "Perché abbiamo censito 2.163 Alberi?" or "Cosa ci ha spinto ad agire"
  Chapter label: [e.g. "${narrative.labels[1]}"]
  Content: 2-sentence intro (the problem/opportunity) + motivation-grid with 3 motivation-cards from document_purpose.motivation_pillars (icon + title + desc)
  Note: EMOTIONAL HOOK. Help the audience understand WHY this matters for them personally.`,

    // 3
    `METHODOLOGY — "Cos'è e come funziona"
  Title: Descriptive/educational title OK here. E.g. "Come Abbiamo Condotto il Censimento" or "Il Metodo: Due Livelli di Analisi"
  Chapter label: [e.g. "${narrative.labels[2] ?? 'LA METODOLOGIA'}"]
  Content: short intro paragraph (overview + protocol name if any) + method-grid with 2 method-cards from methodology.levels (icon, number, name, desc, result)
  Optional inline-quote: if a relevant quote from key_quotes fits the methodology context
  Note: Build CREDIBILITY. Explain what was done before showing the results.`,

    // 4
    `STATS GRID — The numbers at a glance
  Title: NOT "Numeri Chiave". Write the conclusion the numbers prove together. E.g. "2.163 Alberi, un Patrimonio che Vale Più di Quanto Pensiamo"
  Chapter label: [e.g. "${narrative.labels[3] ?? 'I NUMERI'}"]
  Content: 1-sentence summary + stats-grid with ALL key_stats entries. Each stat: gradient number + unit label + context (WHY this number matters, not just what it is)`,

    // 5
    `CHART 1 — Primary data distribution
  Title: The insight this chart proves. NOT "Distribuzione Dati". E.g. "Il 60% del Verde Si Concentra in 3 Specie: un Rischio Sistemico"
  Chapter label: [e.g. "${narrative.labels[4] ?? 'LA SCOPERTA'}"]
  Content: two-col — left: analytical paragraph (what does this distribution mean?) + feature-list with 4-5 key insights (bold value + consequence); right: Chart.js canvas from charts_data[0]`,

    // 6
    `CHART 2 — Second dimension of data
  Title: What this specific chart reveals. E.g. "Il Verde Stradale Copre il 25%: la Prima Linea di Difesa Climatica"
  Chapter label: [e.g. "${narrative.labels[5] ?? 'L\'ANALISI'}"]
  Content: two-col — left: Chart.js canvas from charts_data[1]; right: analytical paragraph + feature-list insights
  If only one chart available: use a progress-bar section for the species or area distribution instead`,

    // 7
    `RISK EXPLAINER / CONTEXT — "Cos'è il rischio? Come si valuta?"
  Title: Educational/explanatory title. E.g. "Come Valutiamo il Rischio Arboreo: il Protocollo Aretè®" or "Tre Fattori Determinano la Sicurezza di ogni Albero"
  Chapter label: [e.g. "${narrative.labels[6] ?? 'IL RISCHIO'}"]
  Content: intro paragraph explaining the risk/analysis methodology + cards-grid (3 cards) from main_topics or process_steps or methodology factors (Pericolo, Impulso, Bersaglio if available)
  Note: EDUCATE before showing risk results. The audience needs to understand the system before seeing numbers.`,

    // 8
    `PRIORITY ROWS — Triage results
  Title: The stakes + urgency. E.g. "38 Alberi Richiedono Intervento Immediato: Ecco la Mappa del Rischio"
  Chapter label: [e.g. "${narrative.labels[7] ?? 'LE URGENZE'}"]
  Content: intro paragraph (how many were analyzed, what the triage covers) + priority-list with ALL priority_or_risk_items (rank, label, count + percentage, description of what this means in practice)`,

    // 9
    `FAQ — "Le domande che tutti si fanno"
  Title: Explanatory/inviting title. E.g. "Le Domande dei Cittadini: Rispondiamo con i Dati"
  Chapter label: [e.g. "LE DOMANDE"]
  Content: intro sentence + faq-list with ALL objections_faq entries (question + answer). Each question is a real objection or concern.
  If objections_faq is empty: use this slot for INTERVENTIONS (the 4 types of action) with cards-grid instead.`,

    // 10
    `INTERVENTIONS / SOLUTIONS — "Cosa facciamo concretamente"
  Title: The outcome of the interventions. E.g. "Quattro Strumenti per Mettere in Sicurezza ogni Albero"
  Chapter label: [e.g. "LA RISPOSTA"]
  Content: intro paragraph + cards-grid (3-4 cards) from process_steps or additional_lists — each card: icon + outcome title + specific description with data
  Optional: info-box with investment_costs amounts`,

    // 11
    `BENEFITS — "I benefici concreti per i cittadini"
  Title: NOT "Benefici del Verde". Write the conclusion. E.g. "Ogni Albero Abbassa la Temperatura di 2-5°C: i Dati Parlano Chiaro"
  Chapter label: [e.g. "${narrative.labels[9] ?? 'I BENEFICI'}"]
  Content: intro paragraph + benefit-grid with ALL benefits entries (icon + title + desc). Each benefit should feel tangible and citizen-centered.`,

    // 12
    `FUTURE ROADMAP — "I prossimi passi"
  Title: The vision, not just a list. E.g. "Sei Passi per una Città più Verde e Sicura entro il 2030"
  Chapter label: [e.g. "${narrative.labels[10] ?? 'IL FUTURO'}"]
  Content: intro paragraph (what the roadmap achieves) + roadmap-list with ALL next_steps entries (numbered circle + title + desc)
  If next_steps is empty: use process_steps or additional_lists`,

    // 13
    `RULE CARDS or TIMELINE
  For rules_principles: Rule cards section. Title = what these rules prevent. E.g. "La Regola 10-20-30: Biodiversità come Assicurazione contro le Epidemie"
  For timeline_events (≥3): Timeline section. Title = what the arc shows. E.g. "Dal 2019 al 2025: Come la Città ha Imparato a Conoscere i Suoi Alberi"
  Chapter label: [e.g. "LE REGOLE" or "IL PERCORSO"]`,

    // 14
    `HIGHLIGHT — The emotional peak / THE ARROW
  Title: (none — just blockquote)
  Chapter label: "IL MESSAGGIO"
  Content: section-highlight (gradient background) + blockquote with THE most powerful sentence from key_quotes OR a crafted summary: "[Entity] [key action] [specific outcome] — [why it matters for citizens]"
  This is the ONE THING the audience will remember.`,

    // 15
    `CLOSING — Forward-looking. What happens next?
  Title: Action-oriented, forward-looking. NOT "Conclusioni". E.g. "Il Verde Urbano è un Bene Comune: Proteggiamolo Insieme" or "Il Censimento è il Punto Zero: Ecco Cosa Succede Ora"
  Chapter label: [e.g. "${narrative.labels[narrative.labels.length - 1]}"]
  Content: 2-sentence summary from conclusions (specific facts only) + optional team_credits mention + contact-grid with all contacts fields that have values`,
  ];

  // Select sections based on count
  let selected: string[];

  if (count <= 6) {
    selected = [fullArc[0], fullArc[3], fullArc[4], fullArc[7], fullArc[10], fullArc[14]];
  } else if (count <= 8) {
    selected = [fullArc[0], fullArc[1], fullArc[3], fullArc[4], fullArc[7], fullArc[8], fullArc[13], fullArc[14]];
  } else if (count <= 10) {
    selected = [fullArc[0], fullArc[1], fullArc[3], fullArc[4], fullArc[5], fullArc[7], fullArc[8], fullArc[10], fullArc[13], fullArc[14]];
  } else if (count <= 12) {
    selected = [fullArc[0], fullArc[1], fullArc[2], fullArc[3], fullArc[4], fullArc[5], fullArc[7], fullArc[8], fullArc[9], fullArc[10], fullArc[13], fullArc[14]];
  } else {
    selected = fullArc.slice(0, count);
    // If count > 15, repeat content sections
    while (selected.length < count) {
      selected.splice(selected.length - 2, 0, `ADDITIONAL CONTENT — Use remaining main_topics, additional_lists, or benefits_outcomes not yet covered. Same section rules apply.`);
    }
  }

  return selected.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
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
  const altSection = isLight ? 'section-light' : 'section-dark';

  const minCharts = config.slideCount >= 8 ? 2 : 1;
  const labelColor = isLight ? '#0f1e35' : palette.text;
  const gridColor = isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)';
  const tickColor = isLight ? '#5a6a7e' : 'rgba(255,255,255,0.6)';

  return `You are a world-class information designer creating a scrollable HTML presentation.
The result must feel like the best Gamma.app presentation you've ever seen: rich narrative, beautiful data, emotional arc, and crystal-clear communication.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ SECTIONS: EXACTLY ${config.slideCount} <section class="section ..."> elements. Count them.
⚠️ CHARTS: At least ${minCharts} Chart.js chart(s) with REAL data from extracted JSON.
⚠️ NO FILLER: Every sentence must contain a specific fact, number, or name from the document.
⚠️ USE ALL DATA: Every field in the extracted JSON must appear somewhere in the presentation.

LANGUAGE: ${lang}
USE CASE: ${config.useCase.toUpperCase()}
NARRATIVE TONE: ${narrative.tone}
NARRATIVE ARC: ${narrative.arc}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXTRACTED DATA — USE EVERYTHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${extractedData}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATA → COMPONENT MAPPING:
- document_purpose.motivation_pillars → motivation-grid (WHY section)
- methodology.levels → method-grid (METHODOLOGY section)
- key_stats → stats-grid (ALL entries, each with WHY context)
- charts_data → Chart.js canvases (one per entry, exact values)
- main_topics.key_points → feature-list bullets (bold fact — explanation)
- priority_or_risk_items → priority-list (ALL entries, rank + count + %)
- objections_faq → faq-list (ALL questions + answers)
- benefits → benefit-grid (icon + title + desc)
- next_steps → roadmap-list (ALL steps numbered)
- process_steps → process-flow or cards
- rules_principles → rule-grid
- investment_costs → info-box (exact amounts)
- timeline_events → timeline (if ≥3)
- key_quotes → blockquote HIGHLIGHT + inline-quote in hero
- conclusions → closing body text (2 sentences with specific facts)
- contacts → contact-grid
- team_credits → closing mention

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TITLE STRATEGY — TWO MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODE A — ASSERTION TITLE (for data/results sections):
Use when the section SHOWS data or results. Title = the CONCLUSION the data proves.
❌ "Numeri Chiave" → ✅ "2.163 Alberi Garantiscono 36,6 m² di Verde per Abitante"
❌ "Distribuzione Specie" → ✅ "Tre Specie Coprono il 60% — Biodiversità a Rischio"
❌ "Analisi del Rischio" → ✅ "38 Alberi Richiedono Abbattimento Immediato"

MODE B — DESCRIPTIVE TITLE (for educational/explanatory sections):
Use when the section EXPLAINS a concept or ANSWERS a question. Can be a question or description.
✅ "Perché abbiamo Censito 2.163 Alberi?" (WHY section)
✅ "Come Valutiamo il Rischio: il Protocollo Aretè®" (METHODOLOGY section)
✅ "Le Domande dei Cittadini: Rispondiamo con i Dati" (FAQ section)
✅ "Quattro Modi per Proteggere ogni Albero" (INTERVENTIONS section)

RULE: Data sections = assertion. Educational/narrative sections = descriptive/question.
ALWAYS avoid: "Numeri Chiave", "Overview", "Conclusioni", "Analisi", "Dati".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT QUALITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Body text: MAX 2 sentences. Dense facts. Exact numbers always.
Feature-list bullets: <strong>[exact number or fact]</strong> — [consequence or meaning]
Stat items: number + unit + WHY it matters (not just what it is)
Card bodies: <strong>[fact]</strong> — [why this matters for the audience]
FAQ answers: conversational, reassuring, specific. Address the real concern.
Benefit items: citizen-centered. "You gain..." not "This produces..."
Roadmap steps: each title = the OUTCOME of that step, not just its activity name
FORBIDDEN: "In questa sezione", "Come possiamo vedere", "This overview", "We will examine", "È importante notare"

Section alternation (to avoid visual monotony):
- Alternate light/dark sections: ${defaultSection} → ${altSection} → ${defaultSection} → etc.
- Charts go in ${defaultSection} sections for contrast
- HIGHLIGHT always uses section-highlight class

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION PLAN (EXACTLY ${config.slideCount} sections)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${buildSectionPlan(config.slideCount, config.useCase)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HTML SHELL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[Document Title]</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${fonts.googleFontsUrl}" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/material-icons@1.13.12/iconfont/material-icons.min.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<style>
${css}
</style>
</head>
<body>
[ALL ${config.slideCount} SECTIONS HERE]
<script>
document.addEventListener('DOMContentLoaded', () => {
  const obs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('aos-animate');
  }), { threshold: 0.08 });
  document.querySelectorAll('[data-aos]').forEach(el => obs.observe(el));
  const barObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) {
      const fill = e.target.querySelector('.progress-fill');
      if (fill) { const w = fill.dataset.width; setTimeout(() => fill.style.width = w, 100); }
    }
  }), { threshold: 0.3 });
  document.querySelectorAll('.progress-item').forEach(el => barObs.observe(el));
  // [ALL CHART INITIALIZATIONS HERE]
});
</script>
</body>
</html>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### HERO
<section class="section ${defaultSection} hero">
  <div class="section-inner">
    <div class="hero-badge"><span class="material-icons" style="font-size:0.9em">park</span> [entity name]</div>
    <h1 class="section-title"><span class="gradient">[Hook with biggest number/finding]</span><br>[Supporting fact or contrast]</h1>
    <p class="section-body">[2 sentences, 2+ specific facts from summary]</p>
    <!-- Include inline-quote if opening_quote exists -->
    <div class="inline-quote">[opening_quote text]</div>
    <div class="tags"><span class="tag">[tag]</span><span class="tag">[tag]</span></div>
  </div>
</section>

### WHY / MOTIVATION
<section class="section [alt-section]">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <h2 class="section-title">[Descriptive/question title: "Perché abbiamo...?"]</h2>
    <p class="section-body">[The problem or gap this addresses. 1-2 sentences with specific facts.]</p>
    <div class="motivation-grid" data-aos="fade-up">
      <div class="motivation-card">
        <div class="motivation-icon">[icon from motivation_pillars]</div>
        <div class="motivation-title">[title]</div>
        <div class="motivation-desc">[desc — specific, citizen-centered]</div>
      </div>
      <!-- one card per document_purpose.motivation_pillars entry -->
    </div>
  </div>
</section>

### METHODOLOGY
<section class="section [section-color]">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <h2 class="section-title">[Descriptive title: "Come abbiamo..." or "Il metodo: ..."]</h2>
    <p class="section-body">[methodology.overview — how it was done, who, when, with what protocol]</p>
    <div class="method-grid" data-aos="fade-up">
      <div class="method-card">
        <span class="method-icon">[icon]</span>
        <div class="method-number">[number]</div>
        <div class="method-title">[name]</div>
        <div class="method-desc">[desc]</div>
        <div class="method-result">→ [result]</div>
      </div>
      <!-- one card per methodology.levels entry -->
    </div>
  </div>
</section>

### STATS GRID
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <h2 class="section-title">[Assertion: what these numbers collectively prove] <span class="accent">[key word]</span></h2>
    <p class="section-body">[1-2 sentences: what do these numbers mean together? What is implied?]</p>
    <div class="stats-grid" data-aos="zoom-in">
      <div class="stat-item">
        <span class="stat-number">2.163</span>
        <div class="stat-label">Alberi censiti</div>
        <!-- WHY it matters — not just what it is -->
        <div class="stat-desc">36,6 m² per abitante — doppio media UE</div>
      </div>
      <!-- ONE stat-item PER key_stats entry — all of them -->
    </div>
  </div>
</section>

### CHART SECTION
<section class="section [section-color]">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <h2 class="section-title">[Assertion: what this chart reveals] <span class="accent">[key finding]</span></h2>
    <div class="two-col" style="align-items:center">
      <div data-aos="fade-right">
        <p class="section-body">[Analytical conclusion from the chart data. 2 sentences.]</p>
        <ul class="feature-list">
          <li><strong>[31,07%]</strong> — [Tilia: what this means, consequence]</li>
          <!-- 4-5 bullets, each = exact chart value + analytical meaning -->
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

### PRIORITY ROWS
<section class="section [section-color]">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <h2 class="section-title">[Assertion: stakes + urgency with numbers]</h2>
    <p class="section-body">[How many were analyzed? What does each level mean for action?]</p>
    <div class="priority-list">
      <div class="priority-row" data-aos="fade-up" data-aos-delay="0">
        <div class="priority-num">1</div>
        <div class="priority-content">
          <div class="priority-title">[label from data]</div>
          <div class="priority-body"><strong>[count] ([percentage]%)</strong> — [what this means in practice for citizens].</div>
        </div>
        <div class="priority-badge">[percentage]%</div>
      </div>
      <!-- ONE row PER priority_or_risk_items entry — ALL of them -->
    </div>
  </div>
</section>

### FAQ
<section class="section [section-color]">
  <div class="section-inner">
    <div class="chapter-label">LE DOMANDE</div>
    <h2 class="section-title">[Inviting title: "Le Domande dei Cittadini" or "Rispondiamo alle Vostre Domande"]</h2>
    <p class="section-body">[Why these questions matter. 1 sentence.]</p>
    <div class="faq-list">
      <div class="faq-item" data-aos="fade-up">
        <div class="faq-question">[question from objections_faq]</div>
        <div class="faq-answer">[answer — conversational, factual, reassuring]</div>
      </div>
      <!-- one faq-item per objections_faq entry -->
    </div>
  </div>
</section>

### BENEFIT GRID
<section class="section [section-color]">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <h2 class="section-title">[Assertion: the most impressive benefit with a number]</h2>
    <p class="section-body">[Why these benefits matter for citizens. 1-2 sentences.]</p>
    <div class="benefit-grid" data-aos="fade-up">
      <div class="benefit-item">
        <div class="benefit-icon">[icon from benefits]</div>
        <div class="benefit-title">[title]</div>
        <div class="benefit-desc">[desc — specific, tangible, citizen-centered]</div>
      </div>
      <!-- one item per benefits entry -->
    </div>
  </div>
</section>

### ROADMAP
<section class="section [section-color]">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <h2 class="section-title">[Forward-looking vision title with a timeframe or number]</h2>
    <p class="section-body">[What the roadmap achieves in total. 1-2 sentences.]</p>
    <div class="roadmap-list" data-aos="fade-up">
      <div class="roadmap-step">
        <div class="roadmap-num">1</div>
        <div class="roadmap-content">
          <div class="roadmap-title">[step title = the OUTCOME of this step]</div>
          <div class="roadmap-desc">[what specifically happens, who, any deadline or number]</div>
        </div>
      </div>
      <!-- one step per next_steps entry -->
    </div>
  </div>
</section>

### CARDS (for interventions, solutions, or topic breakdown)
<section class="section [section-color]">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <h2 class="section-title">[Overarching conclusion or descriptive title]</h2>
    <div class="cards-grid">
      <div class="card" data-aos="fade-up" data-aos-delay="0">
        <span class="card-icon">[emoji or material icon]</span>
        <div class="card-title">[Card takeaway: outcome of this intervention/step]</div>
        <div class="card-body"><strong>[specific number or fact]</strong> — [consequence or description].</div>
      </div>
    </div>
    <!-- Optional: info-box for investment_costs -->
    <div class="info-box" style="margin-top:24px">
      <div class="info-box-icon">💰</div>
      <div>
        <div class="info-box-title">[investment label]</div>
        <div class="info-box-body"><strong>[exact amount]</strong> — [what this covers].</div>
      </div>
    </div>
  </div>
</section>

### RULE CARDS
<section class="section [section-color]">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <h2 class="section-title">[What these rules prevent or ensure] <span class="accent">[key number]</span></h2>
    <p class="section-body">[Why these thresholds exist. What happens if violated.]</p>
    <div class="rule-grid" data-aos="zoom-in">
      <div class="rule-card">
        <div class="rule-number">[value]</div>
        <div class="rule-label">[label]</div>
        <div class="rule-desc">[consequence if this threshold is exceeded]</div>
      </div>
    </div>
    <!-- inline-quote with key_quotes if a relevant quote exists -->
  </div>
</section>

### TIMELINE
<section class="section [section-color]">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <h2 class="section-title">[What the timeline arc shows collectively]</h2>
    <div class="timeline">
      <div class="timeline-item" data-aos="fade-up">
        <div class="timeline-dot"></div>
        <div class="timeline-date">[date]</div>
        <div class="timeline-title">[significance of this moment, not just its name]</div>
        <div class="timeline-body">[what changed, what was produced, any numbers]</div>
      </div>
    </div>
  </div>
</section>

### HIGHLIGHT
<section class="section section-highlight">
  <div class="section-inner" style="text-align:center">
    <div class="chapter-label" style="color:rgba(255,255,255,0.7);justify-content:center">IL MESSAGGIO</div>
    <blockquote>[THE ARROW: the single sentence the audience will remember. Use best key_quote OR craft: "[Entity] [action] [outcome] — [why this matters for citizens]". Must have a specific fact.]</blockquote>
  </div>
</section>

### CLOSING
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">[NARRATIVE LABEL]</div>
    <h2 class="section-title">[Forward-looking, action title] <span class="accent">[key word]</span></h2>
    <p class="section-body">[2 sentences from conclusions — specific facts, what happens next]</p>
    <!-- Optional: team_credits mention if available -->
    <div class="contact-grid" data-aos="fade-up">
      <div class="contact-item">
        <div class="contact-type">Ente</div>
        <div class="contact-value">[contacts.entity]</div>
      </div>
      <!-- one contact-item per contacts field that has a non-empty value -->
    </div>
  </div>
</section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHART.JS TEMPLATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Doughnut/Pie
new Chart(document.getElementById('chart1'), {
  type: 'doughnut',
  data: {
    labels: [/* exact labels from charts_data[n].labels */],
    datasets: [{ data: [/* exact values */], backgroundColor: ['${palette.primary}','${palette.secondary}','${palette.primary}99','${palette.secondary}66','${palette.primary}44','${palette.secondary}33'], borderWidth: 0, hoverOffset: 8 }]
  },
  options: { responsive: true, cutout: '60%', plugins: { legend: { position: 'right', labels: { color: '${labelColor}', font: { size: 11 }, padding: 14, boxWidth: 10, borderRadius: 3 } } } }
});

// Horizontal Bar
new Chart(document.getElementById('chart2'), {
  type: 'bar',
  data: { labels: [/* labels */], datasets: [{ data: [/* values */], backgroundColor: '${palette.primary}cc', borderRadius: 6, borderSkipped: false }] },
  options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '${tickColor}' }, grid: { color: '${gridColor}' } }, y: { ticks: { color: '${tickColor}' }, grid: { display: false } } } }
});

// Vertical Bar
new Chart(document.getElementById('chart3'), {
  type: 'bar',
  data: { labels: [/* labels */], datasets: [{ data: [/* values */], backgroundColor: '${palette.primary}cc', borderRadius: 8 }] },
  options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '${tickColor}' }, grid: { color: '${gridColor}' } }, x: { ticks: { color: '${tickColor}' }, grid: { display: false } } } }
});

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORIGINAL DOCUMENT (exact quotes and additional context)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Filename: ${filename}
${truncatedText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Count <section class="section"> → EXACTLY ${config.slideCount}? ✓
2. WHY/MOTIVATION section uses motivation-grid with real pillars? ✓
3. METHODOLOGY section explains HOW with method-grid? ✓
4. All key_stats in stats-grid with WHY context? ✓
5. At least ${minCharts} Chart.js charts with exact data values? ✓
6. All priority_or_risk_items in priority-list? ✓
7. objections_faq entries in faq-list? ✓
8. benefits in benefit-grid? ✓
9. next_steps in roadmap-list? ✓
10. HIGHLIGHT has THE ARROW — one powerful, specific sentence? ✓
11. CLOSING title is forward-looking, not "Conclusioni"? ✓
12. Sections alternate light/dark for visual variety? ✓

OUTPUT: ONLY raw HTML. No markdown, no backticks. Start with <!DOCTYPE html>.`;
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
    extractedData = extractedData
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  } catch (err) {
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
