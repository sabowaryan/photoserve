/**
 * Persona Mapping Logic
 * Maps quiz answers to persona types
 * 
 * @module lib/persona/mapping
 * Requirements: 1.3
 */

import type { Persona, QuizAnswers, PersonaQuizResult } from '@/types/persona';

/**
 * Map quiz answers to a persona type
 * 
 * Requirement 1.3: WHEN un visiteur complète le Persona_Quiz, THE System SHALL rediriger vers la Landing_Page correspondant au persona identifié
 */
export function mapAnswersToPersona(answers: QuizAnswers): PersonaQuizResult {
  const { photographerType } = answers;

  let persona: Persona;
  let confidence = 1.0;

  // Primary mapping based on photographer type
  switch (photographerType.toLowerCase()) {
    case 'wedding':
    case 'mariage':
    case 'weddings':
      persona = 'wedding';
      break;

    case 'event':
    case 'événementiel':
    case 'events':
    case 'corporate':
      persona = 'event';
      break;

    case 'portrait':
    case 'portraits':
    case 'family':
    case 'famille':
    case 'headshots':
      persona = 'portrait';
      break;

    case 'studio':
    case 'commercial':
    case 'product':
    case 'produit':
      persona = 'studio';
      break;

    default:
      // Fallback: infer from other answers
      persona = inferPersonaFromContext(answers);
      confidence = 0.7; // Lower confidence for inferred personas
  }

  // Adjust confidence based on consistency of answers
  if (isConsistentAnswers(persona, answers)) {
    confidence = Math.min(confidence + 0.1, 1.0);
  } else {
    confidence = Math.max(confidence - 0.2, 0.5);
  }

  return {
    persona,
    answers,
    confidence,
    timestamp: new Date(),
  };
}

/**
 * Infer persona from context when primary type is unclear
 */
function inferPersonaFromContext(answers: QuizAnswers): Persona {
  const { projectsPerMonth, primaryGoal } = answers;

  // High volume suggests event or portrait
  const volume = parseInt(projectsPerMonth) || 0;
  if (volume >= 15) {
    // High volume + revenue focus = event
    if (primaryGoal.toLowerCase().includes('revenue') || 
        primaryGoal.toLowerCase().includes('revenu')) {
      return 'event';
    }
    // High volume + other = portrait
    return 'portrait';
  }

  // Low volume suggests wedding or studio
  if (volume <= 5) {
    // Low volume + premium focus = wedding
    if (primaryGoal.toLowerCase().includes('premium') ||
        primaryGoal.toLowerCase().includes('quality') ||
        primaryGoal.toLowerCase().includes('qualité')) {
      return 'wedding';
    }
    // Low volume + other = studio
    return 'studio';
  }

  // Medium volume = portrait (most common)
  return 'portrait';
}

/**
 * Check if answers are consistent with the identified persona
 */
function isConsistentAnswers(persona: Persona, answers: QuizAnswers): boolean {
  const volume = parseInt(answers.projectsPerMonth) || 0;
  const goal = answers.primaryGoal.toLowerCase();

  switch (persona) {
    case 'wedding':
      // Weddings typically have lower volume, premium focus
      return volume <= 5 && (
        goal.includes('premium') ||
        goal.includes('quality') ||
        goal.includes('qualité')
      );

    case 'event':
      // Events typically have higher volume, revenue focus
      return volume >= 8 && (
        goal.includes('revenue') ||
        goal.includes('revenu') ||
        goal.includes('scale') ||
        goal.includes('échelle')
      );

    case 'portrait':
      // Portraits typically have medium-high volume
      return volume >= 5 && volume <= 15;

    case 'studio':
      // Studios typically have lower volume, efficiency focus
      return volume <= 10 && (
        goal.includes('efficiency') ||
        goal.includes('efficacité') ||
        goal.includes('workflow')
      );

    default:
      return false;
  }
}

/**
 * Get landing page URL for a persona
 */
export function getPersonaLandingPage(persona: Persona): string {
  const urls: Record<Persona, string> = {
    wedding: '/for/photographers/wedding',
    event: '/for/photographers/event',
    portrait: '/for/photographers/portrait',
    studio: '/for/studios',
  };

  return urls[persona];
}

/**
 * Get display name for a persona
 */
export function getPersonaDisplayName(persona: Persona): string {
  const names: Record<Persona, string> = {
    wedding: 'Wedding Photographer',
    event: 'Event Photographer',
    portrait: 'Portrait Photographer',
    studio: 'Studio',
  };

  return names[persona];
}
