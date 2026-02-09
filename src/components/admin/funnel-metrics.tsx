/**
 * Funnel Metrics Component
 * 
 * Displays conversion funnel metrics including:
 * - Overall conversion rate
 * - Conversion rate by persona
 * - Funnel stage completion rates
 * - Trigger effectiveness
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FunnelMetrics as FunnelMetricsType } from '@/lib/services/analytics.service';
import {
  Users,
  UserCheck,
  Zap,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface FunnelMetricsProps {
  metrics: FunnelMetricsType;
  targetConversionRate?: number;
}

export function FunnelMetrics({ metrics, targetConversionRate = 8 }: FunnelMetricsProps) {
  const isTargetMet = metrics.conversionRate >= targetConversionRate;

  // Persona labels
  const personaLabels: Record<string, string> = {
    wedding: 'Mariage',
    event: 'Événementiel',
    portrait: 'Portrait',
    studio: 'Studio',
  };

  return (
    <div className="space-y-6">
      {/* Overall Conversion Rate */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Taux de Conversion Global
              </CardTitle>
              <CardDescription>
                Objectif: {targetConversionRate}% | Visiteurs → Clients payants
              </CardDescription>
            </div>
            <Badge
              variant={isTargetMet ? 'default' : 'secondary'}
              className={isTargetMet ? 'bg-green-600' : ''}
            >
              {isTargetMet ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {metrics.conversionRate.toFixed(2)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress
              value={Math.min((metrics.conversionRate / targetConversionRate) * 100, 100)}
              className="h-3"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {metrics.totalVisitors.toLocaleString('fr-FR')} visiteurs
              </span>
              <span>
                {Math.round(
                  (metrics.totalVisitors * metrics.conversionRate) / 100
                ).toLocaleString('fr-FR')}{' '}
                conversions
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funnel Stages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Étapes du Funnel
          </CardTitle>
          <CardDescription>Taux de complétion par étape</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Quiz Completion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quiz de segmentation</span>
                <span className="text-sm font-semibold">
                  {metrics.quizCompletionRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.quizCompletionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Objectif: 60% | {(metrics.eventsByType.quiz_completed || 0).toLocaleString('fr-FR')}{' '}
                complétions
              </p>
            </div>

            {/* Signup */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inscription</span>
                <span className="text-sm font-semibold">
                  {metrics.signupRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.signupRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {(metrics.eventsByType.signup_completed || 0).toLocaleString('fr-FR')} inscriptions
              </p>
            </div>

            {/* Activation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Activation (1ère galerie)</span>
                <span className="text-sm font-semibold">
                  {metrics.activationRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.activationRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Objectif: 60% |{' '}
                {(metrics.eventsByType.first_gallery_created || 0).toLocaleString('fr-FR')}{' '}
                activations
              </p>
            </div>

            {/* Upgrade */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Upgrade (Free → Paid)</span>
                <span className="text-sm font-semibold">
                  {metrics.upgradeRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.upgradeRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Objectif: 20% |{' '}
                {(metrics.eventsByType.upgrade_completed || 0).toLocaleString('fr-FR')} upgrades
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Persona Distribution */}
      {Object.keys(metrics.personaDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Distribution par Persona
            </CardTitle>
            <CardDescription>Répartition des utilisateurs segmentés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.personaDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([persona, count]) => {
                  const total = Object.values(metrics.personaDistribution).reduce(
                    (sum, c) => sum + c,
                    0
                  );
                  const percentage = (count / total) * 100;

                  return (
                    <div key={persona} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {personaLabels[persona] || persona}
                        </span>
                        <span className="text-muted-foreground">
                          {count.toLocaleString('fr-FR')} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Visiteurs totaux</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold">
                {metrics.totalVisitors.toLocaleString('fr-FR')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Utilisateurs activés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold">
                {(metrics.eventsByType.first_gallery_created || 0).toLocaleString('fr-FR')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Clients payants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-2xl font-bold">
                {(metrics.eventsByType.upgrade_completed || 0).toLocaleString('fr-FR')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
