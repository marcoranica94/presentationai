import { getGeminiModel } from '@/config/gemini';
import type { GenerationConfig, PresentationUseCase } from '@/types';
import { PALETTES } from '@/types';

const USE_CASE_INSTRUCTIONS: Record<PresentationUseCase, string> = {
  general: `Standard informative document. Clear, structured, balanced.`,
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

function buildDesignSystem(
  palette: { primary: string; secondary: string; bg: string; text: string },
  style: string
): string {
  // For light styles, use white/light grey backgrounds with accent cards
  // For dark styles, use dark backgrounds
  const isLight = style === 'minimal' || style === 'professional';

  const vars = isLight ? `
  --bg-base: #ffffff;
  --bg-alt: #f5f7fa;
  --bg-dark: #0f1e35;
  --text-base: #0f1e35;
  --text-muted: #5a6a7e;
  --text-on-dark: #f0f4f9;
  --text-muted-on-dark: rgba(240,244,249,0.65);
  --card-bg: color-mix(in srgb, ${palette.primary} 10%, #ffffff);
  --card-border: color-mix(in srgb, ${palette.primary} 25%, transparent);
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
.hero { background: var(--bg-base); }
.hero-inner { display: grid; grid-template-columns: 1fr; gap: 40px; align-items: center; }
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
.stats-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:0; margin-top:36px; border:1px solid var(--card-border); border-radius:16px; overflow:hidden; }
.section-dark .stats-grid { border-color: var(--card-border-dark); }
.stat-item { padding:32px 24px; text-align:center; border-right:1px solid var(--card-border); }
.section-dark .stat-item { border-color: var(--card-border-dark); }
.stat-item:last-child { border-right:none; }
.stat-number {
  font-family: var(--heading-font); font-size: clamp(2.6em,5vw,3.8em); font-weight:900; line-height:1;
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

/* ── PROCESS FLOW (arrows) ─────────────────────────── */
.process-flow { display:flex; flex-wrap:wrap; gap:0; margin-top:32px; }
.process-step {
  flex:1; min-width:180px; padding:22px 28px 22px 36px;
  position:relative; text-align:center;
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 18px 50%);
}
.process-step:first-child { clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%); }
.process-step:last-child  { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 18px 50%); }
.section-white .process-step, .section-light .process-step {
  background: var(--card-bg); border:1px solid var(--card-border);
}
.section-dark .process-step { background: var(--card-bg-dark); border:1px solid var(--card-border-dark); }
.process-step-icon { font-size:1.8em; margin-bottom:10px; }
.process-step-title { font-family:var(--heading-font); font-size:0.95em; font-weight:700; margin-bottom:6px; color:var(--accent); }
.process-step-body  { font-size:0.8em; line-height:1.5; }
.section-white .process-step-body, .section-light .process-step-body { color:var(--text-muted); }
.section-dark  .process-step-body  { color:var(--text-muted-on-dark); }

/* ── PRIORITY ROWS (numbered list) ────────────────── */
.priority-list { margin-top:28px; display:flex; flex-direction:column; gap:10px; }
.priority-row {
  display:flex; align-items:flex-start; gap:16px; padding:16px 20px; border-radius:12px;
  border:1px solid var(--card-border);
}
.section-white .priority-row, .section-light .priority-row { background:var(--card-bg); }
.section-dark  .priority-row { background:var(--card-bg-dark); border-color:var(--card-border-dark); }
.priority-num {
  flex-shrink:0; width:32px; height:32px; border-radius:8px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  color:#fff; font-family:var(--heading-font); font-size:0.9em; font-weight:800;
  display:flex; align-items:center; justify-content:center;
}
.priority-content { flex:1; }
.priority-title { font-family:var(--heading-font); font-size:0.95em; font-weight:700; margin-bottom:4px; }
.section-white .priority-title, .section-light .priority-title { color:#0f1e35; }
.section-dark  .priority-title { color:#ffffff; }
.priority-body { font-size:0.84em; line-height:1.55; }
.section-white .priority-body, .section-light .priority-body { color:var(--text-muted); }
.section-dark  .priority-body  { color:var(--text-muted-on-dark); }

/* ── INFO BOX ──────────────────────────────────────── */
.info-box {
  border-radius:12px; padding:20px 24px; margin:20px 0;
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
blockquote::before { content:'"'; font-size:4.5em; color:rgba(255,255,255,0.2); position:absolute; top:-10px; left:0; line-height:1; font-family:Georgia,serif; }

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
.progress-fill { height:100%; background:linear-gradient(90deg,var(--accent),var(--accent2)); border-radius:100px; }

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

/* ── RULE CARDS (10-20-30 style) ───────────────────── */
.rule-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:16px; margin-top:28px; }
.rule-card { border-radius:14px; padding:28px 20px; text-align:center; border:2px solid var(--accent); }
.section-white .rule-card, .section-light .rule-card { background:var(--card-bg); }
.section-dark  .rule-card { background:var(--card-bg-dark); }
.rule-number { font-family:var(--heading-font); font-size:2.8em; font-weight:900; color:var(--accent); line-height:1; margin-bottom:8px; }
.rule-label { font-size:0.84em; font-weight:600; }
.section-white .rule-label, .section-light .rule-label { color:var(--text-muted); }
.section-dark  .rule-label { color:var(--text-muted-on-dark); }

/* ── CTA / CONTACTS ────────────────────────────────── */
.contact-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-top:28px; }
.contact-item { border-radius:10px; padding:18px; }
.section-white .contact-item, .section-light .contact-item { background:var(--card-bg); border:1px solid var(--card-border); }
.section-dark  .contact-item { background:var(--card-bg-dark); border:1px solid var(--card-border-dark); }
.contact-type { font-size:0.72em; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:5px; }
.contact-value { font-size:0.9em; font-weight:500; }
.section-white .contact-value, .section-light .contact-value { color:#0f1e35; }
.section-dark  .contact-value { color:var(--text-on-dark); }

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

function buildSectionPlan(count: number): string {
  const plans: Record<number, string[]> = {
    6:  ['1. HERO', '2. STATS (3-4 big numbers)', '3. CONTENT + feature list', '4. CHART (real data)', '5. CARDS or PRIORITY LIST', '6. CLOSING'],
    8:  ['1. HERO', '2. STATS (4 numbers)', '3. CONTENT + feature list', '4. CHART 1 (pie or doughnut)', '5. CARDS (3 cards)', '6. CHART 2 (bar chart)', '7. HIGHLIGHT quote', '8. CLOSING'],
    10: ['1. HERO', '2. STATS (4 numbers)', '3. CONTENT + feature list', '4. CHART 1', '5. CARDS (3)', '6. PRIORITY ROWS', '7. CHART 2', '8. TWO-COL + info boxes', '9. HIGHLIGHT quote', '10. CLOSING'],
    12: ['1. HERO', '2. STATS', '3. CONTENT A', '4. CHART 1', '5. CARDS', '6. CONTENT B + feature list', '7. CHART 2', '8. PRIORITY ROWS', '9. TWO-COL + info boxes', '10. RULE CARDS or TIMELINE', '11. HIGHLIGHT quote', '12. CLOSING'],
    15: ['1. HERO', '2. STATS', '3. CONTENT A', '4. CHART 1 (pie)', '5. CARDS (3)', '6. CONTENT B', '7. CHART 2 (bar)', '8. PRIORITY ROWS', '9. TWO-COL', '10. PROCESS FLOW', '11. TIMELINE or RULE CARDS', '12. CHART 3 (line or doughnut)', '13. INFO BOXES', '14. HIGHLIGHT quote', '15. CLOSING'],
  };
  const base = plans[count] ?? plans[10];
  if (base) return base.join('\n');
  // Fallback: generate plan dynamically
  const dynamic = ['1. HERO', '2. STATS'];
  for (let i = 3; i <= count - 2; i++) {
    const types = ['CONTENT + feature list', 'CHART (real data)', 'CARDS (3)', 'PRIORITY ROWS', 'TWO-COL + info boxes', 'PROCESS FLOW'];
    dynamic.push(`${i}. ${types[(i - 3) % types.length]}`);
  }
  dynamic.push(`${count - 1}. HIGHLIGHT quote`);
  dynamic.push(`${count}. CLOSING`);
  return dynamic.join('\n');
}

function buildPrompt(text: string, filename: string, config: GenerationConfig): string {
  const palette = PALETTES[config.palette] ?? PALETTES['indigo'];
  const useCaseInstructions = USE_CASE_INSTRUCTIONS[config.useCase];
  const truncatedText = text.length > 40000 ? text.slice(0, 40000) + '\n[...]' : text;
  const lang = config.language === 'auto'
    ? 'same language as the document (auto-detect)'
    : config.language === 'it' ? 'Italian' : 'English';

  const css = buildDesignSystem(palette, config.style);
  const isLight = config.style === 'minimal' || config.style === 'professional';
  const defaultSection = isLight ? 'section-white' : 'section-dark';
  const altSection = isLight ? 'section-light' : 'section-dark';

  // Build required section plan based on count
  const minCharts = config.slideCount >= 8 ? 3 : config.slideCount >= 6 ? 2 : 1;

  return `You are a world-class information designer and data journalist. Create a stunning, data-rich scrollable HTML document — think premium annual report meets Gamma.app.

⚠️ CRITICAL — SECTION COUNT: You MUST generate EXACTLY ${config.slideCount} <section> elements. Not ${config.slideCount - 1}, not ${config.slideCount + 1}. EXACTLY ${config.slideCount}. Count them before you finish. This is non-negotiable.

⚠️ CRITICAL — CHARTS: You MUST include at least ${minCharts} chart section(s) with real Chart.js visualizations using actual data from the document.

LANGUAGE: ${lang}
USE CASE: ${config.useCase.toUpperCase()}
${useCaseInstructions}

---

WRITING QUALITY RULES — follow these strictly:
- Every headline: SHORT, PUNCHY, ACTION-ORIENTED. Max 6 words. Not "Overview of the situation" → "2.163 alberi. Un patrimonio vivo."
- Every body paragraph: MAX 2 sentences. Dense with facts. No filler words.
- Every bullet point: START with a bold number, name, or strong adjective. Not "The trees are important" → "<strong>31%</strong> Tigli — la specie dominante del territorio."
- Stats: always include the unit AND the context ("36,6 m²/abitante — il doppio della media nazionale")
- Charts must have REAL labels and REAL numbers extracted from the document
- Never write vague text. Every sentence must contain at least one specific fact from the document.

---

REQUIRED SECTION PLAN for ${config.slideCount} sections:
${buildSectionPlan(config.slideCount)}

---

USE THIS EXACT HTML SHELL (do NOT change the <head> or the <script> block structure):

<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[DOCUMENT TITLE HERE]</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/material-icons@1.13.12/iconfont/material-icons.min.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<style>
${css}
</style>
</head>
<body>

[YOUR SECTIONS HERE]

<script>
// AOS
document.addEventListener('DOMContentLoaded', () => {
  const obs = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) e.target.classList.add('aos-animate'); }), { threshold: 0.08 });
  document.querySelectorAll('[data-aos]').forEach(el => obs.observe(el));
});
// [CHART.JS INITS HERE — one per canvas id]
</script>
</body>
</html>

