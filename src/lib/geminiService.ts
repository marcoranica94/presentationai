import { geminiModel } from '@/config/gemini';
import type { GenerationConfig, PresentationStyle } from '@/types';
import { PALETTES } from '@/types';

const STYLE_DESCRIPTIONS: Record<PresentationStyle, string> = {
  modern: `
    - Dark background with vivid accent color
    - Bold, large typography (font-size: 2.5em+ for titles)
    - Minimal borders, flat elements
    - Strong color contrast
    - Clean bullet points with accent-colored markers`,
  minimal: `
    - Light/white background
    - Generous whitespace
    - Thin, elegant typography
    - Subtle grey tones
    - Simple underlines instead of heavy decorations`,
  professional: `
    - Navy/dark blue background or white
    - Structured layout with clear hierarchy
    - Tables and structured lists where appropriate
    - Formal, clean typography
    - Business-style color use`,
  creative: `
    - Gradient backgrounds
    - Mixed font sizes for visual rhythm
    - Decorative elements (circles, lines, shapes via CSS)
    - Bold color combinations
    - Dynamic and varied layouts per slide`,
};

function buildPrompt(
  text: string,
  filename: string,
  config: GenerationConfig
): string {
  const palette = PALETTES[config.palette] ?? PALETTES['indigo'];
  const styleDesc = STYLE_DESCRIPTIONS[config.style];
  const truncatedText = text.length > 40000 ? text.slice(0, 40000) + '\n[...]' : text;
  const lang = config.language === 'auto' ? 'same language as the document' : config.language === 'it' ? 'Italian' : 'English';

  return `You are an expert web developer creating a stunning HTML presentation.

Generate a complete, self-contained HTML5 presentation using Reveal.js based on the document below.

TECHNICAL REQUIREMENTS:
- Complete valid HTML5 document (<!DOCTYPE html> to </html>)
- Reveal.js 5.x from CDN: https://cdn.jsdelivr.net/npm/reveal.js@5/dist/
- All CSS and JS from CDN only (no external files)
- Embedded <style> block for all custom styles
- Works offline after initial CDN load

PRESENTATION STRUCTURE (${config.slideCount} slides ±2):
- Slide 1: Title slide — main topic + compelling subtitle + author/date
- Slides 2 to N-1: Content slides, each covering ONE focused topic
- Last slide: "Punti Chiave" or "Key Takeaways" — 3-5 bullet points summary

CONTENT RULES:
- Max 5-6 bullet points per slide
- Use short, punchy phrases (not full sentences)
- Bold key numbers, statistics, dates with <strong>
- Keep slides scannable — no walls of text
- Language: ${lang}

STYLE: ${config.style.toUpperCase()}
${styleDesc}

COLOR PALETTE: ${palette.name}
- Primary: ${palette.primary}
- Secondary: ${palette.secondary}
- Background: ${palette.bg}
- Text: ${palette.text}

REVEAL.JS CONFIG:
- transition: 'slide'
- backgroundTransition: 'fade'
- controls: true
- progress: true
- hash: true

DOCUMENT:
Filename: ${filename}

${truncatedText}

OUTPUT RULES:
- Return ONLY the raw HTML document
- No markdown code blocks, no backticks, no explanation
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

  onProgress?.('Generazione con Gemini AI...');

  const result = await geminiModel.generateContent(prompt);
  const response = result.response.text();

  onProgress?.('Elaborazione risposta...');

  // Strip markdown code blocks if Gemini wraps the HTML
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
