export interface User {
  uid: string;
  githubUsername: string;
  email: string;
  avatarUrl: string;
  accessCodeHash: string;
  accessCodeSalt: string;
  createdAt: Date;
  lastLogin: Date;
  settings: UserSettings;
  usage: UserUsage;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  defaultStyle: PresentationStyle;
  defaultPalette: string;
  autoSave: boolean;
}

export interface UserUsage {
  projectsCreated: number;
  htmlGenerated: number;
  pdfExported: number;
  pngExported: number;
  published: number;
  storageUsed: number;
  aiCostsThisMonth: number;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  tags: string[];
  originalFile: {
    name: string;
    size: number;
    type: string;
    storagePath: string;
    uploadedAt: Date;
  };
  extractedText: string;
  metadata: ProjectMetadata;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error?: {
    message: string;
    code: string;
    timestamp: Date;
    retryCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMetadata {
  wordCount: number;
  pageCount: number;
  paragraphCount: number;
  characterCount: number;
  language: 'it' | 'en' | 'auto';
  processedAt: Date;
  processingTime: number;
}

export interface GeneratedContent {
  id: string;
  projectId: string;
  userId: string;
  style: PresentationStyle;
  palette: string;
  slideCount: number;
  htmlContent: string;
  storagePath: string;
  downloadUrl: string;
  createdAt: Date;
}

export type PresentationStyle = 'modern' | 'minimal' | 'professional' | 'creative';

export interface GenerationConfig {
  style: PresentationStyle;
  palette: string;
  slideCount: number;
  language: 'auto' | 'it' | 'en';
}

export const PALETTES: Record<string, { name: string; primary: string; secondary: string; bg: string; text: string }> = {
  indigo:   { name: 'Indigo',   primary: '#6366f1', secondary: '#818cf8', bg: '#0f0a2e', text: '#f1f5f9' },
  blue:     { name: 'Blue',     primary: '#3b82f6', secondary: '#60a5fa', bg: '#0c1a2e', text: '#f1f5f9' },
  emerald:  { name: 'Emerald',  primary: '#10b981', secondary: '#34d399', bg: '#0a1f17', text: '#f1f5f9' },
  rose:     { name: 'Rose',     primary: '#f43f5e', secondary: '#fb7185', bg: '#1f0a10', text: '#f1f5f9' },
  amber:    { name: 'Amber',    primary: '#f59e0b', secondary: '#fbbf24', bg: '#1f140a', text: '#f1f5f9' },
  slate:    { name: 'Slate',    primary: '#64748b', secondary: '#94a3b8', bg: '#0f172a', text: '#f1f5f9' },
};

export const STYLES: Record<PresentationStyle, { name: string; description: string }> = {
  modern:       { name: 'Modern',       description: 'Bold, flat design con tipografia forte' },
  minimal:      { name: 'Minimal',      description: 'Spazi bianchi, elegante e sobrio' },
  professional: { name: 'Professional', description: 'Corporate, strutturato e formale' },
  creative:     { name: 'Creative',     description: 'Colorato, dinamico e visivamente ricco' },
};
