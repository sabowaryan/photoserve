/**
 * Guest Session Manager
 * 
 * Manages guest sessions for visitors who create galleries without an account.
 * Sessions are stored in both localStorage (client access) and HTTP-only cookies (security).
 * 
 * Requirements: 8.1, 8.2, 8.3
 */

// Session duration in days
const SESSION_DURATION_DAYS = 7;

// Storage keys
const STORAGE_KEY = 'piksend_guest_session';
const COOKIE_NAME = 'piksend_guest_token';

/**
 * Guest session data structure
 */
export interface GuestSession {
  token: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * Interface for GuestSessionManager
 */
export interface IGuestSessionManager {
  getOrCreateSession(): GuestSession;
  getSession(): GuestSession | null;
  clearSession(): void;
  isValidSession(token: string): boolean;
  getSessionToken(): string | null;
}

/**
 * Validates if a string is a valid UUID v4 format
 */
export function isValidUUID(token: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}

/**
 * Calculates the expiration date from a given date
 */
export function calculateExpirationDate(fromDate: Date = new Date()): Date {
  return new Date(fromDate.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Checks if a session has expired
 */
export function isSessionExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

/**
 * GuestSessionManager class
 * 
 * Handles creation, retrieval, and validation of guest sessions.
 * Uses localStorage for client-side access and cookies for server-side validation.
 */
export class GuestSessionManager implements IGuestSessionManager {
  /**
   * Gets an existing valid session or creates a new one
   */
  getOrCreateSession(): GuestSession {
    const existing = this.getSession();
    if (existing && !isSessionExpired(existing.expiresAt)) {
      return existing;
    }
    return this.createNewSession();
  }

  /**
   * Retrieves the current session from localStorage
   */
  getSession(): GuestSession | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const session: GuestSession = JSON.parse(stored);
      
      // Validate session structure
      if (!session.token || !session.createdAt || !session.expiresAt) {
        return null;
      }

      // Validate token format
      if (!isValidUUID(session.token)) {
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  /**
   * Gets just the session token if a valid session exists
   */
  getSessionToken(): string | null {
    const session = this.getSession();
    if (session && !isSessionExpired(session.expiresAt)) {
      return session.token;
    }
    return null;
  }

  /**
   * Clears the current session from localStorage
   * Note: Cookie is cleared via API response
   */
  clearSession(): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Validates if a token is valid (correct format and not expired)
   */
  isValidSession(token: string): boolean {
    if (!isValidUUID(token)) {
      return false;
    }

    const session = this.getSession();
    if (!session) {
      return false;
    }

    if (session.token !== token) {
      return false;
    }

    return !isSessionExpired(session.expiresAt);
  }

  /**
   * Creates a new guest session
   */
  private createNewSession(): GuestSession {
    const token = crypto.randomUUID();
    const now = new Date();
    const expiresAt = calculateExpirationDate(now);

    const session: GuestSession = {
      token,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    return session;
  }
}

/**
 * Server-side utilities for guest session management
 */

/**
 * Creates a session cookie value for HTTP response
 */
export function createSessionCookie(token: string, expiresAt: Date): string {
  const expires = expiresAt.toUTCString();
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`;
}

/**
 * Creates a cookie to clear the guest session
 */
export function createClearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Extracts guest token from cookie header
 */
export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const guestCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`));
  
  if (!guestCookie) {
    return null;
  }

  const token = guestCookie.split('=')[1];
  
  if (!token || !isValidUUID(token)) {
    return null;
  }

  return token;
}

/**
 * Creates a new session for server-side use
 */
export function createServerSession(): GuestSession {
  const token = crypto.randomUUID();
  const now = new Date();
  const expiresAt = calculateExpirationDate(now);

  return {
    token,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

// Export constants for testing
export const SESSION_CONFIG = {
  STORAGE_KEY,
  COOKIE_NAME,
  SESSION_DURATION_DAYS,
};

// Default export for convenience
export default GuestSessionManager;
