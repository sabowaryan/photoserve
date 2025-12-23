import { Link } from 'react-router-dom';
import { ShieldX, Home, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SEO } from '@/components/SEO';

const Error403 = () => {
  useDocumentTitle('Accès refusé - 403');

  return (
    <>
      <SEO 
        title="Accès refusé - 403"
        description="Vous n'avez pas les permissions nécessaires pour accéder à cette ressource."
        noIndex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-500/5 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Animated 403 */}
          <div className="relative">
            <h1 className="text-[150px] sm:text-[200px] font-black text-orange-500/10 leading-none select-none">
              403
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/80 backdrop-blur-sm rounded-full p-6">
                <ShieldX className="w-16 h-16 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Accès refusé
            </h2>
            <p className="text-lg text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page 
              ou cette ressource est protégée.
            </p>
          </div>

          {/* Reasons */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6 text-left space-y-3">
            <p className="font-medium text-foreground">Raisons possibles :</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                Vous n'êtes pas connecté à votre compte
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                Votre abonnement ne donne pas accès à cette fonctionnalité
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                Cette galerie n'est pas la vôtre
              </li>
            </ul>
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
              <Link to="/">
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>

          {/* Back */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Page précédente
          </Button>
        </div>
      </div>
    </>
  );
};

export default Error403;
