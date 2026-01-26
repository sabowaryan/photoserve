'use client';

/**
 * Theme Toggle Component for Public Profile
 * 
 * Allows visitors to toggle between light and dark mode
 * 
 * Requirements:
 * - 11.9: Allow manual toggle between light and dark mode
 * - 11.4: Support keyboard navigation
 * - 11.5: Provide ARIA attributes for accessibility
 */

import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}

export function ThemeToggle({ isDark, onToggle, className = '' }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${className}`}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      type="button"
    >
      {isDark ? (
        <Sun size={20} className="text-amber-500" aria-hidden="true" />
      ) : (
        <Moon size={20} className="text-slate-600" aria-hidden="true" />
      )}
    </button>
  );
}
