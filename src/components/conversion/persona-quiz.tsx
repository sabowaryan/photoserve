'use client';

/**
 * PersonaQuiz Component
 * Modal quiz to segment visitors into personas
 * 
 * @module components/conversion/persona-quiz
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { QuizAnswers, PersonaQuizResult, PersonaData } from '@/types/persona';
import { mapAnswersToPersona, getPersonaLandingPage } from '@/lib/persona/mapping';
import { savePersonaData, hasCompletedQuiz } from '@/lib/persona/storage';
import { createAnalyticsService } from '@/lib/services/analytics.service';
import { createClient } from '@/lib/supabase/client';
import { useVisitorFingerprint } from '@/hooks/use-visitor-fingerprint';

interface PersonaQuizProps {
  onComplete?: (result: PersonaQuizResult) => void;
  onSkip?: () => void;
  trigger?: 'time' | 'scroll' | 'manual';
  delay?: number; // milliseconds
}

interface QuizState {
  currentStep: number;
  answers: Partial<QuizAnswers>;
  isSubmitting: boolean;
  error: string | null;
}

const QUIZ_QUESTIONS = [
  {
    id: 'photographerType',
    question: 'Quel type de photographe êtes-vous ?',
    options: [
      { value: 'wedding', label: 'Photographe de mariage' },
      { value: 'event', label: 'Photographe événementiel' },
      { value: 'portrait', label: 'Photographe portrait/famille' },
      { value: 'studio', label: 'Studio photo/commercial' },
    ],
  },
  {
    id: 'projectsPerMonth',
    question: 'Combien de projets réalisez-vous par mois ?',
    options: [
      { value: '1-3', label: '1-3 projets' },
      { value: '4-7', label: '4-7 projets' },
      { value: '8-15', label: '8-15 projets' },
      { value: '15+', label: '15+ projets' },
    ],
  },
  {
    id: 'primaryGoal',
    question: 'Quel est votre objectif principal ?',
    options: [
      { value: 'revenue', label: 'Maximiser mes revenus' },
      { value: 'efficiency', label: 'Gagner du temps' },
      { value: 'quality', label: 'Offrir une expérience premium' },
      { value: 'scale', label: 'Faire grandir mon business' },
    ],
  },
];

export function PersonaQuiz({ 
  onComplete, 
  onSkip, 
  trigger = 'time', 
  delay = 3000 
}: PersonaQuizProps) {
  const router = useRouter();
  const visitorId = useVisitorFingerprint();
  const [isVisible, setIsVisible] = useState(false);
  const [state, setState] = useState<QuizState>({
    currentStep: 0,
    answers: {},
    isSubmitting: false,
    error: null,
  });

  // Requirement 1.1: THE System SHALL afficher le Persona_Quiz après 3 secondes ou après un scroll de 20%
  useEffect(() => {
    // Don't show if already completed
    if (hasCompletedQuiz()) {
      return;
    }

    if (trigger === 'manual') {
      setIsVisible(true);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let scrollHandler: (() => void) | undefined;

    if (trigger === 'time') {
      timeoutId = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    }

    if (trigger === 'scroll') {
      scrollHandler = () => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= 20) {
          setIsVisible(true);
          window.removeEventListener('scroll', scrollHandler!);
        }
      };
      window.addEventListener('scroll', scrollHandler);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
    };
  }, [trigger, delay]);

  // Track quiz started
  useEffect(() => {
    if (isVisible && visitorId) {
      const supabase = createClient();
      const analytics = createAnalyticsService(supabase);
      analytics.trackFunnelEvent('quiz_started', {}, visitorId);
    }
  }, [isVisible, visitorId]);

  const currentQuestion = QUIZ_QUESTIONS[state.currentStep];
  const isLastStep = state.currentStep === QUIZ_QUESTIONS.length - 1;

  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;
    
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: value,
      },
    }));
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    
    if (!state.answers[currentQuestion.id as keyof QuizAnswers]) {
      setState(prev => ({ ...prev, error: 'Veuillez sélectionner une réponse' }));
      return;
    }

    setState(prev => ({ ...prev, error: null }));

    if (isLastStep) {
      handleSubmit();
    } else {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const handleBack = () => {
    setState(prev => ({ 
      ...prev, 
      currentStep: Math.max(0, prev.currentStep - 1),
      error: null,
    }));
  };

  const handleSubmit = async () => {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Requirement 1.2: THE Persona_Quiz SHALL contenir exactement 3 questions
      const answers = state.answers as QuizAnswers;
      
      // Requirement 1.3: Map answers to persona
      const result = mapAnswersToPersona(answers);

      // Requirement 1.4: Store in localStorage and cookies
      const personaData: PersonaData = {
        id: crypto.randomUUID(),
        persona: result.persona,
        answers: result.answers,
        confidence: result.confidence,
        source: 'quiz',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      };

      savePersonaData(personaData);

      // Track quiz completion
      if (visitorId) {
        const supabase = createClient();
        const analytics = createAnalyticsService(supabase);
        await analytics.trackFunnelEvent('quiz_completed', {
          persona: result.persona,
          quizAnswers: answers,
        }, visitorId);
      }

      // Callback
      if (onComplete) {
        onComplete(result);
      }

      // Requirement 1.3: Redirect to persona landing page
      const landingPage = getPersonaLandingPage(result.persona);
      router.push(landingPage);

    } catch (error) {
      console.error('Quiz submission error:', error);
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        error: 'Une erreur est survenue. Veuillez réessayer.',
      }));
    }
  };

  const handleSkip = async () => {
    // Track quiz skipped
    if (visitorId) {
      const supabase = createClient();
      const analytics = createAnalyticsService(supabase);
      await analytics.trackFunnelEvent('quiz_skipped', {}, visitorId);
    }

    setIsVisible(false);
    if (onSkip) {
      onSkip();
    }
  };

  // Requirement 1.6: THE System SHALL permettre au visiteur de fermer le Persona_Quiz
  if (!isVisible || !currentQuestion) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span>Question {state.currentStep + 1} sur {QUIZ_QUESTIONS.length}</span>
            <span>{Math.round(((state.currentStep + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div 
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((state.currentStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            {currentQuestion.question}
          </h2>

          <RadioGroup
            value={state.answers[currentQuestion.id as keyof QuizAnswers] || ''}
            onValueChange={handleAnswer}
          >
            {currentQuestion.options.map((option) => (
              <div key={option.value} className="mb-3 flex items-center space-x-3">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label 
                  htmlFor={option.value}
                  className="flex-1 cursor-pointer text-base"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Error message */}
        {state.error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {state.error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {state.currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={state.isSubmitting}
              className="flex-1"
            >
              Retour
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={state.isSubmitting || !state.answers[currentQuestion.id as keyof QuizAnswers]}
            className="flex-1"
          >
            {state.isSubmitting ? 'Envoi...' : isLastStep ? 'Terminer' : 'Suivant'}
          </Button>
        </div>

        {/* Skip link */}
        <div className="mt-4 text-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Je ferai ça plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
