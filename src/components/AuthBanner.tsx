import React from 'react';
import { ShieldCheck, Lock, Sparkles, Database, LogIn } from 'lucide-react';

interface AuthBannerProps {
  onSignIn: () => void;
  isLoading: boolean;
}

export const AuthBanner: React.FC<AuthBannerProps> = ({ onSignIn, isLoading }) => {
  return (
    <div className="bg-gradient-to-b from-stone-900 to-stone-950 text-stone-100 rounded-3xl p-6 sm:p-10 border border-stone-800 shadow-xl mb-8 relative overflow-hidden">
      {/* Background aesthetic glow */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-stone-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Private Multi-Turn AI Journaling</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-white mb-3 leading-tight">
          Your Private Sanctum for Thought & Reflection
        </h2>

        <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6 font-light">
          Experience an empathetic journaling companion powered by Gemini and Google Cloud Firestore. Your entries are isolated into your personal, owner-bound Firestore subcollection (`users/{'{userId}'}/journals`), giving you real-time synchronization, multi-turn memory, and total privacy.
        </p>

        {/* Security & Architecture Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-xs text-stone-300">
          <div className="flex items-start gap-2.5 bg-stone-800/60 border border-stone-700/60 rounded-xl p-3">
            <Lock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-stone-200">Owner-Bound Rules:</span>
              <p className="text-stone-400 mt-0.5">Strict Firestore security rules guarantee only you can read and write your reflections.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-stone-800/60 border border-stone-700/60 rounded-xl p-3">
            <Database className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-stone-200">Real-Time Firestore Sync:</span>
              <p className="text-stone-400 mt-0.5">Instant live snapshot listeners sync your reflections across sessions smoothly.</p>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          id="google-sign-in-main-btn"
          type="button"
          onClick={onSignIn}
          disabled={isLoading}
          className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>{isLoading ? 'Connecting to Google...' : 'Sign In with Google to Open Journal'}</span>
        </button>
      </div>
    </div>
  );
};
