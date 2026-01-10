'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session) {
      // Redirect based on admin status
      if (session.user.isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    } else {
      // Not authenticated, redirect to auth
      router.replace('/auth');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-medium">Redirection en cours...</p>
      </div>
    </div>
  );
}