---

SECTION CLASS RULES:
- Every <section> must have class="section" PLUS one of: section-white / section-light / section-dark / section-highlight
- Default for this style: "${defaultSection}"
- Alternate sections: use "${altSection}" to create visual rhythm
- section-highlight = gradient bg, use sparingly (1-2 max)
- Always wrap content in <div class="section-inner">

---

AVAILABLE COMPONENTS (copy patterns exactly):

### HERO (always first — use section-white or section-dark depending on style)
<section class="section section-white">
  <div class="section-inner">
    <div class="hero-badge"><span class="material-icons" style="font-size:0.9em">location_city</span> ENTITY NAME</div>
    <h1 class="section-title"><span class="gradient">Main Title of</span><br>The Document</h1>
    <p class="section-body">Compelling subtitle or description from document content.</p>
    <div class="tags"><span class="tag">Tag 1</span><span class="tag">Tag 2</span></div>
  </div>
</section>

### STATS (great for chapter 3-type number sections)
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">Key Numbers</div>
    <h2 class="section-title">Title with <span class="accent">Real Data</span></h2>
    <p class="section-body">Brief context paragraph.</p>
    <div class="stats-grid" data-aos="zoom-in">
      <div class="stat-item"><span class="stat-number">2.163</span><div class="stat-label">Alberi censiti</div><div class="stat-desc">Tutto il territorio</div></div>
      <div class="stat-item"><span class="stat-number">44</span><div class="stat-label">Generi botanici</div><div class="stat-desc">Biodiversità</div></div>
      <!-- 3-4 stats with REAL numbers from document -->
    </div>
  </div>
