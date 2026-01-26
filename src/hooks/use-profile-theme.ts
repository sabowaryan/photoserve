'use client';

/**
 * Profile-specific theme hook
 * Similar to useGalleryTheme, this only applies dark mode to the profile container
 * and doesn't affect the rest of the application
 * 
 * Requirements:
 * - 11.8: Support dark mode with automatic system preference detection
 * - 11.9: Allow manual toggle between light and dark mode
 * - 11.10: Persist theme preference in localStorage
 */

import { useEffect, useState, useRef } from 'react';

export type ProfileTheme = 'light' | 'dark' | 'system';

export function useProfileTheme() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  // Initialize with 'system' for SSR to avoid hydration mismatch
  const [theme, setTheme] = useState<ProfileTheme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Load theme from localStorage after mount (Requirement 11.10)
  useEffect(() => {
    setMounted(true);
    
    const savedTheme = (localStorage.getItem('profile-theme') as ProfileTheme) || 'system';
    setTheme(savedTheme);
    
    // Determine initial resolved theme (Requirement 11.8)
    if (savedTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(savedTheme);
    }
  }, []);

  // Detect system preference and apply theme (Requirement 11.8)
  useEffect(() => {
    if (!mounted) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateResolvedTheme = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    // Listen for system preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  // Apply theme to profile container only (not document root)
  useEffect(() => {
    if (!containerRef.current || !mounted) return;
    
    const container = containerRef.current;
    
    // Set data attribute for CSS targeting
    container.setAttribute('data-profile-theme', resolvedTheme);
  }, [resolvedTheme, mounted]);

  // Toggle theme function (Requirement 11.9)
  const toggleTheme = () => {
    const newTheme: ProfileTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);
    localStorage.setItem('profile-theme', newTheme);
    
    // Update resolved theme immediately
    if (newTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(newTheme);
    }
  };

  // Set specific theme
  const setThemeValue = (newTheme: ProfileTheme) => {
    setTheme(newTheme);
    localStorage.setItem('profile-theme', newTheme);
    
    // Update resolved theme immediately
    if (newTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(newTheme);
    }
  };

  return {
    containerRef, // Must be attached to the profile container
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme: setThemeValue,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  };
}
