/**
 * A/B Test Results Component
 * 
 * Displays results for active and completed A/B tests including:
 * - Variant performance comparison
 * - Statistical significance
 * - Conversion rates
 * - Sample sizes
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ABTest, ABTestResult } from '@/types/ab-testing';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface ABTestResultsProps {
  tests: ABTest[];
  results: Record<string, ABTestResult[]>;
}

export function ABTestResults({ tests, results }: ABTestResultsProps) {
  if (tests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tests A/B</CardTitle>
          <CardDescription>Aucun test A/B actif</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configurez des tests A/B dans le fichier de configuration pour commencer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tests.map((test) => {
        const testResults = results[test.id] || [];
        const hasResults = testResults.length > 0;

        return (
          <Card key={test.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </div>
                <Badge
                  variant={
                    test.status === 'running'
                      ? 'default'
                      : test.status === 'completed'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {test.status === 'running' && 'En cours'}
                  {test.status === 'completed' && 'Terminé'}
                  {test.status === 'paused' && 'En pause'}
                  {test.status === 'draft' && 'Brouillon'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!hasResults ? (
                <p className="text-sm text-muted-foreground">
                  Aucune donnée disponible pour ce test.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Metric Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Métrique cible:</span>
                    <span className="font-medium">{test.targetMetric}</span>
                  </div>

                  {/* Variants Comparison */}
                  <div className="space-y-3">
                    {testResults.map((result) => {
                      const variant = test.variants.find((v) => v.id === result.variantId);
                      if (!variant) return null;

                      const isControl = variant.id === 'control';
                      const controlResult = testResults.find((r) => r.variantId === 'control');
                      const improvement =
                        controlResult && !isControl
                          ? ((result.conversionRate - controlResult.conversionRate) /
                              controlResult.conversionRate) *
                            100
                          : 0;

                      return (
                        <div
                          key={result.variantId}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          {/* Variant Header */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{variant.name}</span>
                                {isControl && (
                                  <Badge variant="outline" className="text-xs">
                                    Contrôle
                                  </Badge>
                                )}
                                {result.isSignificant && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {variant.description}
                              </p>
                            </div>
                            {!isControl && (
                              <div className="text-right">
                                <div
                                  className={`flex items-center gap-1 text-sm font-medium ${
                                    improvement > 0
                                      ? 'text-green-600'
                                      : improvement < 0
                                      ? 'text-red-600'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {improvement > 0 ? (
                                    <TrendingUp className="h-4 w-4" />
                                  ) : improvement < 0 ? (
                                    <TrendingDown className="h-4 w-4" />
                                  ) : null}
                                  {improvement > 0 ? '+' : ''}
                                  {improvement.toFixed(1)}%
                                </div>
                                <p className="text-xs text-muted-foreground">vs contrôle</p>
                              </div>
                            )}
                          </div>

                          {/* Metrics */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Taux de conversion</p>
                              <p className="text-lg font-semibold">
                                {(result.conversionRate * 100).toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Échantillon</p>
                              <p className="text-lg font-semibold">
                                {result.sampleSize.toLocaleString('fr-FR')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">p-value</p>
                              <p className="text-lg font-semibold">{result.pValue.toFixed(4)}</p>
                            </div>
                          </div>

                          {/* Confidence Interval */}
                          <div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Intervalle de confiance (95%)</span>
                              <span>
                                {(result.confidenceInterval[0] * 100).toFixed(2)}% -{' '}
                                {(result.confidenceInterval[1] * 100).toFixed(2)}%
                              </span>
                            </div>
                            <Progress
                              value={result.conversionRate * 100}
                              className="h-2"
                            />
                          </div>

                          {/* Statistical Significance */}
                          <div className="flex items-center gap-2 text-sm">
                            {result.isSignificant ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-green-600 font-medium">
                                  Statistiquement significatif
                                </span>
                              </>
                            ) : result.sampleSize < test.minimumSampleSize ? (
                              <>
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <span className="text-amber-600">
                                  Échantillon insuffisant (
                                  {Math.round(
                                    (result.sampleSize / test.minimumSampleSize) * 100
                                  )}
                                  % de {test.minimumSampleSize})
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Non significatif (p &gt; 0.05)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
