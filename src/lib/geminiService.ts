import { getGeminiModel } from '@/config/gemini';
import type { GenerationConfig, PresentationUseCase } from '@/types';
import { PALETTES } from '@/types';

const USE_CASE_INSTRUCTIONS: Record<PresentationUseCase, string> = {
  general: `Standard informative document. Be clear, structured, and balanced.`,

  political: `
POLITICAL COMMUNICATION:
- Hero section: powerful headline + emotionally resonant subtitle
- Use persuasive, direct language — speak to values and identity
- Include a dedicated CALL TO ACTION section
- Highlight achievements with numbers, before/after contrasts, future vision
- Structure: problem → solution → call to action
- End with a strong, memorable closing statement
- Tone: passionate, confident, inspiring`,

  municipal: `
MUNICIPAL/INSTITUTIONAL COMMUNICATION for citizens:
- Hero section: institutional header with municipality name and topic
- Plain, accessible language — no jargon, be inclusive
- Structure: context → what was done → how citizens are affected → contacts/next steps
- Include practical info: dates, numbers, offices, procedures
- Tone: formal but approachable, service-oriented
- Last section: contacts, resources, where to find more info`,
};

function buildPrompt(text: string, filename: string, config: GenerationConfig): string {
  const palette = PALETTES[config.palette] ?? PALETTES['indigo'];
  const useCaseInstructions = USE_CASE_INSTRUCTIONS[config.useCase];
  const truncatedText = text.length > 40000 ? text.slice(0, 40000) + '\n[...]' : text;
  const lang = config.language === 'auto'
    ? 'same language as the document (auto-detect)'
    : config.language === 'it' ? 'Italian' : 'English';

  const styleGuide = getStyleGuide(config.style, palette);

  return `You are an expert web designer creating a stunning, modern scrollable HTML document — like Gamma.app or a high-end report website.

The output must be a SCROLLABLE PAGE (not a slideshow). Each section fills the viewport height and the user scrolls down through them.

DOCUMENT TO SUMMARIZE:
Filename: ${filename}
Language: ${lang}

USE CASE: ${config.useCase.toUpperCase()}
${useCaseInstructions}

TARGET: approximately ${config.slideCount} sections.

---

TECHNICAL STACK:
- Pure HTML5 + CSS3 + vanilla JS (no frameworks)
- Chart.js from CDN: https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js
- Google Fonts (choose 1-2 fonts matching the style)
- All styles inline in <style> block
- NO external CSS files

---

${styleGuide}

---

SECTION TYPES — use a variety of these:

1. HERO section (always first):
   - Full viewport, centered content
   - Large title (3-4em), subtitle, optional tag/badge
   - Decorative background shape or gradient

2. STATS section:
   - 3-4 big numbers in a grid
   - Each: giant number + unit + label below
   - Use real data from the document

3. CONTENT section (standard):
   - Section title + 4-6 bullet points or paragraphs
   - Optional icon or number marker per item

4. CHART section:
   - Title + Chart.js canvas
   - Use real data from the document
   - Choose the most appropriate chart type (bar, pie, doughnut, line)
   - Canvas id must be unique (chart1, chart2, etc.)

5. HIGHLIGHT / QUOTE section:
   - Large pull quote or key fact
   - Centered, big typography, accent color background

6. CARDS GRID section:
   - 2-3 cards side by side
   - Each card: icon/emoji + title + short description

7. TIMELINE section (if document has chronological data):
   - Vertical timeline with dates and events

8. CTA / CLOSING section (always last):
   - Strong closing message
   - Contact info or next steps if available

---

DESIGN RULES:
- Each section: min-height: 100vh, padding: 80px 10%
- Smooth scroll: scroll-behavior: smooth on html
- Sections alternate or vary background (dark/light) for visual rhythm
- All charts MUST be initialized in a <script> block at the end of body
- Numbers and stats: use REAL data extracted from the document
- If no numeric data is found, use content sections and quotes instead
- NO placeholder text like "Lorem ipsum" or "[insert data here]"

---

DOCUMENT CONTENT:
${truncatedText}

---

OUTPUT: Return ONLY the complete HTML document. No markdown, no backticks, no explanation. Start with <!DOCTYPE html>.`;
}

function getStyleGuide(style: string, palette: { primary: string; secondary: string; bg: string; text: string; name: string }): string {
  const guides: Record<string, string> = {
    modern: `
VISUAL STYLE: Modern / Dark Tech
- Background: ${palette.bg} (dark)
- Text: ${palette.text}
- Accent: ${palette.primary}, ${palette.secondary}
- Font: Inter or Space Grotesk
- Sections: dark background with vivid accent elements
- Numbers/stats: ${palette.primary}, extra bold, very large (4-5em)
- Cards: dark background with ${palette.primary}20 border and subtle glow
- Charts: use ${palette.primary} and ${palette.secondary} as dataset colors
- Headings: uppercase or heavy weight, accent color
- Decorative elements: geometric shapes via CSS (circles, lines)`,

    minimal: `
VISUAL STYLE: Minimal / Editorial
- Background: #ffffff (white sections) alternating with #f8f9fa
- Text: #1a1a2e
- Accent: ${palette.primary}
- Font: DM Sans or Lato, light weight
- Sections: mostly white, very generous padding
- Numbers/stats: ${palette.primary}, large and bold
- Cards: white with light border and subtle shadow
- Charts: ${palette.primary} with transparency variants
- Headings: normal weight, thin bottom border in accent color
- Decorative elements: minimal lines, no heavy shapes`,

    professional: `
VISUAL STYLE: Professional / Corporate
- Background: alternating #0d1b2e (dark navy) and #f0f4f8 (light grey)
- Text on dark: #e8edf2 / Text on light: #1a2332
- Accent: ${palette.primary}, ${palette.secondary}
- Font: Source Sans 3 or IBM Plex Sans
- Sections: structured, grid-based layout
- Numbers/stats: ${palette.secondary}, large and bold
- Cards: clean white with top border in accent color
- Charts: professional palette using ${palette.primary} and ${palette.secondary}
- Headings: badge-style with colored background pill
- Tables: clean with alternating row colors`,

    creative: `
VISUAL STYLE: Creative / Bold
- Background: ${palette.bg} with gradient overlays per section
- Text: ${palette.text}
- Accent: ${palette.primary}, ${palette.secondary}
- Font: Poppins or Nunito, varied weights
- Sections: each section has a unique background gradient
- Numbers/stats: gradient text (${palette.primary} to ${palette.secondary}), very large
- Cards: glassmorphism (backdrop-filter: blur, semi-transparent background)
- Charts: gradient fills, ${palette.primary} to ${palette.secondary}
- Headings: gradient text, decorative underline
- Decorative elements: large blurred circles in background (::before/::after)`,
  };
  return guides[style] ?? guides['modern'];
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
