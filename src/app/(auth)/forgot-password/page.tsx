'use client';

/**
 * Forgot Password Page
 * Allows users to request a password reset email
 */
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';
import { z } from 'zod';

const emailSchema = z.string().email({ message: 'Email invalide' });

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError && err.issues[0]) {
        setError(err.issues[0].message);
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      setEmailSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

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

      <Card className="w-full max-w-md glass-card animate-scale-in relative z-10">
        <CardHeader className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <LogoIcon size={32} />
            <span className="font-display text-2xl font-bold gradient-text">PhotoServe</span>
          </Link>
          <CardTitle className="text-xl">Mot de passe oublié</CardTitle>
          <CardDescription className="text-muted-foreground">
            {emailSent 
              ? 'Vérifiez votre boîte de réception'
              : 'Entrez votre email pour réinitialiser votre mot de passe'
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

          {emailSent ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-primary/20">
                  <CheckCircle className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-foreground">
                  Un email de réinitialisation a été envoyé à :
                </p>
                <p className="font-medium text-primary">{email}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Cliquez sur le lien dans l&apos;email pour définir un nouveau mot de passe.
                Si vous ne voyez pas l&apos;email, vérifiez votre dossier spam.
              </p>
              <Link href="/auth">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Envoyer le lien de réinitialisation
              </Button>

              <Link href="/auth" className="block">
                <Button variant="ghost" className="w-full text-muted-foreground">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
