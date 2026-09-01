import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, Firestore } from 'firebase/firestore';
import { AppState, FirebaseCustomConfig } from '../types';

const STORAGE_KEY_FIREBASE_CONFIG = 'bodyplan_firebase_config';

// Отримання конфігурації з localStorage або з змінних середовища Vite
export function getSavedFirebaseConfig(): FirebaseCustomConfig | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Перевірка змінних середовища VITE_FIREBASE_*
    if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      return {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      };
    }
  } catch (e) {
    console.error('Error reading Firebase config', e);
  }
  return null;
}

export function saveFirebaseConfig(config: FirebaseCustomConfig | null) {
  if (!config) {
    localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
  } else {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
  }
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function initFirebase(config?: FirebaseCustomConfig | null): { auth: Auth | null; db: Firestore | null } {
  const finalConfig = config || getSavedFirebaseConfig();
  if (!finalConfig || !finalConfig.apiKey || !finalConfig.projectId) {
    return { auth: null, db: null };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(finalConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    return { auth, db };
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    return { auth: null, db: null };
  }
}

export async function loginWithGoogle(): Promise<User | null> {
  const { auth: currentAuth } = initFirebase();
  if (!currentAuth) {
    throw new Error('Firebase не налаштовано. Будь ласка, вкажіть конфігурацію Firebase у налаштуваннях.');
  }
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const result = await signInWithPopup(currentAuth, provider);
  return result.user;
}

export async function logoutGoogle(): Promise<void> {
  const { auth: currentAuth } = initFirebase();
  if (currentAuth) {
    await signOut(currentAuth);
  }
}

export async function saveUserDataToFirestore(userId: string, state: Partial<AppState>): Promise<void> {
  const { db: currentDb } = initFirebase();
  if (!currentDb) return;
  try {
    const userDocRef = doc(currentDb, 'users', userId);
    await setDoc(userDocRef, {
      ...state,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving data to Firestore:', error);
    throw error;
  }
}

export async function loadUserDataFromFirestore(userId: string): Promise<Partial<AppState> | null> {
  const { db: currentDb } = initFirebase();
  if (!currentDb) return null;
  try {
    const userDocRef = doc(currentDb, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as Partial<AppState>;
    }
  } catch (error) {
    console.error('Error loading data from Firestore:', error);
  }
  return null;
}
