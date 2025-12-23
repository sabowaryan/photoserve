import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
          <div className="max-w-lg w-full text-center space-y-8">
            {/* Icon */}
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-destructive/20 rounded-full animate-pulse" />
              <div className="absolute inset-4 bg-destructive/30 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertTriangle className="w-16 h-16 text-destructive" />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">
                Oups ! Une erreur est survenue
              </h1>
              <p className="text-lg text-muted-foreground">
                L'application a rencontré un problème inattendu. 
                Nous nous excusons pour ce désagrément.
              </p>
            </div>

            {/* Error details (development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-left">
                <p className="text-sm font-mono text-destructive break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={this.handleRefresh}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Rafraîchir la page
              </Button>
              <Button 
                variant="outline" 
                onClick={this.handleGoHome}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </Button>
            </div>

            {/* Support */}
            <p className="text-sm text-muted-foreground">
              Si le problème persiste, contactez notre{' '}
              <a 
                href="mailto:support@photoserve.app" 
                className="text-primary hover:underline"
              >
                support technique
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
