'use client';

import { useEffect, useState, useRef } from 'react';

export type GalleryTheme = 'light' | 'dark' | 'system';

/**
 * Gallery-specific theme hook
 * Unlike useTheme, this only applies dark mode to the gallery container
 * and doesn't affect the rest of the application
 */
export function useGalleryTheme() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  // Initialize with 'light' for SSR and default behavior
  const [theme, setTheme] = useState<GalleryTheme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Load theme from localStorage after mount
  // Default to 'light' instead of 'system' to prevent automatic dark mode
  useEffect(() => {
    setMounted(true);
    
    const savedTheme = (localStorage.getItem('gallery-theme') as GalleryTheme) || 'light';
    setTheme(savedTheme);
    
    // Determine initial resolved theme
    if (savedTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(savedTheme);
    }
  }, []);

  // Detect system preference and apply theme
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

  // Apply theme to gallery container only (not document root)
  useEffect(() => {
    if (!containerRef.current || !mounted) return;
    
    const container = containerRef.current;
    
    // Remove both classes first
    container.classList.remove('gallery-light', 'gallery-dark');
    
    // Add the resolved theme class with gallery prefix
    container.classList.add(`gallery-${resolvedTheme}`);
    
    // Also add to data attribute for easier CSS targeting
    container.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme, mounted]);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme: GalleryTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);
    localStorage.setItem('gallery-theme', newTheme);
    
    // Update resolved theme immediately
    if (newTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(newTheme);
    }
  };

  // Set specific theme
  const setThemeValue = (newTheme: GalleryTheme) => {
    setTheme(newTheme);
    localStorage.setItem('gallery-theme', newTheme);
    
    // Update resolved theme immediately
    if (newTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(newTheme);
    }
  };

  return {
    containerRef, // Must be attached to the gallery container
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme: setThemeValue,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  };
}
