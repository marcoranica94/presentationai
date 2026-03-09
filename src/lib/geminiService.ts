import { getGeminiModel } from '@/config/gemini';
import type { GenerationConfig, PresentationUseCase } from '@/types';
import { PALETTES } from '@/types';

const USE_CASE_INSTRUCTIONS: Record<PresentationUseCase, string> = {
  general: `Standard informative document. Be clear, structured, and balanced.`,
  political: `
POLITICAL COMMUNICATION:
- Hero: powerful headline + emotionally resonant subtitle
- Use persuasive, direct language — speak to values and identity
- Include a dedicated CALL TO ACTION section
- Highlight achievements with numbers, before/after contrasts, future vision
- Structure: problem → solution → call to action → closing statement
- Tone: passionate, confident, inspiring`,
  municipal: `
MUNICIPAL/INSTITUTIONAL COMMUNICATION for citizens:
- Hero: institutional header with municipality/entity name and topic
- Plain, accessible language — no jargon, be inclusive
- Structure: context → what was done → how citizens are affected → contacts/next steps
- Include practical info: dates, numbers, offices, procedures
- Tone: formal but approachable, service-oriented
- Last section: contacts, resources, where to find more info`,
};

function buildDesignSystem(palette: { primary: string; secondary: string; bg: string; text: string }, style: string): string {
  const schemes: Record<string, string> = {
    modern: `
      --bg-page: ${palette.bg};
      --bg-section-alt: color-mix(in srgb, ${palette.bg} 85%, ${palette.primary} 15%);
      --bg-card: rgba(255,255,255,0.05);
      --card-border: rgba(255,255,255,0.1);
      --text-primary: ${palette.text};
      --text-secondary: rgba(255,255,255,0.6);
      --accent: ${palette.primary};
      --accent2: ${palette.secondary};
      --hero-gradient: linear-gradient(135deg, ${palette.bg} 0%, color-mix(in srgb, ${palette.bg} 70%, ${palette.primary}) 100%);`,
    minimal: `
      --bg-page: #ffffff;
      --bg-section-alt: #f7f8fc;
      --bg-card: #ffffff;
      --card-border: #e5e7eb;
      --text-primary: #0f172a;
      --text-secondary: #64748b;
      --accent: ${palette.primary};
      --accent2: ${palette.secondary};
      --hero-gradient: linear-gradient(135deg, #f8faff 0%, #eef2ff 100%);`,
    professional: `
      --bg-page: #0d1b2e;
      --bg-section-alt: #f0f4f8;
      --bg-card: rgba(255,255,255,0.07);
      --card-border: rgba(255,255,255,0.12);
      --text-primary: #e8edf2;
      --text-secondary: rgba(232,237,242,0.6);
      --accent: ${palette.primary};
      --accent2: ${palette.secondary};
      --hero-gradient: linear-gradient(135deg, #0d1b2e 0%, #162840 100%);`,
    creative: `
      --bg-page: ${palette.bg};
      --bg-section-alt: color-mix(in srgb, ${palette.bg} 90%, ${palette.secondary} 10%);
      --bg-card: rgba(255,255,255,0.07);
      --card-border: rgba(255,255,255,0.15);
      --text-primary: ${palette.text};
      --text-secondary: rgba(255,255,255,0.55);
      --accent: ${palette.primary};
      --accent2: ${palette.secondary};
      --hero-gradient: linear-gradient(135deg, ${palette.bg} 0%, color-mix(in srgb, ${palette.bg} 60%, ${palette.primary}) 100%);`,
  };

  const lightTextOverride = style === 'minimal' ? `
    .section-alt .section-label { color: var(--accent); }
    .section-alt .section-title { color: #0f172a; }
    .section-alt .section-body { color: #475569; }
    .section-alt .card { background: #ffffff; border-color: #e5e7eb; }
    .section-alt .stat-number { color: var(--accent); }
    .section-alt .timeline-dot { background: var(--accent); }
    .section-alt .tag { background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
  ` : style === 'professional' ? `
    .section-alt { background: #f0f4f8 !important; }
    .section-alt .section-label { color: var(--accent); }
    .section-alt .section-title { color: #0f172a !important; }
    .section-alt .section-body { color: #334155 !important; }
    .section-alt .card { background: #ffffff; border-color: #e2e8f0; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .section-alt .card .card-title { color: #0f172a; }
    .section-alt .card .card-body { color: #475569; }
    .section-alt .stat-number { color: var(--accent); }
    .section-alt li { color: #334155; }
    .section-alt li::before { color: var(--accent); }
  ` : '';

  return `
:root {
  ${schemes[style] ?? schemes['modern']}
  --radius: 16px;
  --radius-sm: 10px;
  --shadow: 0 8px 32px rgba(0,0,0,0.18);
  --shadow-card: 0 4px 20px rgba(0,0,0,0.12);
  --font-display: 'Plus Jakarta Sans', 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; font-size: 16px; }

body {
  font-family: var(--font-body);
  background: var(--bg-page);
  color: var(--text-primary);
  overflow-x: hidden;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* ─── SECTIONS ─────────────────────────────────────────── */
.section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 8% 80px;
  position: relative;
  overflow: hidden;
  background: var(--bg-page);
}
.section-alt { background: var(--bg-section-alt); }
.section-inner { width: 100%; max-width: 1000px; z-index: 1; }

/* ─── DECORATIVE BG BLOBS ───────────────────────────────── */
.section::before {
  content: '';
  position: absolute;
  width: 500px; height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%);
  top: -150px; right: -150px;
  pointer-events: none; z-index: 0;
}
.section::after {
  content: '';
  position: absolute;
  width: 300px; height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent2) 12%, transparent), transparent 70%);
  bottom: -80px; left: -80px;
  pointer-events: none; z-index: 0;
}

/* ─── TYPOGRAPHY ────────────────────────────────────────── */
.section-label {
  font-size: 0.72em;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px;
}
.section-label::before {
  content: '';
  display: inline-block;
  width: 24px; height: 3px;
  background: var(--accent);
  border-radius: 2px;
}
.section-title {
  font-family: var(--font-display);
  font-size: clamp(2em, 5vw, 3.2em);
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-primary);
  margin-bottom: 20px;
  letter-spacing: -0.02em;
}
.section-title .accent { color: var(--accent); }
.section-title .gradient {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.section-body {
  font-size: 1.05em;
  color: var(--text-secondary);
  max-width: 680px;
  line-height: 1.75;
  margin-bottom: 32px;
}

/* ─── HERO ──────────────────────────────────────────────── */
.hero {
  background: var(--hero-gradient);
  text-align: center;
  align-items: center;
}
.hero .section-inner { text-align: center; }
.hero .section-title { font-size: clamp(2.4em, 7vw, 4.5em); margin-bottom: 24px; }
.hero .section-body { margin: 0 auto 36px; font-size: 1.15em; }
.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  color: var(--accent);
  padding: 6px 16px; border-radius: 100px;
  font-size: 0.82em; font-weight: 600;
  margin-bottom: 28px;
  letter-spacing: 0.04em;
}

/* ─── CARDS GRID ────────────────────────────────────────── */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin-top: 40px;
}
.card {
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 28px;
  transition: var(--transition);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
}
.card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  border-radius: var(--radius) var(--radius) 0 0;
}
.card-icon {
  font-size: 2em;
  margin-bottom: 14px;
  display: block;
}
.card-title {
  font-family: var(--font-display);
  font-size: 1.1em;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}
.card-body {
  font-size: 0.88em;
  color: var(--text-secondary);
  line-height: 1.65;
}

/* ─── STATS ─────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 24px;
  margin-top: 40px;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 32px 24px;
  text-align: center;
  backdrop-filter: blur(12px);
  transition: var(--transition);
}
.stat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
.stat-number {
  font-family: var(--font-display);
  font-size: clamp(2.4em, 5vw, 3.8em);
  font-weight: 900;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  display: block;
  margin-bottom: 8px;
}
.stat-label {
  font-size: 0.82em;
  color: var(--text-secondary);
  font-weight: 500;
  line-height: 1.4;
}
.stat-unit {
  font-size: 0.5em;
  font-weight: 600;
  color: var(--accent2);
  vertical-align: super;
}

/* ─── LIST ──────────────────────────────────────────────── */
.feature-list { list-style: none; padding: 0; margin-top: 24px; }
.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--card-border) 60%, transparent);
  font-size: 0.95em;
  color: var(--text-secondary);
  line-height: 1.6;
}
.feature-list li:last-child { border-bottom: none; }
.feature-list li::before {
  content: '';
  flex-shrink: 0;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' width='12' height='12'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 12px;
}

/* ─── TWO COLUMN ────────────────────────────────────────── */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}
@media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

/* ─── CHART ─────────────────────────────────────────────── */
.chart-wrapper {
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 32px;
  backdrop-filter: blur(12px);
  margin-top: 32px;
}
.chart-title {
  font-family: var(--font-display);
  font-size: 1em;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 20px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ─── HIGHLIGHT ─────────────────────────────────────────── */
.highlight-section {
  background: linear-gradient(135deg, var(--accent), var(--accent2)) !important;
}
.highlight-section::before, .highlight-section::after { display: none; }
.highlight-section .section-title { color: #fff; font-size: clamp(1.8em, 4vw, 2.8em); }
.highlight-section .section-body { color: rgba(255,255,255,0.85); max-width: 700px; margin: 0 auto 32px; }
.highlight-section .section-label { color: rgba(255,255,255,0.7); }
.highlight-section .section-label::before { background: rgba(255,255,255,0.5); }
blockquote {
  font-family: var(--font-display);
  font-size: clamp(1.5em, 3.5vw, 2.4em);
  font-weight: 700;
  line-height: 1.3;
  color: #fff;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  padding: 20px 40px;
}
blockquote::before {
  content: '"';
  font-size: 5em;
  color: rgba(255,255,255,0.2);
  position: absolute;
  top: -20px; left: 0;
  line-height: 1;
  font-family: Georgia, serif;
}

/* ─── TIMELINE ──────────────────────────────────────────── */
.timeline { position: relative; padding-left: 32px; margin-top: 32px; }
.timeline::before {
  content: '';
  position: absolute;
  left: 8px; top: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--accent), var(--accent2));
}
.timeline-item { position: relative; margin-bottom: 36px; }
.timeline-dot {
  position: absolute;
  left: -28px; top: 4px;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: var(--accent);
  border: 3px solid var(--bg-page);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent);
}
.timeline-date {
  font-size: 0.78em;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}
.timeline-title {
  font-family: var(--font-display);
  font-size: 1.05em;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
}
.timeline-body { font-size: 0.88em; color: var(--text-secondary); line-height: 1.6; }

/* ─── TAG ───────────────────────────────────────────────── */
.tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 0.75em;
  font-weight: 600;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  margin: 0 4px 8px 0;
}

/* ─── PROGRESS BAR ──────────────────────────────────────── */
.progress-item { margin-bottom: 20px; }
.progress-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.progress-label { font-size: 0.88em; font-weight: 600; color: var(--text-primary); }
.progress-value { font-size: 0.88em; font-weight: 700; color: var(--accent); }
.progress-bar {
  height: 8px;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  border-radius: 100px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  border-radius: 100px;
  transition: width 1.5s cubic-bezier(0.4,0,0.2,1);
}

/* ─── CTA ───────────────────────────────────────────────── */
.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 36px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #fff;
  border-radius: 100px;
  font-size: 1em;
  font-weight: 700;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 40%, transparent);
  margin-top: 8px;
}
.cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px color-mix(in srgb, var(--accent) 50%, transparent); }
.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 32px;
}
.contact-item {
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  padding: 20px;
  backdrop-filter: blur(12px);
}
.contact-item .label { font-size: 0.75em; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
.contact-item .value { font-size: 0.92em; color: var(--text-primary); font-weight: 500; }

/* ─── AOS ANIMATIONS ────────────────────────────────────── */
[data-aos] { opacity: 0; transition: opacity 0.7s ease, transform 0.7s ease; }
[data-aos].aos-animate { opacity: 1; }
[data-aos="fade-up"] { transform: translateY(30px); }
[data-aos="fade-up"].aos-animate { transform: translateY(0); }
[data-aos="fade-right"] { transform: translateX(-30px); }
[data-aos="fade-right"].aos-animate { transform: translateX(0); }
[data-aos="fade-left"] { transform: translateX(30px); }
[data-aos="fade-left"].aos-animate { transform: translateX(0); }
[data-aos="zoom-in"] { transform: scale(0.92); }
[data-aos="zoom-in"].aos-animate { transform: scale(1); }

/* ─── RESPONSIVE ────────────────────────────────────────── */
@media (max-width: 768px) {
  .section { padding: 80px 6% 60px; }
  .cards-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

/* ─── SCROLLBAR ─────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg-page); }
::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 3px; }

${lightTextOverride}`;
}

