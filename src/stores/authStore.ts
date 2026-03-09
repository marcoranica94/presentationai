import { create } from 'zustand';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, githubProvider } from '@/config/firebase';
import { hashCode, generateSalt } from '@/lib/utils';
import type { User } from '@/types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  needsAccessCode: boolean;
  isFirstAccess: boolean;
  error: string | null;
  loginAttempts: number;
  lockedUntil: number | null;

  initialize: () => () => void;
  loginWithGitHub: () => Promise<void>;
  verifyAccessCode: (code: string) => Promise<boolean>;
  setAccessCode: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const ALLOWED_USERS = (import.meta.env.VITE_ALLOWED_GITHUB_USERS || '')
  .split(',')
  .map((u: string) => u.trim().toLowerCase())
  .filter(Boolean);

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 min

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  user: null,
  loading: true,
  needsAccessCode: false,
  isFirstAccess: false,
  error: null,
  loginAttempts: 0,
  lockedUntil: null,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            if (userData.accessCodeHash) {
              set({
                firebaseUser,
                needsAccessCode: true,
                isFirstAccess: false,
                loading: false,
              });
            } else {
              set({
                firebaseUser,
                needsAccessCode: true,
                isFirstAccess: true,
                loading: false,
              });
            }
          } else {
            set({
              firebaseUser,
              needsAccessCode: true,
              isFirstAccess: true,
              loading: false,
            });
          }
        } catch {
          set({ firebaseUser, loading: false, error: 'Errore caricamento profilo' });
        }
      } else {
        set({
          firebaseUser: null,
          user: null,
          loading: false,
          needsAccessCode: false,
          isFirstAccess: false,
        });
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
        return;
      }
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

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) return false;

      const userData = userDoc.data();
      const hash = await hashCode(code, userData.accessCodeSalt);

      if (hash === userData.accessCodeHash) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLogin: new Date(),
        });
        set({
          user: { uid: firebaseUser.uid, ...userData } as User,
          needsAccessCode: false,
          loginAttempts: 0,
          lockedUntil: null,
          error: null,
        });
        return true;
      } else {
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
    } catch {
      set({ error: 'Errore verifica codice' });
      return false;
    }
  },

  setAccessCode: async (code: string) => {
    const { firebaseUser } = get();
    if (!firebaseUser) return;

    const salt = generateSalt();
    const hash = await hashCode(code, salt);

    const userData: Partial<User> = {
      uid: firebaseUser.uid,
      githubUsername: (
        firebaseUser.providerData[0]?.displayName ||
        firebaseUser.displayName ||
        ''
      ).toLowerCase(),
      email: firebaseUser.email || '',
      avatarUrl: firebaseUser.photoURL || '',
      accessCodeHash: hash,
      accessCodeSalt: salt,
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

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    set({
      user: userData as User,
      needsAccessCode: false,
      isFirstAccess: false,
      error: null,
    });
  },

  logout: async () => {
    await signOut(auth);
    set({
      firebaseUser: null,
      user: null,
      needsAccessCode: false,
      isFirstAccess: false,
      error: null,
      loginAttempts: 0,
      lockedUntil: null,
    });
  },

  clearError: () => set({ error: null }),
}));
