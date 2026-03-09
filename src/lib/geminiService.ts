import { getGeminiModel } from '@/config/gemini';
import type { GenerationConfig, PresentationStyle, PresentationUseCase } from '@/types';
import { PALETTES } from '@/types';

const STYLE_TEMPLATES: Record<PresentationStyle, (p: { primary: string; secondary: string; bg: string; text: string }) => string> = {
  modern: (p) => `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
  :root { --primary: ${p.primary}; --secondary: ${p.secondary}; --bg: ${p.bg}; --text: ${p.text}; }
  .reveal { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); }
  .reveal .slides section { text-align: left; padding: 40px 60px; }
  .reveal h1 { font-size: 2.6em; font-weight: 900; color: var(--primary); line-height: 1.1; margin-bottom: 0.3em; text-transform: uppercase; letter-spacing: -1px; }
  .reveal h2 { font-size: 1.8em; font-weight: 800; color: var(--primary); border-left: 5px solid var(--primary); padding-left: 16px; margin-bottom: 0.6em; }
  .reveal h3 { font-size: 1.2em; font-weight: 600; color: var(--secondary); margin-bottom: 0.4em; }
  .reveal p, .reveal li { font-size: 0.95em; line-height: 1.6; color: var(--text); }
  .reveal ul { list-style: none; padding: 0; }
  .reveal ul li::before { content: '▸'; color: var(--primary); font-weight: 900; margin-right: 10px; }
  .reveal strong { color: var(--primary); font-weight: 800; }
  .reveal .slide-title { background: linear-gradient(135deg, var(--bg) 60%, ${p.primary}22); min-height: 100%; display: flex; flex-direction: column; justify-content: center; }
  .reveal .slide-title h1 { font-size: 3em; }
  .reveal .subtitle { color: var(--secondary); font-size: 1.1em; font-weight: 400; margin-top: 0.5em; }
  .reveal .highlight-box { background: ${p.primary}18; border-left: 4px solid var(--primary); padding: 12px 18px; border-radius: 4px; margin: 12px 0; }
  .reveal .stat { font-size: 2.5em; font-weight: 900; color: var(--primary); display: block; }
  .reveal .progress span { background: var(--primary) !important; }
  .reveal .controls { color: var(--primary) !important; }
</style>`,

  minimal: (p) => `
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&display=swap');
  :root { --primary: ${p.primary}; --secondary: ${p.secondary}; --bg: #ffffff; --text: #1a1a2e; }
  .reveal { font-family: 'DM Sans', sans-serif; background: #ffffff; color: #1a1a2e; }
  .reveal .slides section { text-align: left; padding: 50px 70px; }
  .reveal h1 { font-size: 2.4em; font-weight: 700; color: #0f0f1a; line-height: 1.15; margin-bottom: 0.4em; }
  .reveal h2 { font-size: 1.6em; font-weight: 500; color: #0f0f1a; border-bottom: 2px solid ${p.primary}; padding-bottom: 10px; margin-bottom: 0.8em; }
  .reveal h3 { font-size: 1.1em; font-weight: 500; color: ${p.primary}; margin-bottom: 0.3em; }
  .reveal p, .reveal li { font-size: 0.9em; line-height: 1.8; color: #444; font-weight: 300; }
  .reveal ul { list-style: none; padding: 0; }
  .reveal ul li { border-bottom: 1px solid #eee; padding: 8px 0; }
  .reveal ul li::before { content: '—'; color: ${p.primary}; margin-right: 10px; }
  .reveal strong { color: #0f0f1a; font-weight: 700; }
  .reveal .subtitle { color: #888; font-size: 1em; font-weight: 300; margin-top: 0.5em; }
  .reveal .highlight-box { background: ${p.primary}0d; border: 1px solid ${p.primary}33; padding: 14px 20px; border-radius: 6px; margin: 10px 0; }
  .reveal .stat { font-size: 2.8em; font-weight: 700; color: ${p.primary}; display: block; }
  .reveal .progress span { background: ${p.primary} !important; }
  .reveal .controls { color: ${p.primary} !important; }
</style>`,

  professional: (p) => `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&display=swap');
  :root { --primary: ${p.primary}; --secondary: ${p.secondary}; --bg: #0d1b2e; --text: #e8edf2; }
  .reveal { font-family: 'Source Sans 3', sans-serif; background: #0d1b2e; color: #e8edf2; }
  .reveal .slides section { text-align: left; padding: 36px 56px; }
  .reveal h1 { font-size: 2.2em; font-weight: 700; color: #ffffff; line-height: 1.2; margin-bottom: 0.3em; }
  .reveal h2 { font-size: 1.5em; font-weight: 600; color: #ffffff; background: ${p.primary}; padding: 8px 16px; display: inline-block; margin-bottom: 0.7em; border-radius: 3px; }
  .reveal h3 { font-size: 1.05em; font-weight: 600; color: ${p.secondary}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.4em; }
  .reveal p, .reveal li { font-size: 0.88em; line-height: 1.7; color: #c5d0dc; }
  .reveal ul { list-style: none; padding: 0; }
  .reveal ul li { padding: 6px 0; border-bottom: 1px solid #ffffff15; }
  .reveal ul li::before { content: '●'; color: ${p.primary}; font-size: 0.6em; margin-right: 10px; vertical-align: middle; }
  .reveal strong { color: ${p.secondary}; font-weight: 700; }
  .reveal .subtitle { color: ${p.secondary}; font-size: 1em; font-weight: 300; }
  .reveal .highlight-box { background: ${p.primary}25; border: 1px solid ${p.primary}55; padding: 12px 18px; border-radius: 4px; margin: 10px 0; }
  .reveal .stat { font-size: 2.4em; font-weight: 700; color: ${p.primary}; display: block; }
  .reveal table { width: 100%; border-collapse: collapse; font-size: 0.8em; }
  .reveal table th { background: ${p.primary}; color: white; padding: 8px 12px; text-align: left; }
  .reveal table td { padding: 7px 12px; border-bottom: 1px solid #ffffff20; }
  .reveal .progress span { background: ${p.primary} !important; }
  .reveal .controls { color: ${p.primary} !important; }
</style>`,

  creative: (p) => `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
  :root { --primary: ${p.primary}; --secondary: ${p.secondary}; --bg: ${p.bg}; --text: ${p.text}; }
  .reveal { font-family: 'Poppins', sans-serif; background: var(--bg); color: var(--text); }
  .reveal .slides section { text-align: left; padding: 36px 56px; overflow: hidden; }
  .reveal .slides section::before { content: ''; position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; border-radius: 50%; background: ${p.primary}20; pointer-events: none; }
  .reveal .slides section::after { content: ''; position: absolute; bottom: -40px; left: -40px; width: 120px; height: 120px; border-radius: 50%; background: ${p.secondary}15; pointer-events: none; }
  .reveal h1 { font-size: 2.5em; font-weight: 800; background: linear-gradient(135deg, ${p.primary}, ${p.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.1; margin-bottom: 0.3em; }
  .reveal h2 { font-size: 1.7em; font-weight: 700; color: var(--text); position: relative; margin-bottom: 0.6em; }
  .reveal h2::after { content: ''; display: block; width: 50px; height: 4px; background: linear-gradient(90deg, ${p.primary}, ${p.secondary}); border-radius: 2px; margin-top: 8px; }
  .reveal h3 { font-size: 1.1em; font-weight: 600; color: ${p.secondary}; margin-bottom: 0.3em; }
  .reveal p, .reveal li { font-size: 0.9em; line-height: 1.65; color: var(--text); opacity: 0.9; }
  .reveal ul { list-style: none; padding: 0; }
  .reveal ul li { padding: 6px 0 6px 22px; position: relative; }
  .reveal ul li::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 10px; height: 10px; border-radius: 50%; background: linear-gradient(135deg, ${p.primary}, ${p.secondary}); }
  .reveal strong { color: ${p.primary}; font-weight: 700; }
  .reveal .subtitle { color: ${p.secondary}; font-size: 1.05em; }
  .reveal .highlight-box { background: linear-gradient(135deg, ${p.primary}20, ${p.secondary}15); border: 1px solid ${p.primary}40; padding: 14px 20px; border-radius: 12px; margin: 10px 0; }
  .reveal .stat { font-size: 2.6em; font-weight: 800; background: linear-gradient(135deg, ${p.primary}, ${p.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; display: block; }
  .reveal .progress span { background: linear-gradient(90deg, ${p.primary}, ${p.secondary}) !important; }
  .reveal .controls { color: ${p.primary} !important; }
</style>`,
};

