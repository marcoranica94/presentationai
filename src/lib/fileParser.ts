import type { ProjectMetadata } from '@/types';

export interface ParseResult {
  text: string;
  metadata: Omit<ProjectMetadata, 'processedAt' | 'processingTime'>;
}

async function parsePDF(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const texts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    texts.push(pageText);
  }

  return texts.join('\n\n');
}

async function parseDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

function parseTXT(file: File): Promise<string> {
  return file.text();
}

function analyzeText(text: string): ParseResult['metadata'] {
  const words = text.split(/\s+/).filter(Boolean);
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 20);
  const italianWords = ['della', 'degli', 'delle', 'nella', 'negli', 'nelle', 'che', 'con', 'per', 'una', 'del'];
  const italianCount = italianWords.filter((w) => text.toLowerCase().includes(w)).length;

  return {
    wordCount: words.length,
    pageCount: Math.max(1, Math.ceil(words.length / 250)),
    paragraphCount: paragraphs.length,
    characterCount: text.length,
    language: italianCount >= 4 ? 'it' : 'en',
  };
}

export async function parseFile(file: File): Promise<ParseResult> {
  let text = '';

  if (file.type === 'application/pdf') {
    text = await parsePDF(file);
  } else if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    text = await parseDOCX(file);
  } else {
    text = await parseTXT(file);
  }

  text = text.replace(/\s{3,}/g, '\n\n').trim();

  return {
    text,
    metadata: analyzeText(text),
  };
}

export const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
