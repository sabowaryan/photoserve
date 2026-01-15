"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      session={session}
      // Désactiver le refetch automatique au focus de la fenêtre
      refetchOnWindowFocus={false}
      // Refetch la session toutes les 5 minutes au lieu de chaque navigation
      refetchInterval={5 * 60}
      // Désactiver le refetch quand la fenêtre est visible
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
