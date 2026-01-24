/**
 * Not Found page for public profiles
 * 
 * Displayed when:
 * - Profile doesn't exist (Requirement 6.3)
 * - Profile is disabled (Requirement 6.4)
 * - User is not Pro (Requirement 1.1)
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Profil introuvable
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8">
          Le profil que vous recherchez n'existe pas ou n'est plus disponible.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
          </Link>
          
          <p className="text-sm text-muted-foreground">
            Vous êtes photographe ?{' '}
            <Link href="/pricing" className="text-primary hover:underline">
              Créez votre profil public
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
