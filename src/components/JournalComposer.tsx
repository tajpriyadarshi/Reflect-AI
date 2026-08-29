import React, { useState, useEffect } from 'react';
import {
  Send,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Bookmark,
  Compass,
  Heart,
  Zap,
  Sun,
  Mic,
  MicOff,
  PenTool,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  RotateCcw
} from 'lucide-react';
import { MoodType } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { speakText, isSpeechSynthesisSupported } from '../utils/speech';

interface JournalComposerProps {
  onSubmit: (
    promptText: string,
    metadata: {
      mood: MoodType;
      tags: string[];
      entryType: 'written' | 'spoken';
      spokenAudioDuration?: number;
    }
  ) => Promise<{ reply: string } | undefined | void>;
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
  const [mode, setMode] = useState<'written' | 'spoken'>('written');
  const [prompt, setPrompt] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType>('Reflective');
  const [tags, setTags] = useState<string[]>(['daily-reflection']);
  const [autoSpeakReply, setAutoSpeakReply] = useState(true);

  // Speech Recognition hook
  const {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    recordingSeconds,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition({
    onResult: (newTranscript) => {
      setPrompt(newTranscript);
      if (error) onClearError();
    },
  });

  // Keep prompt synced if transcript changes
  useEffect(() => {
    if (transcript && mode === 'spoken') {
      setPrompt(transcript);
    }
  }, [transcript, mode]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      if (speechError) onClearError();
      startListening();
    }
  };

  const handleModeChange = (newMode: 'written' | 'spoken') => {
    if (isListening) stopListening();
    setMode(newMode);
    onClearError();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isListening) stopListening();
    if (!prompt.trim() || isLoading || disabled) return;

