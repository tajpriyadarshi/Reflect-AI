import React from 'react';
import { BookOpen, Clock, Heart, Mic, PenTool, Radio } from 'lucide-react';
import { JournalEntry } from '../types';

interface JournalStatsProps {
  entries: JournalEntry[];
}

export const JournalStats: React.FC<JournalStatsProps> = ({ entries }) => {
  const totalEntries = entries.length;

  const spokenCount = React.useMemo(() => {
    return entries.filter((e) => e.entryType === 'spoken').length;
  }, [entries]);

  const writtenCount = React.useMemo(() => {
    return entries.filter((e) => !e.entryType || e.entryType === 'written').length;
  }, [entries]);

  const totalWords = React.useMemo(() => {
    return entries.reduce((acc, curr) => {
      const pWords = (curr.prompt || '').trim().split(/\s+/).filter(Boolean).length;
      return acc + pWords;
    }, 0);
  }, [entries]);

  // Calculate mood counts
  const dominantMood = React.useMemo(() => {
    if (!entries.length) return 'None yet';
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.mood) counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? `${sorted[0][0]} (${sorted[0][1]})` : 'Reflective';
  }, [entries]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800 shrink-0">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Total Entries</p>
          <p className="text-lg sm:text-xl font-serif font-semibold text-stone-900">{totalEntries}</p>
        </div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-800 shrink-0">
          <Mic className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Format Mix</p>
          <p className="text-xs font-semibold text-stone-900 flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center gap-0.5 text-rose-700">
              <Mic className="w-3 h-3" /> {spokenCount}
            </span>
            <span className="text-stone-300">/</span>
            <span className="inline-flex items-center gap-0.5 text-amber-800">
              <PenTool className="w-3 h-3" /> {writtenCount}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-rose-50/70 border border-rose-100 flex items-center justify-center text-rose-800 shrink-0">
          <Heart className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Top Mood</p>
          <p className="text-xs sm:text-sm font-semibold text-stone-900 truncate max-w-[110px] mt-0.5">{dominantMood}</p>
        </div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Total Words</p>
          <p className="text-lg sm:text-xl font-serif font-semibold text-stone-900">{totalWords}</p>
        </div>
      </div>
    </div>
  );
};
