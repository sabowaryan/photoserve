/**
 * Persona Detection Logic
 * Detects persona from URL or storage
 * 
 * @module lib/persona/detection
 * Requirements: 2.1
 */

import type { Persona } from '@/types/persona';
import { getPersonaData } from './storage';

/**
 * Detect persona from URL pathname
 * 
 * @param pathname - Current URL pathname
 * @returns Detected persona or null
 */
export function detectPersonaFromUrl(pathname: string): Persona | null {
  // Match patterns like /for/photographers/wedding or /for/studios
  const weddingMatch = pathname.match(/\/for\/photographers\/wedding/);
  const eventMatch = pathname.match(/\/for\/photographers\/event/);
  const portraitMatch = pathname.match(/\/for\/photographers\/portrait/);
  const studioMatch = pathname.match(/\/for\/studios/);

  if (weddingMatch) return 'wedding';
  if (eventMatch) return 'event';
  if (portraitMatch) return 'portrait';
  if (studioMatch) return 'studio';

  return null;
}

/**
 * Get current persona from URL or storage
 * Priority: URL > Storage
 * 
 * @param pathname - Current URL pathname
 * @returns Current persona or null
 */
export function getCurrentPersona(pathname: string): Persona | null {
  // First check URL
  const urlPersona = detectPersonaFromUrl(pathname);
  if (urlPersona) {
    return urlPersona;
  }

  // Then check storage
  const storedPersona = getPersonaData();
  if (storedPersona && !isPersonaExpired(storedPersona.expiresAt)) {
    return storedPersona.persona;
  }

  return null;
}

/**
 * Check if persona data has expired
 */
function isPersonaExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Get persona display name in French
 */
export function getPersonaDisplayNameFr(persona: Persona): string {
  const names: Record<Persona, string> = {
    wedding: 'Photographe de Mariage',
    event: 'Photographe Événementiel',
    portrait: 'Photographe Portrait',
    studio: 'Studio Photo',
  };

  return names[persona];
}

/**
 * Get persona-specific URL
 */
export function getPersonaUrl(persona: Persona): string {
  const urls: Record<Persona, string> = {
    wedding: '/for/photographers/wedding',
    event: '/for/photographers/event',
    portrait: '/for/photographers/portrait',
    studio: '/for/studios',
  };

  return urls[persona];
}
