/**
 * A/B Testing Types
 * 
 * Types for A/B testing infrastructure including tests, variants, assignments, and results.
 */

export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  status: ABTestStatus;
  startDate: Date;
  endDate?: Date;
  targetMetric: string;
  minimumSampleSize: number;
  confidenceLevel: number; // 0.95 = 95%
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  traffic: number; // 0-1 (0.5 = 50%)
  config: Record<string, any>;
}

export interface ABTestAssignment {
  sessionId: string;
  userId?: string;
  testId: string;
  variantId: string;
  assignedAt: Date;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  metric: string;
  value: number;
  sampleSize: number;
  conversionRate: number;
  confidenceInterval: [number, number];
  pValue: number;
  isSignificant: boolean;
}

/**
 * Configuration for active A/B tests
 */
export interface ABTestConfig {
  tests: ABTest[];
}
