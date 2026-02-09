'use client';

/**
 * ROICalculator Component
 * Interactive ROI calculator with persona-specific defaults
 * 
 * @module components/conversion/roi-calculator
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { useState, useEffect } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Persona } from '@/types/persona';
import { getPersonaLandingContent } from '@/lib/persona/content';
import { createAnalyticsService } from '@/lib/services/analytics.service';
import { createClient } from '@/lib/supabase/client';
import { useVisitorFingerprint } from '@/hooks/use-visitor-fingerprint';

interface ROICalculatorProps {
  persona?: Persona;
  defaultValues?: ROIInputs;
  onCalculate?: (result: ROIResult) => void;
  variant?: 'inline' | 'modal' | 'sidebar';
}

interface ROIInputs {
  projectsPerMonth: number;
  averagePrice: number;
  salesPerProject: number;
}

interface ROIResult {
  monthlyRevenue: number;
  photographerKeeps: number;
  pikSendCommission: number;
  competitorComparison: {
    competitor: string;
    commission: number;
    savings: number;
  };
  paybackPeriod: number;
  roi: number;
}

const COMPETITOR_COMMISSION = 0.15; // 15%
const PIKSEND_COMMISSION = 0.10; // 10%
const PREMIUM_PLAN_PRICE = 9.99;
const PRO_PLAN_PRICE = 19.99;

export function ROICalculator({ 
  persona, 
  defaultValues, 
  onCalculate,
  variant = 'inline' 
}: ROICalculatorProps) {
  const visitorId = useVisitorFingerprint();
  
  // Requirement 3.6: Pre-fill with persona defaults
  const getDefaults = (): ROIInputs => {
    if (defaultValues) return defaultValues;
    if (persona) {
      const content = getPersonaLandingContent(persona);
      return content.roiDefaults;
    }
    // Fallback defaults
    return {
      projectsPerMonth: 5,
      averagePrice: 100,
      salesPerProject: 10,
    };
  };

  const [inputs, setInputs] = useState<ROIInputs>(getDefaults());
  const [result, setResult] = useState<ROIResult | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Requirement 3.2: Calculate ROI in real-time
  useEffect(() => {
    const calculated = calculateROI(inputs);
    setResult(calculated);
    
    if (onCalculate) {
      onCalculate(calculated);
    }
  }, [inputs, onCalculate]);

  // Track calculator usage
  useEffect(() => {
    if (hasInteracted && visitorId) {
      const supabase = createClient();
      const analytics = createAnalyticsService(supabase);
      analytics.trackFunnelEvent('roi_calculator_used', {
        roiInputs: inputs,
        roiResults: result ? {
          monthlyRevenue: result.monthlyRevenue,
          photographerKeeps: result.photographerKeeps,
          roi: result.roi,
        } : undefined,
        persona,
      }, visitorId);
    }
  }, [hasInteracted, visitorId, persona]);

  const calculateROI = (inputs: ROIInputs): ROIResult => {
    // Requirement 3.2: Calculate monthly revenue
    const monthlyRevenue = inputs.projectsPerMonth * inputs.salesPerProject * inputs.averagePrice;

    // Requirement 3.3: Calculate photographer keeps (90%)
    const photographerKeeps = monthlyRevenue * (1 - PIKSEND_COMMISSION);

    // PikSend commission (10%)
    const pikSendCommission = monthlyRevenue * PIKSEND_COMMISSION;

    // Requirement 3.4: Compare with competitor (15% commission)
    const competitorCommission = monthlyRevenue * COMPETITOR_COMMISSION;
    const savings = competitorCommission - pikSendCommission;

    // Requirement 3.5: Calculate payback period
    const subscriptionCost = persona === 'studio' ? PRO_PLAN_PRICE : 
                            persona === 'wedding' || persona === 'event' ? PRO_PLAN_PRICE : 
                            PREMIUM_PLAN_PRICE;
    const paybackPeriod = subscriptionCost / savings;

    // Calculate ROI percentage
    const annualRevenue = photographerKeeps * 12;
    const annualCost = subscriptionCost * 12;
    const roi = ((annualRevenue - annualCost) / annualCost) * 100;

    return {
      monthlyRevenue,
      photographerKeeps,
      pikSendCommission,
      competitorComparison: {
        competitor: 'Pixieset/Pic-Time',
        commission: competitorCommission,
        savings,
      },
      paybackPeriod,
      roi,
    };
  };

  const handleInputChange = (field: keyof ROIInputs, value: string) => {
    setHasInteracted(true);
    const numValue = parseFloat(value) || 0;
    
    // Requirement 3.1: Validate inputs (must be positive)
    if (numValue < 0) return;

    setInputs(prev => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card className={variant === 'inline' ? 'w-full' : ''}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          <CardTitle>Calculateur ROI</CardTitle>
        </div>
        <CardDescription>
          Calculez vos revenus potentiels avec PikSend
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="projectsPerMonth">Projets par mois</Label>
            <Input
              id="projectsPerMonth"
              type="number"
              min="0"
              value={inputs.projectsPerMonth}
              onChange={(e) => handleInputChange('projectsPerMonth', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="averagePrice">Prix moyen par photo ($)</Label>
            <Input
              id="averagePrice"
              type="number"
              min="0"
              step="0.01"
              value={inputs.averagePrice}
              onChange={(e) => handleInputChange('averagePrice', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="salesPerProject">Ventes par projet</Label>
            <Input
              id="salesPerProject"
              type="number"
              min="0"
              value={inputs.salesPerProject}
              onChange={(e) => handleInputChange('salesPerProject', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            {/* Monthly Revenue */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenus mensuels</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(result.monthlyRevenue)}
              </span>
            </div>

            {/* Photographer Keeps */}
            <div className="flex items-center justify-between border-t border-blue-200 pt-3">
              <span className="text-sm font-medium text-gray-700">Vous gardez (90%)</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(result.photographerKeeps)}
              </span>
            </div>

            {/* PikSend Commission */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Commission PikSend (10%)</span>
              <span className="text-gray-900">{formatCurrency(result.pikSendCommission)}</span>
            </div>

            {/* Competitor Comparison */}
            <div className="rounded-md bg-white p-3">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  vs {result.competitorComparison.competitor}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Leur commission (15%)</span>
                  <span className="text-gray-900">
                    {formatCurrency(result.competitorComparison.commission)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-green-700">Vous économisez</span>
                  <span className="text-green-700">
                    {formatCurrency(result.competitorComparison.savings)}/mois
                  </span>
                </div>
              </div>
            </div>

            {/* Payback Period */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Rentabilisé en</span>
              <span className="font-semibold text-gray-900">
                {result.paybackPeriod < 1 
                  ? `${Math.ceil(result.paybackPeriod * 30)} jours`
                  : `${result.paybackPeriod.toFixed(1)} mois`
                }
              </span>
            </div>

            {/* ROI */}
            <div className="flex items-center justify-between border-t border-blue-200 pt-3">
              <span className="text-sm font-medium text-gray-700">ROI annuel</span>
              <span className="text-lg font-bold text-blue-600">
                {formatPercent(result.roi)}
              </span>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-md bg-blue-600 p-4 text-center text-white">
          <p className="mb-2 text-sm font-medium">
            Commencez à économiser {result && formatCurrency(result.competitorComparison.savings)} par mois
          </p>
          <p className="text-xs opacity-90">
            Pas de carte bancaire requise • 14 jours d'essai gratuit
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
