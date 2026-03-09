import { getGeminiModel } from '@/config/gemini';
import type { GenerationConfig, PresentationStyle, PresentationUseCase } from '@/types';
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

const USE_CASE_INSTRUCTIONS: Record<PresentationUseCase, string> = {
  general: `
Standard informative presentation. Be clear, structured, and balanced.`,

  political: `
This is a POLITICAL COMMUNICATION presentation. Apply these specific rules:
- Opening slide: strong, emotionally resonant headline and rallying subtitle
- Use persuasive, direct language — speak to values and identity
- Include clear CALL TO ACTION slides (what the audience should do/think/support)
- Highlight achievements, contrasts, and future vision
- Use rhetorical structures: problem → solution → call to action
- End with a powerful, memorable closing statement
- Tone: passionate, confident, inspiring`,

  municipal: `
This is a MUNICIPAL/INSTITUTIONAL COMMUNICATION for citizens. Apply these specific rules:
- Opening slide: clear institutional header with municipality name and topic
- Use plain, accessible language — avoid jargon, be inclusive
- Structure: context → what was done → how citizens are affected → contacts/next steps
- Include practical information: dates, numbers, offices, procedures
- Be transparent about data and sources
- Tone: formal but approachable, reassuring, service-oriented
- Last slide: contacts, resources, where to find more info`,
};

function buildPrompt(text: string, filename: string, config: GenerationConfig): string {
  const palette = PALETTES[config.palette] ?? PALETTES['indigo'];
  const styleDesc = STYLE_DESCRIPTIONS[config.style];
  const useCaseInstructions = USE_CASE_INSTRUCTIONS[config.useCase];
  const truncatedText = text.length > 40000 ? text.slice(0, 40000) + '\n[...]' : text;
  const lang = config.language === 'auto'
    ? 'same language as the document (auto-detect)'
    : config.language === 'it' ? 'Italian' : 'English';

  return `You are an expert web developer and communication specialist creating an HTML presentation.

Generate a complete, self-contained HTML5 presentation using Reveal.js based on the document below.

TECHNICAL REQUIREMENTS:
- Complete valid HTML5 document (<!DOCTYPE html> to </html>)
- Reveal.js 5.x from CDN: https://cdn.jsdelivr.net/npm/reveal.js@5/dist/
- All CSS and JS from CDN only (no external files)
- Embedded <style> block for all custom styles
- Works offline after initial CDN load

USE CASE: ${config.useCase.toUpperCase()}
${useCaseInstructions}

PRESENTATION STRUCTURE (${config.slideCount} slides ±2):
- Slide 1: Title slide — main topic + subtitle
- Slides 2 to N-1: Content slides, each covering ONE focused topic
- Last slide: summary or call to action (based on use case)

CONTENT RULES:
- Max 5-6 bullet points per slide
- Use short, punchy phrases
- Bold key numbers, statistics, dates with <strong>
- Keep slides scannable
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
