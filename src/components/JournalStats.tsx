import React from 'react';
import { Flame, BookOpen, Clock, Heart, Award } from 'lucide-react';
import { JournalEntry } from '../types';

interface JournalStatsProps {
  entries: JournalEntry[];
}

export const JournalStats: React.FC<JournalStatsProps> = ({ entries }) => {
  const totalEntries = entries.length;

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
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Reflections</p>
          <p className="text-lg sm:text-xl font-serif font-semibold text-stone-900">{totalEntries}</p>
        </div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-800 shrink-0">
          <Heart className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Top Mood</p>
          <p className="text-sm font-semibold text-stone-900 truncate max-w-[110px]">{dominantMood}</p>
        </div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Words Written</p>
          <p className="text-lg sm:text-xl font-serif font-semibold text-stone-900">{totalWords}</p>
        </div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-800 shrink-0">
          <Award className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Sync State</p>
          <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Encrypted Sync
          </p>
        </div>
      </div>
    </div>
  );
};
