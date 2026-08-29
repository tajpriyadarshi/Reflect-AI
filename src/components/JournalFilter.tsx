import React from 'react';
import { Search, Filter, Compass, X } from 'lucide-react';
import { MoodType } from '../types';

interface JournalFilterProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedMoodFilter: string;
  onMoodFilterChange: (mood: string) => void;
  totalCount: number;
  filteredCount: number;
}

const FILTER_MOODS: string[] = ['All', 'Reflective', 'Grateful', 'Energized', 'Seeking Clarity', 'Peaceful'];

export const JournalFilter: React.FC<JournalFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedMoodFilter,
  onMoodFilterChange,
  totalCount,
  filteredCount,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-4 sm:p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="journal-search-input"
            type="text"
            placeholder="Search through past reflections, themes, or replies..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9.5 pr-8 py-2 rounded-xl text-sm border border-stone-200 bg-stone-50/50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mood Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0 mr-1 hidden sm:block" />
          {FILTER_MOODS.map((mood) => {
            const isSelected = selectedMoodFilter === mood;
            return (
              <button
                key={mood}
                id={`filter-mood-${mood.toLowerCase().replace(/\s+/g, '-')}`}
                type="button"
                onClick={() => onMoodFilterChange(mood)}
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-stone-900 text-white font-medium shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 border border-stone-200/60'
                }`}
              >
                {mood}
              </button>
            );
          })}
        </div>
      </div>

      {/* Counter summary */}
      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <span>
          Showing <span className="font-semibold text-stone-800">{filteredCount}</span> of{' '}
          <span className="font-semibold text-stone-800">{totalCount}</span> total entries
        </span>
        {searchQuery && (
          <span className="text-amber-800 font-medium">Filtered by: "{searchQuery}"</span>
        )}
      </div>
    </div>
  );
};
