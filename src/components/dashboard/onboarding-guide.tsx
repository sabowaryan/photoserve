"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Upload,
  Settings,
  Image as ImageIcon,
  UserPlus,
  X,
  Check,
  Rocket,
  PartyPopper,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import confetti from "canvas-confetti";

// Force recompile to clear HMR cache

interface OnboardingTask {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  action: {
    labelKey: string;
    href?: string;
    onClick?: () => void;
  };
  estimatedTime: number; // minutes
  required: boolean;
}

const ONBOARDING_TASKS: OnboardingTask[] = [
  {
    id: "create_first_gallery",
    titleKey: "onboarding.tasks.createGallery.title",
    descriptionKey: "onboarding.tasks.createGallery.description",
    icon: Upload,
    color: "from-emerald-500 to-teal-500",
    action: {
      labelKey: "onboarding.tasks.createGallery.action",
      href: "/dashboard/gallery/new",
    },
    estimatedTime: 2,
    required: true,
  },
  {
    id: "customize_profile",
    titleKey: "onboarding.tasks.customizeProfile.title",
    descriptionKey: "onboarding.tasks.customizeProfile.description",
    icon: Settings,
    color: "from-indigo-500 to-violet-500",
    action: {
      labelKey: "onboarding.tasks.customizeProfile.action",
      href: "/dashboard/settings",
    },
    estimatedTime: 1,
    required: false,
  },
  {
    id: "add_logo",
    titleKey: "onboarding.tasks.addLogo.title",
    descriptionKey: "onboarding.tasks.addLogo.description",
    icon: ImageIcon,
    color: "from-amber-500 to-orange-500",
    action: {
      labelKey: "onboarding.tasks.addLogo.action",
      href: "/dashboard/settings?tab=branding",
    },
    estimatedTime: 1,
    required: false,
  },
  {
    id: "invite_test_client",
    titleKey: "onboarding.tasks.inviteClient.title",
    descriptionKey: "onboarding.tasks.inviteClient.description",
    icon: UserPlus,
    color: "from-pink-500 to-rose-500",
    action: {
      labelKey: "onboarding.tasks.inviteClient.action",
      href: "/dashboard/gallery/new",
    },
    estimatedTime: 1,
    required: false,
  },
];

interface OnboardingGuideProps {
  onComplete: () => void;
  onDismiss: () => void;
  completedTasks?: string[];
  userId?: string;
  /**
   * Optional callback to expose task completion handler
   * This allows parent components to mark tasks as complete
   * when the actual action is performed (e.g., first gallery created)
   */
  onTaskCompleteHandler?: (handler: (taskId: string) => Promise<void>) => void;
}

