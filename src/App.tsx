import React, { useState, useEffect, useMemo } from 'react';
import { onAuthUserChanged, User, signInWithGoogle, signOutUser } from './firebase';
import { useJournal } from './useJournal';
import { Header } from './components/Header';
import { JournalComposer } from './components/JournalComposer';
import { JournalEntryCard } from './components/JournalEntryCard';
import { JournalFilter } from './components/JournalFilter';
import { JournalStats } from './components/JournalStats';
import { AuthBanner } from './components/AuthBanner';
import { Sparkles, BookOpen, ShieldCheck, Feather, HeartHandshake } from 'lucide-react';
import { MoodType } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Journal hook integration
  const { entries, sendEntry, deleteEntry, isLoading: isSavingEntry, error: journalError, clearError } = useJournal(user);

  // Filtering & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('All');

  // Monitor Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthUserChanged((currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        setAuthError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setAuthError(err?.message || 'Failed to authenticate with Google. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  const handleSendEntry = async (promptText: string, metadata: { mood: MoodType; tags: string[] }) => {
    if (!user) {
      await handleSignIn();
      return;
    }
    await sendEntry(promptText, metadata);
  };

  // Filtered entries list
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        !searchQuery.trim() ||
        entry.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.reply.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesMood =
        selectedMoodFilter === 'All' ||
        (entry.mood && entry.mood.toLowerCase() === selectedMoodFilter.toLowerCase());

      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, selectedMoodFilter]);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-amber-200 selection:text-amber-900">
      {/* Global Navigation Header */}
      <Header
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isAuthLoading={isAuthLoading}
        totalEntries={entries.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
            <span>{authError}</span>
            <button
              onClick={() => setAuthError(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Not Logged In View */}
        {!user && !isAuthLoading && (
          <AuthBanner onSignIn={handleSignIn} isLoading={isAuthLoading} />
        )}

        {/* Overview Stats for Active User */}
        {user && <JournalStats entries={entries} />}

        {/* Journal Creation Section */}
        <section className="mb-8" aria-label="Journal entry composer">
          <JournalComposer
            onSubmit={handleSendEntry}
            isLoading={isSavingEntry}
            error={journalError}
            onClearError={clearError}
            disabled={!user}
          />
        </section>

        {/* Timeline & Past Reflections Section */}
        {user && (
          <section className="space-y-4" aria-label="Past reflections timeline">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Feather className="w-4 h-4 text-amber-800" />
                <h2 className="font-serif text-lg sm:text-xl font-medium text-stone-900">
                  Your Reflective Timeline
                </h2>
              </div>
            </div>

            {entries.length > 0 && (
              <JournalFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedMoodFilter={selectedMoodFilter}
                onMoodFilterChange={setSelectedMoodFilter}
                totalCount={entries.length}
                filteredCount={filteredEntries.length}
              />
            )}

            {filteredEntries.length > 0 ? (
              <div className="space-y-5">
                {filteredEntries.map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={deleteEntry}
                  />
                ))}
              </div>
            ) : entries.length > 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8">
                <BookOpen className="w-8 h-8 text-stone-400 mx-auto mb-3" />
                <p className="text-stone-700 font-serif text-base font-medium">
                  No matching reflections found
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Try adjusting your search keywords or mood filter.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMoodFilter('All');
                  }}
                  className="mt-4 inline-flex text-xs text-amber-800 font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-stone-300 p-8">
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-800 mx-auto mb-3">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-medium text-stone-900">
                  Your journal is currently empty
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                  Take a quiet pause. Use the prompt box above to write your first reflection, and let your AI companion offer insightful, thoughtful guidance.
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12 text-center text-xs text-stone-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-serif text-stone-800 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Reflective AI Journal</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Owner-Bound Firestore Rules
            </span>
            <span>•</span>
            <span>Gemini Model Fallback Ladder</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
