/**
 * Supabase Browser Client
 * Use this client for client-side operations in React components
 */
import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Creates a Supabase client for browser-side usage
 * This client uses cookies for session management
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Creates a Supabase client with a specific access token
 * Use this when you have a Supabase access token from NextAuth session
 * This enables RLS policies to work with auth.uid()
 */
export function createClientWithToken(accessToken: string) {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  )
}

/**
 * Singleton instance for browser client
 * Use this for simple client-side operations
 */
let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}