</section>

### CARDS
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">Category</div>
    <h2 class="section-title">Cards Title</h2>
    <div class="cards-grid">
      <div class="card" data-aos="fade-up" data-aos-delay="0">
        <span class="card-icon"><span class="material-icons" style="color:var(--accent)">shield</span></span>
        <div class="card-title">Card Title</div>
        <div class="card-body">Description from document content.</div>
      </div>
      <!-- 2-4 cards -->
    </div>
  </div>
</section>

### PROCESS FLOW (for step-by-step or 3-factor explanations)
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">Process</div>
    <h2 class="section-title">How It Works</h2>
    <p class="section-body">Introduction paragraph.</p>
    <div class="process-flow" data-aos="fade-up">
      <div class="process-step">
        <div class="process-step-icon">🌳</div>
        <div class="process-step-title">Step One</div>
        <div class="process-step-body">Description.</div>
      </div>
      <div class="process-step">
        <div class="process-step-icon">📊</div>
        <div class="process-step-title">Step Two</div>
        <div class="process-step-body">Description.</div>
      </div>
      <div class="process-step">
        <div class="process-step-icon">✅</div>
        <div class="process-step-title">Step Three</div>
        <div class="process-step-body">Description.</div>
      </div>
    </div>
  </div>
</section>

### PRIORITY ROWS (numbered list with styled rows)
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">Results</div>
    <h2 class="section-title">Priority List</h2>
    <p class="section-body">Intro text.</p>
    <div class="priority-list">
      <div class="priority-row" data-aos="fade-up">
        <div class="priority-num">1</div>
        <div class="priority-content">
          <div class="priority-title">Item Title</div>
          <div class="priority-body">38 alberi (6,4%) — description of priority level.</div>
        </div>
      </div>
      <!-- repeat for each item -->
    </div>
  </div>
