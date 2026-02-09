/**
 * Persona Storage Service
 * Handles localStorage and cookie storage for persona data
 * 
 * @module lib/persona/storage
 * Requirements: 1.4
 */

import type { Persona, PersonaData, PersonaStorageConfig } from '@/types/persona';

const STORAGE_CONFIG: PersonaStorageConfig = {
  localStorageKey: 'piksend_persona',
  cookieName: 'piksend_persona',
  ttlDays: 90,
};

/**
 * Save persona data to localStorage and cookies
 * 
 * Requirement 1.4: THE System SHALL stocker le résultat du persona dans le localStorage et les cookies pour 90 jours
 */
export function savePersonaData(data: PersonaData): void {
  if (typeof window === 'undefined') return;

  try {
    // Save to localStorage
    localStorage.setItem(STORAGE_CONFIG.localStorageKey, JSON.stringify(data));

    // Save to cookies (just the persona type for easy access)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + STORAGE_CONFIG.ttlDays);
    
    document.cookie = `${STORAGE_CONFIG.cookieName}=${data.persona}; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=lax`;
  } catch (error) {
    console.error('Failed to save persona data:', error);
  }
}

/**
 * Get persona data from localStorage
 * 
 * Requirement 1.5: WHEN un visiteur a déjà complété le quiz, THE System SHALL ne pas afficher le Persona_Quiz à nouveau
 */
export function getPersonaData(): PersonaData | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_CONFIG.localStorageKey);
    if (!stored) return null;

    const data = JSON.parse(stored) as PersonaData;

    // Check if expired
    const expiresAt = new Date(data.expiresAt);
    if (expiresAt < new Date()) {
      clearPersonaData();
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get persona data:', error);
    return null;
  }
}

/**
 * Get just the persona type from cookies (faster than localStorage)
 */
export function getPersonaFromCookie(): Persona | null {
  if (typeof window === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';');
    const personaCookie = cookies.find(c => 
      c.trim().startsWith(`${STORAGE_CONFIG.cookieName}=`)
    );

    if (!personaCookie) return null;

    const value = personaCookie.split('=')[1]?.trim();
    if (!value) return null;

    // Validate it's a valid persona
    const validPersonas: Persona[] = ['wedding', 'event', 'portrait', 'studio'];
    if (validPersonas.includes(value as Persona)) {
      return value as Persona;
    }

    return null;
  } catch (error) {
    console.error('Failed to get persona from cookie:', error);
    return null;
  }
}

/**
 * Check if user has completed the quiz
 */
export function hasCompletedQuiz(): boolean {
  return getPersonaData() !== null;
}

/**
 * Clear persona data from localStorage and cookies
 */
export function clearPersonaData(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_CONFIG.localStorageKey);
    document.cookie = `${STORAGE_CONFIG.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  } catch (error) {
    console.error('Failed to clear persona data:', error);
  }
}

/**
 * Update persona data (e.g., when user changes their selection)
 */
export function updatePersonaData(updates: Partial<PersonaData>): void {
  const current = getPersonaData();
  if (!current) return;

  const updated: PersonaData = {
    ...current,
    ...updates,
  };

  savePersonaData(updated);
}
