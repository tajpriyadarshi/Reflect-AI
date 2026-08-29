import React from 'react';
import { Sparkles, LogIn, LogOut, ShieldCheck, Database, UserCheck } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isAuthLoading: boolean;
  totalEntries: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSignIn,
  onSignOut,
  isAuthLoading,
  totalEntries,
}) => {
  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & App Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-700/10 border border-amber-700/20 flex items-center justify-center text-amber-800 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg sm:text-xl font-medium tracking-tight text-stone-900">
                Reflective AI Journal
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
                <Database className="w-3 h-3 text-amber-700" />
                Firestore Realtime
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              Empathetic multi-turn reflections stored in private owner-bound collections
            </p>
          </div>
        </div>

        {/* Auth Actions & Status */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-stone-800 leading-tight">
                  {user.displayName || 'Journal Keeper'}
                </span>
                <span className="text-[11px] text-stone-500 truncate max-w-[160px]">
                  {user.email}
                </span>
              </div>

              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User profile'}
                  className="w-8 h-8 rounded-full border border-stone-200 object-cover shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-medium text-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <button
                id="sign-out-btn"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
                title="Sign out of your account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              id="google-sign-in-header-btn"
              onClick={onSignIn}
              disabled={isAuthLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isAuthLoading ? 'Connecting...' : 'Sign In with Google'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