</section>

### INFO BOX + TWO COLUMN
<section class="section section-dark">
  <div class="section-inner">
    <div class="two-col">
      <div data-aos="fade-right">
        <div class="chapter-label">Topic</div>
        <h2 class="section-title">Title</h2>
        <p class="section-body">Main text content.</p>
        <ul class="feature-list">
          <li><strong>Point A</strong> — explanation</li>
          <li><strong>Point B</strong> — explanation</li>
        </ul>
      </div>
      <div data-aos="fade-left">
        <div class="info-box">
          <div class="info-box-icon">❓</div>
          <div>
            <div class="info-box-title">Question Title</div>
            <div class="info-box-body">Answer or explanation from document.</div>
          </div>
        </div>
        <div class="info-box">
          <div class="info-box-icon">💰</div>
          <div>
            <div class="info-box-title">Investment</div>
            <div class="info-box-body"><strong>€ 46.340</strong> — detail.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

### CHART (use REAL data from document)
<section class="section section-white">
  <div class="section-inner">
    <div class="chapter-label">Data</div>
    <h2 class="section-title">Chart Title</h2>
    <div class="two-col" style="align-items:center">
      <div data-aos="fade-right">
        <p class="section-body">Explanation of the data.</p>
        <ul class="feature-list">
          <li>Key insight 1</li>
          <li>Key insight 2</li>
        </ul>
      </div>
      <div data-aos="fade-left">
        <div class="chart-wrapper">
          <div class="chart-subtitle">CHART LABEL</div>
          <canvas id="chart1" height="300"></canvas>
        </div>
      </div>
    </div>
  </div>
</section>

### RULE CARDS (for 10-20-30 type rules or 3 key principles)
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">Rules</div>
    <h2 class="section-title">The Rule of <span class="accent">10-20-30</span></h2>
    <p class="section-body">Explanation of the rule.</p>
    <div class="rule-grid" data-aos="zoom-in">
      <div class="rule-card"><div class="rule-number">Max 10%</div><div class="rule-label">Per singola specie</div></div>
      <div class="rule-card"><div class="rule-number">Max 20%</div><div class="rule-label">Per singolo genere</div></div>
      <div class="rule-card"><div class="rule-number">Max 30%</div><div class="rule-label">Per singola famiglia</div></div>
    </div>
  </div>
