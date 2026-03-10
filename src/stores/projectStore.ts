import { create } from 'zustand';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { parseFile } from '@/lib/fileParser';
import { generatePresentation } from '@/lib/geminiService';
import type { Project, GeneratedContent, GenerationConfig } from '@/types';

interface ProjectStore {
  projects: Project[];
  generations: Record<string, GeneratedContent[]>;
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
  generating: boolean;
  generatingStatus: string;
  error: string | null;

  fetchProjects: (userId: string) => Promise<void>;
  fetchGenerations: (projectId: string) => Promise<void>;
  fetchAllGenerations: (userId: string) => Promise<GeneratedContent[]>;
  uploadProject: (file: File, userId: string) => Promise<string | null>;
  deleteProject: (project: Project) => Promise<void>;
  deleteGeneration: (id: string) => Promise<void>;
  generateHTML: (project: Project, config: GenerationConfig) => Promise<GeneratedContent | null>;
  clearError: () => void;
}

function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date();
}

function projectFromDoc(id: string, data: Record<string, unknown>): Project {
  return {
    ...(data as Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'originalFile' | 'metadata'>),
    id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    originalFile: {
      ...(data.originalFile as Project['originalFile']),
      uploadedAt: toDate((data.originalFile as Record<string, unknown>)?.uploadedAt),
    },
    metadata: {
      ...(data.metadata as Project['metadata']),
      processedAt: toDate((data.metadata as Record<string, unknown>)?.processedAt),
    },
  };
}

function genFromDoc(id: string, data: Record<string, unknown>): GeneratedContent {
  return {
    ...(data as Omit<GeneratedContent, 'id' | 'createdAt'>),
    id,
    createdAt: toDate(data.createdAt),
  };
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  generations: {},
  loading: false,
  uploading: false,
  uploadProgress: 0,
  generating: false,
  generatingStatus: '',
  error: null,

  fetchProjects: async (userId) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const projects = snap.docs.map((d) =>
        projectFromDoc(d.id, d.data() as Record<string, unknown>)
      );
      set({ projects, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  fetchGenerations: async (projectId) => {
    try {
      const q = query(
        collection(db, 'generated_content'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const gens = snap.docs.map((d) =>
        genFromDoc(d.id, d.data() as Record<string, unknown>)
      );
      set((s) => ({ generations: { ...s.generations, [projectId]: gens } }));
    } catch {
      // non-fatal
    }
  },

  uploadProject: async (file, userId) => {
    set({ uploading: true, uploadProgress: 0, error: null });
    try {
      // 1. Parse file client-side (no Storage)
      set({ uploadProgress: 10 });
      const startParse = Date.now();
      const { text, metadata } = await parseFile(file);
      const parseTime = Date.now() - startParse;
      set({ uploadProgress: 70 });

      // 2. Create Firestore doc with everything
      const now = new Date();
      const projectData = {
        userId,
        name: file.name.replace(/\.[^.]+$/, ''),
        tags: [],
        originalFile: {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: now,
        },
        extractedText: text.slice(0, 800_000),
        metadata: {
          ...metadata,
          processedAt: now,
          processingTime: parseTime,
        },
        status: 'ready',
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, 'projects'), projectData);
      set({ uploadProgress: 100 });

      await get().fetchProjects(userId);
      set({ uploading: false });
      return docRef.id;
    } catch (err) {
      set({ error: String(err), uploading: false });
      return null;
    }
  },

  fetchAllGenerations: async (userId) => {
    // Primary: query by userId with index
    try {
      const q = query(
        collection(db, 'generated_content'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const results = snap.docs.map((d) => genFromDoc(d.id, d.data() as Record<string, unknown>));
      console.log('[fetchAllGenerations] primary query found:', results.length);
      if (results.length > 0) return results;
    } catch (err) {
      console.warn('[fetchAllGenerations] primary query failed:', err);
    }

    // Fallback: fetch via user's projects
    try {
      const { projects } = get();
      const projectIds = projects.length > 0
        ? projects.map((p) => p.id)
        : await (async () => {
            const pq = query(collection(db, 'projects'), where('userId', '==', userId));
            const ps = await getDocs(pq);
            return ps.docs.map((d) => d.id);
          })();

      if (projectIds.length === 0) return [];

      // Firestore 'in' operator supports max 30 items per query
      const chunks: string[][] = [];
      for (let i = 0; i < projectIds.length; i += 30) chunks.push(projectIds.slice(i, i + 30));

      const allGens: GeneratedContent[] = [];
      for (const chunk of chunks) {
        const q = query(
          collection(db, 'generated_content'),
          where('projectId', 'in', chunk)
        );
        const snap = await getDocs(q);
        snap.docs.forEach((d) => allGens.push(genFromDoc(d.id, d.data() as Record<string, unknown>)));
      }

      allGens.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      console.log('[fetchAllGenerations] fallback found:', allGens.length);
      return allGens;
    } catch (err) {
      console.error('[fetchAllGenerations] fallback also failed:', err);
      return [];
    }
  },

  deleteGeneration: async (id) => {
    await deleteDoc(doc(db, 'generated_content', id));
  },

  deleteProject: async (project) => {
    try {
      await deleteDoc(doc(db, 'projects', project.id));
      set((s) => ({ projects: s.projects.filter((p) => p.id !== project.id) }));
    } catch (err) {
      set({ error: String(err) });
    }
  },

  generateHTML: async (project, config) => {
    set({ generating: true, generatingStatus: 'Avvio generazione...', error: null });
    try {
      const html = await generatePresentation(
        project.extractedText,
        project.originalFile.name,
        config,
        (status) => set({ generatingStatus: status })
      );

      set({ generatingStatus: 'Salvataggio...' });

      // Save directly to Firestore (no Storage needed)
      const genData: Omit<GeneratedContent, 'id'> = {
        projectId: project.id,
        userId: project.userId,
        style: config.style,
        palette: config.palette,
        slideCount: config.slideCount,
        useCase: config.useCase,
        model: config.model,
        htmlContent: html,
        isPublic: false,
        createdAt: new Date(),
      };
      const genRef = await addDoc(collection(db, 'generated_content'), genData);
      const generated: GeneratedContent = { id: genRef.id, ...genData };

      // Update project htmlGenerated count
      await updateDoc(doc(db, 'projects', project.id), { updatedAt: new Date() });

      set((s) => ({
        generating: false,
        generatingStatus: '',
        generations: {
          ...s.generations,
          [project.id]: [generated, ...(s.generations[project.id] ?? [])],
        },
      }));

      return generated;
    } catch (err) {
      set({ error: String(err), generating: false, generatingStatus: '' });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
