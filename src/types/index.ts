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
  defaultStyle: 'modern' | 'minimal' | 'professional' | 'creative';
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