</section>

### HIGHLIGHT (use max 1-2 times)
<section class="section section-highlight">
  <div class="section-inner" style="text-align:center">
    <div class="chapter-label">Key Message</div>
    <blockquote>Powerful quote or key statement from the document.</blockquote>
  </div>
</section>

### CLOSING (always last)
<section class="section section-dark">
  <div class="section-inner">
    <div class="chapter-label">Conclusion</div>
    <h2 class="section-title">Closing Title</h2>
    <p class="section-body">Summary paragraph.</p>
    <div class="contact-grid">
      <div class="contact-item"><div class="contact-type">Website</div><div class="contact-value">www.comune.it</div></div>
      <!-- use real contacts if found in document -->
    </div>
  </div>
</section>

---

CHART.JS INIT TEMPLATE (add in the <script> block for each chart):
new Chart(document.getElementById('chart1'), {
  type: 'doughnut', // or 'bar', 'pie', 'line', 'horizontalBar'
  data: {
    labels: ['Tilia 31%', 'Acer 20%', 'Carpinus 9%', 'Altri 40%'],
    datasets: [{
      data: [31.07, 20.11, 9.2, 39.62],
      backgroundColor: ['${palette.primary}', '${palette.secondary}', '${palette.primary}99', '${palette.secondary}66', '${palette.primary}44'],
      borderWidth: 0,
      hoverOffset: 8,
    }]
  },
  options: {
    responsive: true, cutout: '55%',
    plugins: {
      legend: { position: 'right', labels: { color: '${isLight ? '#0f1e35' : palette.text}', font: { family: 'Inter', size: 12 }, padding: 16, boxWidth: 12, borderRadius: 4 } }
    }
  }
});

For bar charts use:
  type: 'bar',
  data: { labels: [...], datasets: [{ data: [...], backgroundColor: '${palette.primary}cc', borderRadius: 8, borderSkipped: false }] },
  options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '${isLight ? '#5a6a7e' : 'rgba(255,255,255,0.6)'}' }, grid: { color: '${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)'}' } }, y: { ticks: { color: '${isLight ? '#5a6a7e' : 'rgba(255,255,255,0.6)'}' }, grid: { display: false } } } }

---

IMPORTANT RULES:
- Use ONLY the CSS classes defined above — do NOT add custom inline styles except minor adjustments
- Add data-aos="fade-up" (or fade-right/fade-left/zoom-in) to every major element
- Add data-aos-delay="100"/"200"/"300" to stagger children within a section
- Alternate section-white/section-light/section-dark for visual rhythm
- Use REAL data, numbers, and quotes from the document — NO placeholder text
- Use material-icons: <span class="material-icons">icon_name</span>
- Sections must have class="section" + one background class

---

DOCUMENT:
Filename: ${filename}

${truncatedText}

---

⚠️ BEFORE OUTPUTTING — SELF-CHECK:
1. Count your <section class="section ..."> elements. Must be EXACTLY ${config.slideCount}.
2. Every number/statistic is real data from the document above.
3. At least ${minCharts} Chart.js visualization(s) are included.
4. Every headline is ≤6 words and punchy.
5. No section has generic filler text.

OUTPUT: Return ONLY the raw HTML. No markdown, no backticks. Start with <!DOCTYPE html>.`;
}

export async function generatePresentation(
  text: string,
  filename: string,
  config: GenerationConfig,
  onProgress?: (status: string) => void
): Promise<string> {
  onProgress?.('Preparazione del prompt...');
  const prompt = buildPrompt(text, filename, config);
  const model = getGeminiModel(config.model || 'gemini-2.0-flash');
  onProgress?.(`Generazione con ${config.model || 'Gemini'}...`);
  const result = await model.generateContent(prompt);
  const response = result.response.text();
  onProgress?.('Elaborazione risposta...');
  const cleaned = response
    .replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  if (!cleaned.toLowerCase().includes('<!doctype html')) {
    throw new Error('La risposta AI non contiene HTML valido. Riprova.');
  }
  return cleaned;
}
