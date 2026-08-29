import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, sanitizePayload } from './firebase';
import { JournalEntry } from './types';

export function useJournal(user: any) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for user's past entries
  useEffect(() => {
    if (!user || !user.uid) {
      setEntries([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'users', user.uid, 'journals'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<JournalEntry, 'id'>),
          }));
          setEntries(list);
          setError(null);
        },
        (err) => {
          console.error('Firestore snapshot listener error:', err);
          setError('Failed to sync entries with Firestore. Please check your connection.');
        }
      );
      return () => unsubscribe();
    } catch (err: any) {
      console.error('Failed to bind real-time listener:', err);
      setError(err?.message || 'Error connecting to database.');
    }
  }, [user?.uid]);

  const sendEntry = async (
    promptText: string,
    metadata?: {
      mood?: string;
      tags?: string[];
      entryType?: 'written' | 'spoken';
      spokenAudioDuration?: number;
    }
  ): Promise<{ reply: string } | undefined> => {
    if (!user || !promptText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Build context history from previous entries in chronological order
      const chronological = [...entries].reverse();
      const history = chronological.slice(-8).map((e) => [
        { role: 'user' as const, text: e.prompt },
        { role: 'model' as const, text: e.reply }
      ]).flat();

      // Call server-side API route
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, prompt: promptText.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${res.status})`);
      }

      const { reply } = await res.json();

      if (!reply) {
        throw new Error('Received an empty reflection from the AI model.');
      }

      // Persist to user's private subcollection in Firestore with undefined-stripped payload
      const payload = sanitizePayload({
        prompt: promptText.trim(),
        reply,
        mood: metadata?.mood || 'Reflective',
        tags: metadata?.tags || ['reflection'],
        entryType: metadata?.entryType || 'written',
        spokenAudioDuration: metadata?.spokenAudioDuration || 0,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'users', user.uid, 'journals'), payload);
      return { reply };
    } catch (err: any) {
      console.error('Failed to generate or save reflection:', err);
      const message = err?.message || 'Failed to save reflection to Firestore.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!user?.uid || !entryId) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'journals', entryId));
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      setError('Could not delete journal entry. Please try again.');
      throw err;
    }
  };

  return {
    entries,
    sendEntry,
    deleteEntry,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}
