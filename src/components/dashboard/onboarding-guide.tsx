"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Upload,
  Settings,
  Share2,
  X,
  Check,
  ArrowRight,
  Rocket,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface OnboardingStep {
  id: number;
  titleKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    titleKey: "onboarding.welcome.title",
    descriptionKey: "onboarding.welcome.description",
    icon: Sparkles,
    color: "from-indigo-500 to-violet-500",
  },
  {
    id: 2,
    titleKey: "onboarding.upload.title",
    descriptionKey: "onboarding.upload.description",
    icon: Upload,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: 3,
    titleKey: "onboarding.customize.title",
    descriptionKey: "onboarding.customize.description",
    icon: Settings,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: 4,
    titleKey: "onboarding.share.title",
    descriptionKey: "onboarding.share.description",
    icon: Share2,
    color: "from-pink-500 to-rose-500",
  },
];

interface OnboardingGuideProps {
  onComplete: () => void;
  onDismiss: () => void;
}

export function OnboardingGuide({ onComplete, onDismiss }: OnboardingGuideProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      onComplete();
      router.push("/dashboard/gallery/new");
    }
  };

  const handleSkip = () => {
    onDismiss();
  };

  const step = ONBOARDING_STEPS[currentStep]!;
  const StepIcon = step.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xl shadow-indigo-500/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Gradient Header */}
      <div className={`bg-gradient-to-r ${step.color} p-5 relative overflow-hidden`}>
        {/* Header Orbs */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
              <Rocket size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Guide de démarrage</h3>
              <p className="text-xs text-white/70">Étape {currentStep + 1} sur {ONBOARDING_STEPS.length}</p>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Step content */}
        <div
          className={`transition-all duration-200 ${
            isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          {/* Icon and Title Row */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
              <StepIcon size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {t(step.titleKey)}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t(step.descriptionKey)}
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-4">
            {ONBOARDING_STEPS.map((s, index) => {
              const Icon = s.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div
                  key={s.id}
                  className={`relative p-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${s.color} text-white shadow-md`
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check size={8} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                  <Icon size={16} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
          >
            {t("onboarding.skip")}
          </button>

          <button
            onClick={handleNext}
            className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${step.color} text-white text-sm font-bold rounded-xl shadow-lg transition-all hover:shadow-xl active:scale-[0.98] group`}
          >
            <span>{isLastStep ? t("onboarding.finish") : t("common.next")}</span>
            {isLastStep ? (
              <Sparkles size={14} />
            ) : (
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