    onClearError();
    try {
      const result = await onSubmit(prompt.trim(), {
        mood: selectedMood,
        tags,
        entryType: mode,
        spokenAudioDuration: mode === 'spoken' ? recordingSeconds : 0,
      });

      // If spoken mode with auto-speak enabled, read out AI reflection
      if (autoSpeakReply && result && result.reply) {
        speakText(result.reply);
      }

      // Clear input buffers safely after confirmed persistence
      setPrompt('');
      resetTranscript();
    } catch {
      // Input state is safely preserved for retry
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 sm:p-6 transition-all">
      {/* Mode Switcher Tabs: Written vs Spoken Reflection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-700" />
          <h2 className="font-serif text-base sm:text-lg font-medium text-stone-800">
            Journal Reflection
          </h2>
        </div>

        {/* High-visibility Mode Switcher */}
        <div className="flex items-center gap-2 p-1 bg-stone-100/90 rounded-xl">
          <button
            id="mode-written-tab"
            type="button"
            onClick={() => handleModeChange('written')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'written'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/50'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-amber-700" />
            <span>Written Reflection</span>
          </button>

          <button
            id="mode-spoken-tab"
            type="button"
            onClick={() => handleModeChange('spoken')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'spoken'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:text-rose-900 hover:bg-rose-50'
            }`}
          >
            <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-bounce' : ''}`} />
            <span>🎙️ Spoken (Voice Reflection)</span>
            {isListening && (
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* SPOKEN REFLECTION INTERACTION HERO PANEL */}
      {mode === 'spoken' ? (
        <div className="mb-5 p-5 rounded-2xl bg-gradient-to-br from-rose-50 via-amber-50/40 to-stone-50 border-2 border-rose-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                id="voice-dictation-toggle-btn"
                type="button"
                onClick={toggleListening}
                disabled={disabled || isLoading}
                className={`relative inline-flex items-center justify-center w-16 h-16 rounded-full transition-all cursor-pointer shadow-md ${
                  isListening
                    ? 'bg-rose-600 text-white ring-8 ring-rose-200 scale-105 animate-pulse'
                    : 'bg-stone-900 text-white hover:bg-stone-800 hover:scale-105'
                }`}
                title={isListening ? 'Stop Speaking' : 'Start Speaking'}
              >
                {isListening ? (
                  <MicOff className="w-7 h-7" />
                ) : (
                  <Mic className="w-7 h-7 text-rose-300" />
                )}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-stone-900">
                    {isListening ? 'Listening to your voice...' : 'Tap the Microphone to Speak'}
                  </h3>
                  {isListening && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-600 text-white font-bold animate-pulse">
                      <Radio className="w-3 h-3" />
                      {formatSeconds(recordingSeconds)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  {isListening
                    ? 'Speak freely. Your words are live-transcribed in real time below.'
                    : 'Share what happened today, feelings you are working through, or quiet gratitude.'}
                </p>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {isListening ? (
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition"
                >
                  Done Speaking
                </button>
              ) : null}

              {/* Auto-read response toggle */}
              {isSpeechSynthesisSupported() && (
                <label className="inline-flex items-center gap-2 text-xs text-stone-700 bg-white border border-stone-200 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-stone-50 transition shadow-2xs">
                  <input
                    type="checkbox"
                    checked={autoSpeakReply}
                    onChange={(e) => setAutoSpeakReply(e.target.checked)}
                    className="rounded text-amber-700 focus:ring-amber-700 w-3.5 h-3.5"
                  />
                  {autoSpeakReply ? (
                    <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                  )}
                  <span>Read AI reflection aloud</span>
                </label>
              )}
            </div>
          </div>

          {/* Equalizer animation when listening */}
          {isListening && (
            <div className="flex items-center gap-1.5 justify-center py-2 bg-white/70 rounded-xl border border-rose-100">
              {[30, 70, 95, 60, 90, 45, 80, 65, 100, 50, 75, 40].map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-rose-500 rounded-full transition-all duration-150 animate-pulse"
                  style={{
                    height: `${Math.max(10, (height * (1 + (i % 3) * 0.2)) / 3)}px`,
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Interim live speech transcript preview */}
          {interimTranscript && (
            <div className="text-xs text-rose-800 font-medium italic bg-white/80 p-2.5 rounded-xl border border-rose-200">
              "... {interimTranscript}"
            </div>
          )}

          {speechError && (
            <div className="p-3 rounded-xl bg-rose-100 text-rose-900 text-xs flex items-center gap-2 border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}
        </div>
      ) : (
        /* WRITTEN MODE HEADER TOOLBAR: Includes Quick Voice Dictate shortcut */
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {/* Inspiration Starters */}
          <div className="flex flex-wrap gap-1.5 items-center">
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

          {/* Quick Speak Button in Written View */}
          <button
            id="quick-dictate-btn"
            type="button"
            onClick={() => {
              handleModeChange('spoken');
              setTimeout(() => {
                startListening();
              }, 50);
            }}
            disabled={disabled || isLoading}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-2xs"
            title="Switch to Voice Mode & Dictate"
          >
            <Mic className="w-3.5 h-3.5 text-rose-600" />
            <span>Quick Voice Dictate</span>
          </button>
        </div>
      )}

      {/* Main Textarea (Used for typing or reviewing/editing spoken transcript) */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            id="journal-prompt-input"
            rows={mode === 'spoken' ? 3 : 4}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) onClearError();
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={
              disabled
                ? 'Sign in with Google to record reflections...'
                : mode === 'spoken'
                ? 'Your spoken words will appear here. You can edit them freely before submitting...'
                : 'Write your thoughts, emotions, or experiences. Press Cmd/Ctrl + Enter to reflect...'
            }
            className="w-full rounded-xl border border-stone-200 p-3.5 sm:p-4 text-sm sm:text-base text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 transition resize-y min-h-[100px] bg-stone-50/50 disabled:bg-stone-100 disabled:cursor-not-allowed"
          />

          {/* Bottom Right Floating Controls */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            {/* Direct Microphone Toggle in Corner */}
            <button
              id="textarea-mic-button"
              type="button"
              onClick={toggleListening}
              disabled={disabled || isLoading}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse shadow-sm'
                  : 'bg-white text-stone-600 hover:text-stone-900 border-stone-200 shadow-2xs hover:bg-stone-50'
              }`}
              title={isListening ? 'Stop Recording' : 'Dictate with Microphone'}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">{formatSeconds(recordingSeconds)}</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline text-[11px]">Mic</span>
                </>
              )}
            </button>

            {prompt && (
              <button
                type="button"
                onClick={() => {
                  setPrompt('');
                  resetTranscript();
                }}
                className="text-[11px] text-stone-400 hover:text-stone-600 bg-white px-2 py-1 rounded-lg border border-stone-200 transition-colors"
                title="Clear input"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Mood Selector & Submission Action Bar */}
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
                  <span>{mode === 'spoken' ? 'Save & Reflect' : 'Reflect & Save'}</span>
                  <Send className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Feedback & Persistence Retry Directive */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-xs sm:text-sm animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Persistence Error: </span>
                <span>{error}</span>
                <p className="text-xs text-rose-600 mt-1">
                  Your reflection input is preserved above. You can retry anytime.
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

