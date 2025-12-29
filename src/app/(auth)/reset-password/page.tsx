'use client';

/**
 * Reset Password Page
 * Allows users to set a new password using a reset token
 */
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';
import { z } from 'zod';

const passwordSchema = z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' });

function ResetPasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // If no token, show error
  if (!token) {
    return (
      <Card className="w-full max-w-md glass-card animate-scale-in relative z-10">
        <CardHeader className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <LogoIcon size={32} />
            <span className="font-display text-2xl font-bold gradient-text">PhotoServe</span>
          </Link>
          <CardTitle className="text-xl text-destructive">Lien expiré</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ce lien de réinitialisation n&apos;est plus valide ou a expiré.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Link href="/forgot-password" className="block">
            <Button className="w-full btn-primary">
              Demander un nouveau lien
            </Button>
          </Link>
          <Link href="/auth" className="block">
            <Button variant="ghost" className="w-full text-muted-foreground">
              Retour à la connexion
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError && err.issues[0]) {
        setError(err.issues[0].message);
      }
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      setIsSuccess(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md glass-card animate-scale-in relative z-10">
      <CardHeader className="text-center space-y-4">
        <Link href="/" className="inline-flex items-center justify-center gap-2">
          <LogoIcon size={32} />
          <span className="font-display text-2xl font-bold gradient-text">PhotoServe</span>
        </Link>
        <CardTitle className="text-xl">
          {isSuccess ? 'Mot de passe modifié' : 'Nouveau mot de passe'}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {isSuccess 
            ? 'Votre mot de passe a été mis à jour avec succès'
            : 'Choisissez un nouveau mot de passe pour votre compte'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/20">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <Button 
              className="w-full btn-primary" 
              onClick={() => router.push('/auth')}
            >
              Se connecter
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Au moins 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirmer votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Réinitialiser le mot de passe
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Back button */}
      <Link 
        href="/" 
        className="fixed top-4 left-4 z-20 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {/* Background glow effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
