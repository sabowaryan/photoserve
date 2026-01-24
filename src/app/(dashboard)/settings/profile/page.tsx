import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSession, requireSupabaseClient } from '@/lib/auth';
import { generatePageMetadata } from '@/lib/services';
import { PublicProfileSettings } from './public-profile-settings';

export const metadata: Metadata = generatePageMetadata('settings');

async function getProfile(userId: string) {
  const { supabase } = await requireSupabaseClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return profile;
}

async function getPublicProfile(userId: string) {
  const { supabase } = await requireSupabaseClient();

  const { data: publicProfile, error } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is fine for a new profile
    console.error('Error fetching public profile:', error);
  }

  return publicProfile;
}

export default async function PublicProfilePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/auth');
  }

  const profile = await getProfile(session.user.id);
  const publicProfile = await getPublicProfile(session.user.id);
  const currentPlan = profile?.subscription_plan || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pt-28 pb-20 font-['Plus_Jakarta_Sans']">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-100/20 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <Suspense fallback={<div>Chargement...</div>}>
          <PublicProfileSettings
            currentPlan={currentPlan}
            initialProfile={publicProfile}
          />
        </Suspense>
      </div>
    </div>
  );
}
