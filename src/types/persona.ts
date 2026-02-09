/**
 * Persona Types
 * Type definitions for persona segmentation and quiz
 * 
 * @module types/persona
 * Requirements: 1.3, 1.4
 */

/**
 * Persona types representing different photographer segments
 */
export type Persona = 'wedding' | 'event' | 'portrait' | 'studio';

/**
 * Quiz answers from the persona segmentation quiz
 */
export interface QuizAnswers {
  photographerType: string;
  projectsPerMonth: string;
  primaryGoal: string;
}

/**
 * Complete persona data including quiz results and metadata
 */
export interface PersonaData {
  id: string;
  userId?: string; // null if visitor
  persona: Persona;
  answers: QuizAnswers;
  confidence: number; // 0-1
  source: 'quiz' | 'inferred' | 'manual';
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Result returned after quiz completion
 */
export interface PersonaQuizResult {
  persona: Persona;
  answers: QuizAnswers;
  confidence: number;
  timestamp: Date;
}

/**
 * Persona-specific content configuration
 */
export interface PersonaContent {
  persona: Persona;
  displayName: string;
  landingPageUrl: string;
  heroHeadline: string;
  heroSubheadline: string;
  recommendedPlan: 'free' | 'premium' | 'pro' | 'custom';
  roiDefaults: {
    projectsPerMonth: number;
    averagePrice: number;
    salesPerProject: number;
  };
  faqQuestions: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * Persona storage configuration
 */
export interface PersonaStorageConfig {
  localStorageKey: string;
  cookieName: string;
  ttlDays: number;
}