const USE_CASE_INSTRUCTIONS: Record<PresentationUseCase, string> = {
  general: `Standard informative presentation. Be clear, structured, and balanced.`,

  political: `
POLITICAL COMMUNICATION presentation:
- Opening slide: powerful headline + emotionally resonant subtitle
- Use persuasive, direct language — speak to values and identity
- Include at least one dedicated CALL TO ACTION slide
- Highlight achievements with numbers, contrasts (before/after), future vision
- Structure: problem → solution → call to action
- End with a strong, memorable closing statement
- Tone: passionate, confident, inspiring`,

  municipal: `
MUNICIPAL/INSTITUTIONAL COMMUNICATION for citizens:
- Opening slide: institutional header with municipality name and topic
- Plain, accessible language — no jargon, be inclusive
- Structure: context → what was done → how citizens are affected → contacts/next steps
- Include practical info: dates, numbers, offices, procedures
- Be transparent about data and sources
- Tone: formal but approachable, service-oriented
- Last slide: contacts, resources, where to find more info`,
};

function buildPrompt(text: string, filename: string, config: GenerationConfig): string {
  const palette = PALETTES[config.palette] ?? PALETTES['indigo'];
  const styleCSS = STYLE_TEMPLATES[config.style](palette);
  const useCaseInstructions = USE_CASE_INSTRUCTIONS[config.useCase];
  const truncatedText = text.length > 40000 ? text.slice(0, 40000) + '\n[...]' : text;
  const lang = config.language === 'auto'
    ? 'same language as the document (auto-detect)'
    : config.language === 'it' ? 'Italian' : 'English';

  return `You are an expert web developer creating a stunning HTML presentation.

Generate a complete, self-contained HTML5 presentation using Reveal.js based on the document below.

TECHNICAL REQUIREMENTS:
- Complete valid HTML5 document (<!DOCTYPE html> to </html>)
- Reveal.js 5.x from CDN: https://cdn.jsdelivr.net/npm/reveal.js@5/dist/
- Include EXACTLY this CSS block verbatim inside <head> (do not modify it):
${styleCSS}
- DO NOT override or redefine any of the CSS rules above
- Works offline after initial CDN load

REVEAL.JS INIT:
Reveal.initialize({
  transition: 'slide',
  backgroundTransition: 'fade',
  controls: true,
  progress: true,
  hash: true,
  center: false,
});

USE CASE: ${config.useCase.toUpperCase()}
${useCaseInstructions}

PRESENTATION STRUCTURE (${config.slideCount} slides ±2):
- Slide 1: Title slide with class="slide-title" on the <section>. Use <h1> for title and <p class="subtitle"> for subtitle.
- Slides 2 to N-1: Content slides. Each covers ONE focused topic. Use <h2> for slide title, <ul> for bullet points.
- When showing a key number/stat, use <span class="stat">NUMBER</span> followed by a short label.
- For important callouts, wrap in <div class="highlight-box">.
- Last slide: summary or call to action.

CONTENT RULES:
- Max 5 bullet points per slide — be concise and punchy
- Bold key numbers, statistics, dates with <strong>
- Language: ${lang}
- NO placeholder text — use only real content from the document

DOCUMENT:
Filename: ${filename}

${truncatedText}

OUTPUT RULES:
- Return ONLY the raw HTML document
- No markdown, no backticks, no explanation
- Start with <!DOCTYPE html> and end with </html>`;
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
