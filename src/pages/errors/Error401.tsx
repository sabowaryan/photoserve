import { Link } from 'react-router-dom';
import { UserX, LogIn, Home, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SEO } from '@/components/SEO';

const Error401 = () => {
  useDocumentTitle('Non authentifié - 401');

  return (
    <>
      <SEO 
        title="Non authentifié - 401"
        description="Veuillez vous connecter pour accéder à cette page."
        noIndex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Animated 401 */}
          <div className="relative">
            <h1 className="text-[150px] sm:text-[200px] font-black text-primary/10 leading-none select-none">
              401
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/80 backdrop-blur-sm rounded-full p-6">
                <UserX className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Authentification requise
            </h2>
            <p className="text-lg text-muted-foreground">
              Vous devez être connecté pour accéder à cette page. 
              Connectez-vous ou créez un compte pour continuer.
            </p>
          </div>

          {/* Info box */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
            <p className="text-sm text-muted-foreground">
              PhotoServe vous permet de créer et partager des galeries photo sécurisées. 
              Inscrivez-vous gratuitement pour commencer !
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gap-2">
              <Link to="/auth">
                <LogIn className="w-4 h-4" />
                Se connecter
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link to="/auth?tab=register">
                <UserPlus className="w-4 h-4" />
                Créer un compte
              </Link>
            </Button>
          </div>

          {/* Home link */}
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default Error401;
