'use client';

/**
 * SavingsCalculator Component
 * Calculate annual savings compared to competitors
 * 
 * @module components/conversion/savings-calculator
 * Requirements: 9.3
 */

import { useState } from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SavingsCalculatorProps {
  competitorName: string;
  competitorPrice: number;
  competitorCommission: number;
  pikSendPrice?: number;
  pikSendCommission?: number;
}

export function SavingsCalculator({
  competitorName,
  competitorPrice,
  competitorCommission,
  pikSendPrice = 19.99,
  pikSendCommission = 0.10,
}: SavingsCalculatorProps) {
  const [monthlyRevenue, setMonthlyRevenue] = useState(5000);

  const calculateSavings = () => {
    // Annual subscription cost difference
    const subscriptionSavings = (competitorPrice - pikSendPrice) * 12;

    // Annual commission savings
    const competitorCommissionAmount = monthlyRevenue * 12 * competitorCommission;
    const pikSendCommissionAmount = monthlyRevenue * 12 * pikSendCommission;
    const commissionSavings = competitorCommissionAmount - pikSendCommissionAmount;

    // Total annual savings
    const totalSavings = subscriptionSavings + commissionSavings;

    return {
      subscriptionSavings,
      commissionSavings,
      totalSavings,
    };
  };

  const savings = calculateSavings();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <CardTitle>Calculateur d'économies</CardTitle>
        </div>
        <CardDescription>
          Combien économisez-vous en passant à PikSend ?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input */}
        <div>
          <Label htmlFor="monthlyRevenue">Vos revenus mensuels de galeries ($)</Label>
          <Input
            id="monthlyRevenue"
            type="number"
            min="0"
            step="100"
            value={monthlyRevenue}
            onChange={(e) => setMonthlyRevenue(parseFloat(e.target.value) || 0)}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-gray-500">
            Estimation basée sur vos ventes de photos via galeries
          </p>
        </div>

        {/* Results */}
        <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
          {/* Subscription savings */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Économie sur l'abonnement</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(savings.subscriptionSavings)}/an
            </span>
          </div>

          {/* Commission savings */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <div>
              <span className="text-sm text-gray-600">Économie sur les commissions</span>
              <p className="text-xs text-gray-500">
                {competitorCommission * 100}% vs {pikSendCommission * 100}%
              </p>
            </div>
            <span className="font-semibold text-gray-900">
              {formatCurrency(savings.commissionSavings)}/an
            </span>
          </div>

          {/* Total savings */}
          <div className="flex items-center justify-between border-t-2 border-green-200 pt-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-gray-900">Économie totale</span>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(savings.totalSavings)}
            </span>
          </div>

          <p className="text-center text-xs text-gray-600">
            par an en passant de {competitorName} à PikSend
          </p>
        </div>

        {/* CTA */}
        <div className="rounded-md bg-green-600 p-4 text-center text-white">
          <p className="mb-1 text-sm font-medium">
            Commencez à économiser dès aujourd'hui
          </p>
          <p className="text-xs opacity-90">
            Pas de carte bancaire requise • Migration gratuite
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
