import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuration injected by Firebase setup
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB192iLvLyG_ME9C97TtS5RJ182M_yHIvw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "healthy-genre-503816-q9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "healthy-genre-503816-q9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "healthy-genre-503816-q9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "106627690371",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:106627690371:web:c945df66cc9b6a139c90b6",
  firestoreDatabaseId: "ai-studio-ca9ec604-48ab-4663-99be-a76a6f68af7e"
};

const app = !getApps().length ? initializeApp(config) : getApp();

export const auth = getAuth(app);
export const db: Firestore = getFirestore(app, config.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

/**
 * Production Directive: Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Strips undefined properties before submitting documents to Firestore.
 */
export function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => (value === undefined ? null : value))
  );
}

export function onAuthUserChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { onAuthStateChanged };
export type { User };
