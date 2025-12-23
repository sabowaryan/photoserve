import { Link } from 'react-router-dom';
import { Search, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SEO } from '@/components/SEO';

const Error404 = () => {
  useDocumentTitle('Page non trouvée - 404');

  return (
    <>
      <SEO 
        title="Page non trouvée - 404"
        description="La page que vous recherchez n'existe pas ou a été déplacée."
        noIndex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Animated 404 */}
          <div className="relative">
            <h1 className="text-[150px] sm:text-[200px] font-black text-primary/10 leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/80 backdrop-blur-sm rounded-full p-6">
                <Search className="w-16 h-16 text-primary animate-bounce" />
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Page introuvable
            </h2>
            <p className="text-lg text-muted-foreground">
              Désolé, la page que vous recherchez n'existe pas, a été déplacée 
              ou n'est temporairement plus disponible.
            </p>
          </div>

          {/* Suggestions */}
          <div className="bg-muted/50 rounded-lg p-6 text-left space-y-3">
            <p className="font-medium text-foreground">Suggestions :</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Vérifiez l'orthographe de l'URL
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                La galerie a peut-être expiré
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Le lien que vous avez suivi est peut-être obsolète
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gap-2">
              <Link to="/">
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Page précédente
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Error404;