function buildPrompt(text: string, filename: string, config: GenerationConfig): string {
  const palette = PALETTES[config.palette] ?? PALETTES['indigo'];
  const useCaseInstructions = USE_CASE_INSTRUCTIONS[config.useCase];
  const truncatedText = text.length > 40000 ? text.slice(0, 40000) + '\n[...]' : text;
  const lang = config.language === 'auto'
    ? 'same language as the document (auto-detect)'
    : config.language === 'it' ? 'Italian' : 'English';

  const css = buildDesignSystem(palette, config.style);

  return `You are an expert web designer. Generate a stunning, scrollable HTML document using the EXACT design system below.

LANGUAGE: ${lang}
USE CASE: ${config.useCase.toUpperCase()}
${useCaseInstructions}

TARGET: approximately ${config.slideCount} sections.

---

MANDATORY: Use this EXACT HTML shell — do NOT change the <head> or the script block:

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
  [YOUR SECTIONS HERE]
  <script>
    // AOS init
    document.addEventListener('DOMContentLoaded', () => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('aos-animate'); } });
      }, { threshold: 0.1 });
      document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));
    });
    // [YOUR CHART.JS INITS HERE]
  </script>
</body>
</html>

---

AVAILABLE SECTION PATTERNS — use ALL the CSS classes exactly as shown:

### HERO (always first)
<section class="section hero">
  <div class="section-inner">
    <div class="hero-badge"><span class="material-icons" style="font-size:1em">eco</span> CATEGORY LABEL</div>
    <h1 class="section-title"><span class="gradient">Main Title</span></h1>
    <p class="section-body">Compelling subtitle describing the document.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <span class="tag">Tag 1</span><span class="tag">Tag 2</span><span class="tag">Tag 3</span>
    </div>
  </div>
</section>

### STATS
<section class="section [section-alt if alternating]">
  <div class="section-inner">
    <div class="section-label">Key Numbers</div>
    <h2 class="section-title">Title <span class="accent">in numbers</span></h2>
    <div class="stats-grid">
      <div class="stat-card" data-aos="zoom-in"><span class="stat-number">1,234</span><span class="stat-label">Label for this stat</span></div>
      <!-- repeat 3-4 stats with REAL data from document -->
    </div>
  </div>
</section>

### CONTENT WITH LIST
<section class="section [section-alt if alternating]">
  <div class="section-inner">
    <div class="section-label">Section Topic</div>
    <h2 class="section-title">Section Title</h2>
    <p class="section-body">Brief intro paragraph.</p>
    <ul class="feature-list">
      <li data-aos="fade-up" data-aos-delay="0"><strong>Point one</strong> — explanation from document</li>
      <!-- 4-6 items max -->
    </ul>
  </div>
</section>

### CARDS GRID
<section class="section [section-alt if alternating]">
  <div class="section-inner">
    <div class="section-label">Category</div>
    <h2 class="section-title">Cards Title</h2>
    <div class="cards-grid">
      <div class="card" data-aos="fade-up">
        <span class="card-icon">🌱</span>
        <div class="card-title">Card Title</div>
        <div class="card-body">Card description from document content.</div>
      </div>
      <!-- 2-3 cards -->
    </div>
  </div>
</section>

### TWO COLUMN (text + chart or text + stats)
<section class="section [section-alt if alternating]">
  <div class="section-inner">
    <div class="two-col">
      <div data-aos="fade-right">
        <div class="section-label">Label</div>
        <h2 class="section-title">Title</h2>
        <p class="section-body">Text content.</p>
        <ul class="feature-list"><li>Point A</li><li>Point B</li></ul>
      </div>
      <div data-aos="fade-left">
        <div class="chart-wrapper">
          <div class="chart-title">CHART TITLE</div>
          <canvas id="chart1" height="280"></canvas>
        </div>
      </div>
    </div>
  </div>
</section>

### CHART FULL WIDTH
<section class="section [section-alt if alternating]">
  <div class="section-inner">
    <div class="section-label">Data</div>
    <h2 class="section-title">Chart Title</h2>
    <div class="chart-wrapper" data-aos="zoom-in">
      <div class="chart-title">SUBTITLE</div>
      <canvas id="chart2" height="350"></canvas>
    </div>
  </div>
</section>

### PROGRESS BARS (for percentages/rankings)
<section class="section [section-alt if alternating]">
  <div class="section-inner">
    <div class="section-label">Label</div>
    <h2 class="section-title">Title</h2>
    <div data-aos="fade-up">
      <div class="progress-item">
        <div class="progress-header"><span class="progress-label">Item</span><span class="progress-value">75%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:75%"></div></div>
      </div>
    </div>
  </div>
</section>

### HIGHLIGHT / QUOTE
<section class="section highlight-section">
  <div class="section-inner" style="text-align:center">
    <div class="section-label">Key Message</div>
    <blockquote>Impactful quote or key statement from the document.</blockquote>
  </div>
</section>

### TIMELINE
<section class="section [section-alt if alternating]">
  <div class="section-inner">
    <div class="section-label">Timeline</div>
    <h2 class="section-title">Chronology</h2>
    <div class="timeline">
      <div class="timeline-item" data-aos="fade-up">
        <div class="timeline-dot"></div>
        <div class="timeline-date">2023</div>
        <div class="timeline-title">Event Title</div>
        <div class="timeline-body">Description.</div>
      </div>
    </div>
  </div>
</section>

### CTA / CLOSING (always last)
<section class="section">
  <div class="section-inner" style="text-align:center">
    <div class="section-label">Conclusion</div>
    <h2 class="section-title">Closing Message</h2>
    <p class="section-body">Summary or call to action.</p>
    <div class="contact-grid">
      <div class="contact-item"><div class="label">Contact Type</div><div class="value">Value</div></div>
    </div>
  </div>
</section>

---

CHART.JS INITIALIZATION (add all chart inits in the script block):
new Chart(document.getElementById('chart1'), {
  type: 'bar', // or 'pie', 'doughnut', 'line'
  data: {
    labels: ['Label1', 'Label2', 'Label3'],
    datasets: [{
      label: 'Dataset name',
      data: [val1, val2, val3],
      backgroundColor: ['${palette.primary}cc', '${palette.secondary}cc', '${palette.primary}88'],
      borderColor: ['${palette.primary}', '${palette.secondary}', '${palette.primary}'],
      borderWidth: 2,
      borderRadius: 8,
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { labels: { color: '${palette.text}', font: { family: 'Inter', size: 12 } } }
    },
    scales: {
      x: { ticks: { color: '${palette.text}88' }, grid: { color: '${palette.text}11' } },
      y: { ticks: { color: '${palette.text}88' }, grid: { color: '${palette.text}11' } }
    }
  }
});

---

RULES:
- Use ONLY the CSS classes defined above — no custom styles
- Add data-aos="fade-up" (or fade-right, fade-left, zoom-in) to every major element
- Add data-aos-delay="100", "200", "300" to stagger children
- Alternate sections with class="section" and class="section section-alt"
- Extract REAL numbers and data from the document for stats and charts
- If document has no numeric data, use content sections, cards, and quotes instead
- Use material-icons with <span class="material-icons">icon_name</span> for card icons
- NO placeholder text, NO fake data

---

DOCUMENT:
Filename: ${filename}

${truncatedText}

---

OUTPUT: Return ONLY the complete HTML. No markdown, no backticks. Start with <!DOCTYPE html>.`;
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
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!cleaned.toLowerCase().includes('<!doctype html')) {
    throw new Error('La risposta AI non contiene HTML valido. Riprova.');
  }

  return cleaned;
}
