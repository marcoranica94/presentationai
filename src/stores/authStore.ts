import { create } from 'zustand';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, githubProvider } from '@/config/firebase';
import type { User } from '@/types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  needsAccessCode: boolean;
  error: string | null;
  loginAttempts: number;
  lockedUntil: number | null;

  initialize: () => () => void;
  loginWithGitHub: () => Promise<void>;
  verifyAccessCode: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const ALLOWED_USERS = (import.meta.env.VITE_ALLOWED_GITHUB_USERS || '')
  .split(',')
  .map((u: string) => u.trim().toLowerCase())
  .filter(Boolean);

const ACCESS_CODE = import.meta.env.VITE_ACCESS_CODE || '';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 min
const SESSION_KEY = 'pai_session_verified';

async function loadOrCreateUserDoc(firebaseUser: FirebaseUser): Promise<User> {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { uid: firebaseUser.uid, ...snap.data() } as User;
  }

  const newUser: Omit<User, 'uid'> = {
    githubUsername: (
      firebaseUser.providerData[0]?.displayName ||
      firebaseUser.displayName ||
      ''
    ).toLowerCase(),
    email: firebaseUser.email || '',
    avatarUrl: firebaseUser.photoURL || '',
    accessCodeHash: '',
    accessCodeSalt: '',
    createdAt: new Date(),
    lastLogin: new Date(),
    settings: {
      theme: 'auto',
      defaultStyle: 'modern',
      defaultPalette: 'indigo',
      autoSave: true,
    },
    usage: {
      projectsCreated: 0,
      htmlGenerated: 0,
      pdfExported: 0,
      pngExported: 0,
      published: 0,
      storageUsed: 0,
      aiCostsThisMonth: 0,
    },
  };

  await setDoc(ref, newUser);
  return { uid: firebaseUser.uid, ...newUser };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  user: null,
  loading: true,
  needsAccessCode: false,
  error: null,
  loginAttempts: 0,
  lockedUntil: null,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Se la sessione corrente ha già verificato il codice, carica subito l'utente
        const sessionVerified = sessionStorage.getItem(SESSION_KEY) === firebaseUser.uid;
        if (sessionVerified) {
          try {
            const userData = await loadOrCreateUserDoc(firebaseUser);
            set({ firebaseUser, user: userData, needsAccessCode: false, loading: false });
          } catch {
            set({ firebaseUser, needsAccessCode: true, loading: false });
          }
        } else {
          set({ firebaseUser, needsAccessCode: true, loading: false });
        }
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        set({ firebaseUser: null, user: null, needsAccessCode: false, loading: false });
      }
    });
    return unsubscribe;
  },

  loginWithGitHub: async () => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const githubUsername = (
        result.user.providerData[0]?.displayName ||
        result.user.displayName ||
        ''
      ).toLowerCase();

      if (ALLOWED_USERS.length > 0 && !ALLOWED_USERS.includes(githubUsername)) {
        await signOut(auth);
        set({ loading: false, error: 'Accesso negato. Utente non autorizzato.' });
      }
      // onAuthStateChanged gestisce il resto
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore di login';
      set({ loading: false, error: message });
    }
  },

  verifyAccessCode: async (code: string) => {
    const { firebaseUser, loginAttempts, lockedUntil } = get();
    if (!firebaseUser) return false;

    if (lockedUntil && Date.now() < lockedUntil) {
      const mins = Math.ceil((lockedUntil - Date.now()) / 60000);
      set({ error: `Account bloccato. Riprova tra ${mins} minuti.` });
      return false;
    }

    if (code !== ACCESS_CODE) {
      const newAttempts = loginAttempts + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        set({
          loginAttempts: newAttempts,
          lockedUntil: Date.now() + LOCKOUT_DURATION,
          error: 'Troppi tentativi. Account bloccato per 15 minuti.',
        });
      } else {
        set({
          loginAttempts: newAttempts,
          error: `Codice non valido (${MAX_ATTEMPTS - newAttempts} tentativi rimasti)`,
        });
      }
      return false;
    }

    try {
      const userData = await loadOrCreateUserDoc(firebaseUser);
      await updateDoc(doc(db, 'users', firebaseUser.uid), { lastLogin: new Date() });
      sessionStorage.setItem(SESSION_KEY, firebaseUser.uid);
      set({
        user: userData,
        needsAccessCode: false,
        loginAttempts: 0,
        lockedUntil: null,
        error: null,
      });
      return true;
    } catch {
      set({ error: 'Errore caricamento profilo' });
      return false;
    }
  },

  logout: async () => {
    sessionStorage.removeItem(SESSION_KEY);
    await signOut(auth);
    set({
      firebaseUser: null,
      user: null,
      needsAccessCode: false,
      error: null,
      loginAttempts: 0,
      lockedUntil: null,
    });
  },

  clearError: () => set({ error: null }),
}));
