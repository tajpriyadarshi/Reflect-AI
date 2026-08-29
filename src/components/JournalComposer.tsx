import React, { useState } from 'react';
import { Send, Sparkles, RefreshCw, AlertCircle, Bookmark, Compass, Heart, Zap, Sun } from 'lucide-react';
import { MoodType } from '../types';

interface JournalComposerProps {
  onSubmit: (promptText: string, metadata: { mood: MoodType; tags: string[] }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
  disabled?: boolean;
}

const MOODS: { type: MoodType; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { type: 'Reflective', icon: Compass, color: 'bg-stone-100 text-stone-700 hover:bg-stone-200' },
  { type: 'Grateful', icon: Heart, color: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200' },
  { type: 'Energized', icon: Zap, color: 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200' },
  { type: 'Seeking Clarity', icon: Sparkles, color: 'bg-sky-50 text-sky-800 hover:bg-sky-100 border-sky-200' },
  { type: 'Peaceful', icon: Sun, color: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200' },
];

const PROMPT_STARTERS = [
  'What brought me a quiet moment of joy today?',
  'A complex challenge I am currently navigating is...',
  'What thoughts are occupying my headspace this evening?',
  'Something I am learning to let go of is...',
];

export const JournalComposer: React.FC<JournalComposerProps> = ({
  onSubmit,
  isLoading,
  error,
  onClearError,
  disabled = false,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType>('Reflective');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['daily-reflection']);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (clean && !tags.includes(clean) && tags.length < 5) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading || disabled) return;

    onClearError();
    try {
      await onSubmit(prompt.trim(), { mood: selectedMood, tags });
      // Only clear input buffer after successful persistence (Production Directive Guarantee)
      setPrompt('');
    } catch {
      // Input is preserved in prompt state so user doesn't lose their thought!
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 sm:p-6 transition-all">
      <div className="flex items-center justify-between mb-3">
        <label htmlFor="journal-prompt-input" className="font-serif text-base sm:text-lg font-medium text-stone-800 flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-700" />
          Today's Reflection & Entry
        </label>
        <span className="text-xs text-stone-400 font-mono">
          {prompt.length} characters
        </span>
      </div>

      {/* Prompt Starters */}
      <div className="mb-3 flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-stone-400 mr-1">Inspirations:</span>
        {PROMPT_STARTERS.map((starter, i) => (
          <button
            key={i}
            id={`prompt-starter-${i}`}
            type="button"
            onClick={() => {
              setPrompt(starter + ' ');
              onClearError();
            }}
            disabled={disabled || isLoading}
            className="text-xs bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/80 px-2.5 py-1 rounded-lg transition-colors text-left"
          >
            "{starter}"
          </button>
        ))}
      </div>

      {/* Main Textarea */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            id="journal-prompt-input"
            rows={4}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) onClearError();
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={
              disabled
                ? 'Sign in with Google to start recording real-time reflections...'
                : 'Write your thoughts, questions, or moments from today. Press Cmd/Ctrl + Enter to reflect...'
            }
            className="w-full rounded-xl border border-stone-200 p-3.5 sm:p-4 text-sm sm:text-base text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 transition resize-y min-h-[110px] bg-stone-50/50 disabled:bg-stone-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Mood Selector & Tags */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-stone-400 mr-1">Tone / Mood:</span>
            {MOODS.map(({ type, icon: Icon, color }) => {
              const isSelected = selectedMood === type;
              return (
                <button
                  key={type}
                  id={`mood-chip-${type.toLowerCase().replace(/\s+/g, '-')}`}
                  type="button"
                  onClick={() => setSelectedMood(type)}
                  disabled={disabled || isLoading}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                    isSelected
                      ? 'bg-amber-700 text-white border-amber-800 shadow-xs font-medium'
                      : `border-stone-200 ${color}`
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{type}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="submit-journal-entry-btn"
              type="submit"
              disabled={disabled || isLoading || !prompt.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-800 hover:bg-amber-900 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                  <span>Reflecting with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Reflect & Save</span>
                  <Send className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Feedback & Retry Directive */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-xs sm:text-sm animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Persistence Error: </span>
                <span>{error}</span>
                <p className="text-xs text-rose-600 mt-1">
                  Your written reflection is preserved above. You can retry anytime.
                </p>
              </div>
            </div>
            <button
              id="retry-save-btn"
              type="button"
              onClick={() => handleSubmit()}
              className="shrink-0 px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-medium text-xs transition-colors"
            >
              Retry Save
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
