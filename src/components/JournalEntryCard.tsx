import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Calendar,
  Trash2,
  Copy,
  Check,
  MessageSquare,
  Tag,
  Compass,
  Mic,
  PenTool,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Clock
} from 'lucide-react';
import { JournalEntry } from '../types';
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from '../utils/speech';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onDelete: (id: string) => Promise<void>;
}

export const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onDelete }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(0.95);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (isPlayingAudio) {
        stopSpeaking();
      }
    };
  }, [isPlayingAudio]);

  const formattedDate = React.useMemo(() => {
    if (!entry.createdAt) return 'Just now';
    try {
      if (typeof entry.createdAt.toDate === 'function') {
        const date = entry.createdAt.toDate();
        return date.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      if (typeof entry.createdAt === 'string' || typeof entry.createdAt === 'number') {
        return new Date(entry.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      return 'Recent';
    }
    return 'Recent';
  }, [entry.createdAt]);

  const handleCopy = async () => {
    try {
      const fullText = `### Prompt (${entry.entryType === 'spoken' ? 'Spoken' : 'Written'}):\n${entry.prompt}\n\n### AI Reflection:\n${entry.reply}`;
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy entry:', err);
    }
  };

  const handleDelete = async () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    }
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
    } catch (err) {
      console.error('Delete error:', err);
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speakText(entry.reply, {
        rate: playbackRate,
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  };

  const handleRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (isPlayingAudio) {
      stopSpeaking();
      speakText(entry.reply, {
        rate: newRate,
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  };

  return (
    <article
      id={`journal-card-${entry.id}`}
      className={`bg-white rounded-2xl border transition-all overflow-hidden ${
        isPlayingAudio ? 'border-amber-400 shadow-md ring-2 ring-amber-100' : 'border-stone-200/90 shadow-xs hover:shadow-sm'
      }`}
    >
      {/* Card Header & Meta */}
      <div className="px-5 py-3.5 bg-stone-50/80 border-b border-stone-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 font-medium">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <span>{formattedDate}</span>

          {/* Reflection Mode Badge (Spoken vs Written) */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
              entry.entryType === 'spoken'
                ? 'bg-rose-50 text-rose-800 border border-rose-200/70'
                : 'bg-stone-100 text-stone-700 border border-stone-200/70'
            }`}
          >
            {entry.entryType === 'spoken' ? (
              <>
                <Mic className="w-3 h-3 text-rose-600" />
                <span>Spoken</span>
                {entry.spokenAudioDuration ? (
                  <span className="text-[10px] text-rose-600 font-mono opacity-80">({entry.spokenAudioDuration}s)</span>
                ) : null}
              </>
            ) : (
              <>
                <PenTool className="w-3 h-3 text-amber-700" />
                <span>Written</span>
              </>
            )}
          </span>

          {entry.mood && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-100/70 text-amber-900 border border-amber-200/60">
              <Compass className="w-3 h-3" />
              {entry.mood}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Audio read-aloud button */}
          {isSpeechSynthesisSupported() && (
            <button
              id={`play-speech-${entry.id}-btn`}
              type="button"
              onClick={handleToggleAudio}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${
                isPlayingAudio
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-amber-900 hover:bg-amber-100/60'
              }`}
              title={isPlayingAudio ? 'Pause reading aloud' : 'Listen to AI companion reflection'}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Playing</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden sm:inline">Listen</span>
                </>
              )}
            </button>
          )}

          <button
            id={`copy-entry-${entry.id}-btn`}
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            title="Copy reflection to clipboard"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {showConfirmDelete ? (
            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
              <span className="text-[11px] text-rose-700 font-medium">Delete?</span>
              <button
                id={`confirm-delete-${entry.id}-btn`}
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-[11px] font-semibold text-rose-800 hover:underline px-1"
              >
                {isDeleting ? '...' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="text-[11px] text-stone-500 hover:text-stone-700 px-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              id={`delete-entry-${entry.id}-btn`}
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete journal entry"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Audio Playback Status Bar */}
      {isPlayingAudio && (
        <div className="px-5 py-2 bg-amber-100/50 border-b border-amber-200/60 flex items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[40, 80, 50, 100, 60, 90, 45].map((h, i) => (
                <span
                  key={i}
                  className="w-0.5 bg-amber-700 rounded-full animate-pulse"
                  style={{
                    height: `${(h / 100) * 14}px`,
                    animationDelay: `${i * 90}ms`,
                  }}
                />
              ))}
            </div>
            <span className="font-medium">Companion is reading reflection aloud...</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-amber-800">Speed:</span>
            {[0.9, 1.0, 1.2].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleRateChange(rate)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                  playbackRate === rate
                    ? 'bg-amber-800 text-white'
                    : 'bg-amber-200/70 text-amber-900 hover:bg-amber-300'
                }`}
              >
                {rate}x
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                setIsPlayingAudio(false);
              }}
              className="ml-1 p-1 text-amber-800 hover:text-amber-950"
              title="Stop audio"
            >
              <VolumeX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-4">
        {/* User Prompt / Thought Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
              <span>{entry.entryType === 'spoken' ? 'Your Spoken Thought' : 'Your Written Thought'}</span>
            </div>
          </div>
          <div className="text-stone-900 font-serif text-base sm:text-lg leading-relaxed whitespace-pre-wrap pl-1 border-l-2 border-amber-700/30">
            {entry.prompt}
          </div>
        </div>

        {/* AI Insight / Reflection Section */}
        <div className="mt-4 pt-4 border-t border-stone-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>AI Companion Reflection</span>
            </div>
          </div>

          <div className="text-stone-700 text-sm sm:text-base leading-relaxed bg-amber-50/40 border border-amber-100/70 rounded-xl p-4">
            <div className="prose prose-stone prose-sm sm:prose-base max-w-none prose-p:leading-relaxed prose-headings:font-serif prose-headings:text-stone-900 prose-ul:my-2">
              <Markdown>{entry.reply}</Markdown>
            </div>
          </div>
        </div>

        {/* Tags if present */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <Tag className="w-3 h-3 text-stone-400 mr-0.5" />
            {entry.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

