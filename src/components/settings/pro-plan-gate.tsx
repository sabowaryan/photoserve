"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Crown, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";

interface ProPlanGateProps {
  children: ReactNode;
}

/**
 * Pro Plan Gate Component
 * 
 * Checks user's plan type and shows upgrade prompt if not Pro
 * Requirements: 1.10, 7.9
 */
export function ProPlanGate({ children }: ProPlanGateProps) {
  const { isPro, isLoading, plan } = useSubscription();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          Loading...
        </div>
      </div>
    );
  }

  // If user has Pro plan, render children
  if (isPro) {
    return <>{children}</>;
  }

  // Show upgrade prompt for non-Pro users
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
            <Crown className="h-8 w-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl">Pro Plan Required</CardTitle>
          <CardDescription className="text-base">
            API keys for the Lightroom plugin are available exclusively to Pro plan subscribers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan Badge */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-600 mb-1">Your current plan</p>
            <p className="text-lg font-semibold text-slate-900 capitalize">
              {plan}
            </p>
          </div>

          {/* Pro Plan Features */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              What you'll get with Pro
            </h3>
            <ul className="space-y-2">
              {[
                "Lightroom Classic plugin integration",
                "Unlimited API keys for automation",
                "Direct upload from Lightroom to PikSend",
                "Automatic gallery creation and management",
                "Priority support and updates",
                "All Premium features included",
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="h-3 w-3 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild className="flex-1" size="lg">
              <Link href="/pricing">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link href="/pricing">
                Compare Plans
              </Link>
            </Button>
          </div>

          {/* Additional Info */}
          <p className="text-center text-sm text-slate-500 pt-2">
            Questions? <Link href="/contact" className="text-indigo-600 hover:text-indigo-700 underline">Contact us</Link> to learn more about Pro features
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
