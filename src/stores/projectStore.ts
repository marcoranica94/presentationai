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
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { parseFile } from '@/lib/fileParser';
import { generatePresentation } from '@/lib/geminiService';
import type { Project, GeneratedContent, GenerationConfig } from '@/types';

interface ProjectStore {
  projects: Project[];
  generations: Record<string, GeneratedContent[]>; // keyed by projectId
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
  generating: boolean;
  generatingStatus: string;
  error: string | null;

  fetchProjects: (userId: string) => Promise<void>;
  fetchGenerations: (projectId: string) => Promise<void>;
  uploadProject: (file: File, userId: string) => Promise<string | null>;
  deleteProject: (project: Project) => Promise<void>;
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
      const projects = snap.docs.map((d) => projectFromDoc(d.id, d.data() as Record<string, unknown>));
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
      const gens = snap.docs.map((d) => genFromDoc(d.id, d.data() as Record<string, unknown>));
      set((s) => ({ generations: { ...s.generations, [projectId]: gens } }));
    } catch {
      // non-fatal
    }
  },

  uploadProject: async (file, userId) => {
    set({ uploading: true, uploadProgress: 0, error: null });
    try {
      // 1. Upload to Storage
      const timestamp = Date.now();
      const storagePath = `documents/${userId}/${timestamp}-${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            set({ uploadProgress: pct });
          },
          reject,
          resolve
        );
      });

      // 2. Create Firestore doc
      const now = new Date();
      const projectData = {
        userId,
        name: file.name.replace(/\.[^.]+$/, ''),
        tags: [],
        originalFile: {
          name: file.name,
          size: file.size,
          type: file.type,
          storagePath,
          uploadedAt: now,
        },
        extractedText: '',
        metadata: {
          wordCount: 0,
          pageCount: 0,
          paragraphCount: 0,
          characterCount: 0,
          language: 'auto',
          processedAt: now,
          processingTime: 0,
        },
        status: 'processing',
        createdAt: now,
        updatedAt: now,
      };
      const docRef = await addDoc(collection(db, 'projects'), projectData);
      const projectId = docRef.id;

      // 3. Parse client-side
      const startParse = Date.now();
      const { text, metadata } = await parseFile(file);
      const parseTime = Date.now() - startParse;

      // 4. Update Firestore with extracted text
      const fullMetadata = {
        ...metadata,
        processedAt: new Date(),
        processingTime: parseTime,
      };
      await updateDoc(doc(db, 'projects', projectId), {
        extractedText: text.slice(0, 800_000), // Firestore 1MB limit guard
        metadata: fullMetadata,
        status: 'ready',
        updatedAt: new Date(),
      });

      // 5. Refresh list
      await get().fetchProjects(userId);
      set({ uploading: false });
      return projectId;
    } catch (err) {
      set({ error: String(err), uploading: false });
      return null;
    }
  },

  deleteProject: async (project) => {
    try {
      // Delete storage file
      try {
        await deleteObject(ref(storage, project.originalFile.storagePath));
      } catch {
        // file might not exist
      }
      // Delete Firestore doc
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

      set({ generatingStatus: 'Salvataggio su Firebase...' });

      // Upload HTML to Storage
      const timestamp = Date.now();
      const storagePath = `generated/${project.userId}/${project.id}/${timestamp}.html`;
      const storageRef = ref(storage, storagePath);
      const blob = new Blob([html], { type: 'text/html' });
      await uploadBytesResumable(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      // Create generated_content doc
      const genData: Omit<GeneratedContent, 'id'> = {
        projectId: project.id,
        userId: project.userId,
        style: config.style,
        palette: config.palette,
        slideCount: config.slideCount,
        htmlContent: html,
        storagePath,
        downloadUrl,
        createdAt: new Date(),
      };
      const genRef = await addDoc(collection(db, 'generated_content'), genData);
      const generated: GeneratedContent = { id: genRef.id, ...genData };

      // Update project usage in local state
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