export function OnboardingGuide({ 
  onComplete, 
  onDismiss,
  completedTasks: initialCompletedTasks = [],
  userId,
  onTaskCompleteHandler,
}: OnboardingGuideProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(
    new Set(initialCompletedTasks)
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate progress (0-100%)
  const progress = (completedTasks.size / ONBOARDING_TASKS.length) * 100;
  const isFullyCompleted = completedTasks.size === ONBOARDING_TASKS.length;

  // Load completed tasks from database on mount
  useEffect(() => {
    const loadCompletedTasks = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch from database
        const response = await fetch("/api/onboarding/tasks");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.tasks) {
            const completed = data.tasks
              .filter((task: any) => task.completed)
              .map((task: any) => task.step_id);
            setCompletedTasks(new Set(completed));
            
            // Also sync to localStorage for offline access
            if (typeof window !== "undefined") {
              localStorage.setItem(
                `onboarding_tasks_${userId}`,
                JSON.stringify(completed)
              );
            }
          }
        } else {
          // Fallback to localStorage if API fails
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem(`onboarding_tasks_${userId}`);
            if (stored) {
              try {
                const tasks = JSON.parse(stored);
                setCompletedTasks(new Set(tasks));
              } catch (error) {
                console.error("Failed to parse stored onboarding tasks:", error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to load onboarding tasks:", error);
        // Fallback to localStorage
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(`onboarding_tasks_${userId}`);
          if (stored) {
            try {
              const tasks = JSON.parse(stored);
              setCompletedTasks(new Set(tasks));
            } catch (error) {
              console.error("Failed to parse stored onboarding tasks:", error);
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCompletedTasks();
  }, [userId]);

  // Expose task completion handler to parent component
  useEffect(() => {
    if (onTaskCompleteHandler) {
      onTaskCompleteHandler(handleTaskComplete);
    }
  }, [onTaskCompleteHandler]);

  // Persist completed tasks to localStorage
  const persistCompletedTasks = (tasks: Set<string>) => {
    if (typeof window !== "undefined" && userId) {
      localStorage.setItem(
        `onboarding_tasks_${userId}`,
        JSON.stringify(Array.from(tasks))
      );
    }
  };

  // Trigger confetti celebration
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  // Handle task completion
  // This function can be called programmatically when a task is actually completed
  // (e.g., when user creates their first gallery, this should be called with "create_first_gallery")
  const handleTaskComplete = async (taskId: string) => {
    if (completedTasks.has(taskId)) return;

    setIsAnimating(true);
    const newCompletedTasks = new Set(completedTasks);
    newCompletedTasks.add(taskId);
    setCompletedTasks(newCompletedTasks);
    persistCompletedTasks(newCompletedTasks);

    // Persist to database
    try {
      await fetch("/api/onboarding/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, completed: true }),
      });
    } catch (error) {
      console.error("Failed to persist task completion:", error);
    }

    // Check if all tasks are completed
    if (newCompletedTasks.size === ONBOARDING_TASKS.length) {
      setShowCelebration(true);
      triggerConfetti();
      
      // Auto-complete onboarding after celebration
      setTimeout(() => {
        onComplete();
      }, 3000);
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  // Handle task action click
  const handleTaskAction = (task: OnboardingTask) => {
    if (task.action.onClick) {
      task.action.onClick();
    } else if (task.action.href) {
      router.push(task.action.href);
    }
  };

  // Handle dismiss with option to re-show
  const handleDismiss = () => {
    onDismiss();
  };

  // Show loading state while fetching tasks
  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xl shadow-indigo-500/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10 animate-pulse">
              <Rocket size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t("onboarding.title") || "Guide de démarrage"}
              </h3>
              <p className="text-xs text-white/70">
                {t("common.loading") || "Chargement..."}
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xl shadow-indigo-500/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/90 to-violet-600/90 z-50 flex items-center justify-center animate-in fade-in duration-500">
          <div className="text-center text-white space-y-4">
            <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
              <PartyPopper size={40} />
            </div>
            <h3 className="text-2xl font-black">
              {t("onboarding.celebration.title") || "Félicitations ! 🎉"}
            </h3>
            <p className="text-white/80 text-sm max-w-xs mx-auto">
              {t("onboarding.celebration.description") || "Vous avez terminé toutes les tâches d'onboarding !"}
            </p>
          </div>
        </div>
      )}

      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-5 relative overflow-hidden">
        {/* Header Orbs */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
              <Rocket size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t("onboarding.title") || "Guide de démarrage"}
              </h3>
              <p className="text-xs text-white/70">
                {completedTasks.size} / {ONBOARDING_TASKS.length} {t("onboarding.tasksCompleted") || "tâches complétées"}
              </p>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            aria-label={t("common.close") || "Fermer"}
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500 shadow-lg"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/60 text-right font-medium">
          {Math.round(progress)}% {t("common.complete") || "complété"}
        </p>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {ONBOARDING_TASKS.map((task) => {
          const TaskIcon = task.icon;
          const isCompleted = completedTasks.has(task.id);
          
          return (
            <div
              key={task.id}
              className={`group relative bg-white rounded-xl border-2 transition-all duration-300 ${
                isCompleted
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-slate-200 hover:border-indigo-200 hover:shadow-md"
              } ${isAnimating && completedTasks.has(task.id) ? "animate-pulse" : ""}`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Task Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : `bg-gradient-to-br ${task.color} text-white`
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={20} strokeWidth={3} />
                    ) : (
                      <TaskIcon size={20} />
                    )}
                  </div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`text-sm font-bold ${isCompleted ? "text-emerald-700" : "text-slate-900"}`}>
                        {t(task.titleKey)}
                        {task.required && (
                          <span className="ml-1.5 text-xs text-rose-500">*</span>
                        )}
                      </h4>
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                        {task.estimatedTime} min
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      {t(task.descriptionKey)}
                    </p>

                    {/* Action Button */}
                    {!isCompleted && (
                      <button
                        onClick={() => handleTaskAction(task)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${task.color} text-white text-xs font-bold rounded-lg shadow-sm transition-all hover:shadow-md active:scale-[0.98]`}
                      >
                        <span>{t(task.action.labelKey)}</span>
                        <Sparkles size={12} />
                      </button>
                    )}

                    {isCompleted && (
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <Check size={14} strokeWidth={3} />
                        <span className="text-xs font-bold">
                          {t("onboarding.taskCompleted") || "Terminé"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Completion Badge */}
              {isCompleted && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="px-5 pb-5 flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <button
          onClick={handleDismiss}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
        >
          <span>{t("onboarding.dismissWithReshow") || "Fermer (réafficher plus tard)"}</span>
        </button>

        {isFullyCompleted && !showCelebration && (
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
          >
            <Check size={16} />
            <span>{t("onboarding.finish") || "Terminer"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
