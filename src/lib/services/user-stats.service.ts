/**
 * User Statistics Service
 * Provides user count and other statistics for public display
 */
import { createAdminClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';

/**
 * Get the count of non-admin users (photographers)
 * Uses admin client to bypass RLS
 * Cached for 1 hour
 */
export const getUserCount = unstable_cache(
  async (): Promise<number> => {
    try {
      const supabase = createAdminClient();
      
      // Count non-admin users (real photographers)
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or('is_admin.is.null,is_admin.eq.false');

      if (error) {
        console.error('[user-stats] Error fetching user count:', error);
        return 500; // Fallback
      }

      const actualCount = count || 0;

      // Use fallback if less than 500 users
      return actualCount >= 500 ? actualCount : 500;
    } catch (error) {
      console.error('[user-stats] Error in getUserCount:', error);
      return 500; // Fallback
    }
  },
  ['user-count'],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ['user-stats'],
  }
);
