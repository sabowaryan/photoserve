/**
 * Authentication Utilities
 * Helper functions for authentication and Supabase client creation
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth.config';
import { createClientWithToken, createAdminClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

/**
 * Get the current session on the server side
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Get the current user from the session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Get a Supabase client that respects RLS policies
 * 
 * Si l'utilisateur a un token Supabase (connexion credentials), 
 * on utilise ce token pour que auth.uid() fonctionne dans les RLS.
 * 
 * Si l'utilisateur n'a pas de token Supabase (connexion Google OAuth),
 * on utilise le service role et on filtre manuellement par user_id.
 * 
 * @returns Un objet avec le client Supabase et un flag indiquant si RLS est actif
 */
export async function getSupabaseClient(): Promise<{
  supabase: SupabaseClient<Database>;
  hasRLS: boolean;
  userId: string | null;
}> {
  const session = await getSession();

  if (!session?.user) {
    // Pas authentifié - retourner un client anonyme
    return {
      supabase: createAdminClient(), // Utiliser admin pour les opérations publiques
      hasRLS: false,
      userId: null,
    };
  }

  // Si on a un token Supabase, l'utiliser pour RLS
  if (session.supabaseAccessToken) {
    return {
      supabase: createClientWithToken(session.supabaseAccessToken),
      hasRLS: true,
      userId: session.user.id,
    };
  }

  // Sinon (Google OAuth), utiliser le service role
  // Les requêtes devront filtrer manuellement par user_id
  return {
    supabase: createAdminClient(),
    hasRLS: false,
    userId: session.user.id,
  };
}

/**
 * Get a Supabase client for the current authenticated user
 * Throws if not authenticated
 * 
 * @returns Un objet avec le client Supabase, le flag RLS, et l'ID utilisateur
 */
export async function requireSupabaseClient(): Promise<{
  supabase: SupabaseClient<Database>;
  hasRLS: boolean;
  userId: string;
}> {
  const { supabase, hasRLS, userId } = await getSupabaseClient();

  if (!userId) {
    throw new Error('Authentication required');
  }

  return { supabase, hasRLS, userId };
}
