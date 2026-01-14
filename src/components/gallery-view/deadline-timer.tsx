"use client";

import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";

interface DeadlineTimerProps {
  deadline: Date;
  onExpired?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(deadline: Date): TimeRemaining {
  const now = new Date().getTime();
  const deadlineTime = new Date(deadline).getTime();
  const difference = deadlineTime - now;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

export function DeadlineTimer({ deadline, onExpired }: DeadlineTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(deadline)
  );

  useEffect(() => {
    // Initial calculation
    const initial = calculateTimeRemaining(deadline);
    setTimeRemaining(initial);

    // If already expired, call onExpired immediately
    if (initial.isExpired && onExpired) {
      onExpired();
    }

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(deadline);
      setTimeRemaining(remaining);

      // Call onExpired when timer reaches zero
      if (remaining.isExpired && onExpired) {
        onExpired();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline, onExpired]);

  // Determine urgency level for styling
  const getUrgencyLevel = (): "critical" | "warning" | "normal" => {
    if (timeRemaining.isExpired) return "critical";
    if (timeRemaining.days === 0 && timeRemaining.hours < 24) return "critical";
    if (timeRemaining.days <= 3) return "warning";
    return "normal";
  };

  const urgency = getUrgencyLevel();

  // Styling based on urgency
  const containerStyles = {
    critical: "bg-gradient-to-br from-rose-50 to-red-50 border-rose-200",
    warning: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200",
    normal: "bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200",
  };

  const iconStyles = {
    critical: "text-rose-600",
    warning: "text-amber-600",
    normal: "text-indigo-600",
  };

  const textStyles = {
    critical: "text-rose-900",
    warning: "text-amber-900",
    normal: "text-indigo-900",
  };

  const badgeStyles = {
    critical: "bg-rose-600 text-white",
    warning: "bg-amber-600 text-white",
    normal: "bg-indigo-600 text-white",
  };

  if (timeRemaining.isExpired) {
    return (
      <div className={`rounded-2xl border-2 p-4 ${containerStyles.critical}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className={`w-6 h-6 ${iconStyles.critical}`} />
          </div>
          <div className="flex-1">
            <p className={`font-black text-sm ${textStyles.critical}`}>
              Délai de sélection expiré
            </p>
            <p className="text-xs text-rose-600 font-medium">
              Le temps pour sélectionner vos photos est écoulé
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border-2 p-4 ${containerStyles[urgency]}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 ${urgency === 'critical' ? 'bg-rose-100' : urgency === 'warning' ? 'bg-amber-100' : 'bg-indigo-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Clock className={`w-6 h-6 ${iconStyles[urgency]}`} />
        </div>
        <div className="flex-1">
          <p className={`font-black text-sm ${textStyles[urgency]}`}>
            {urgency === "critical"
              ? "⚠️ Temps presque écoulé !"
              : urgency === "warning"
              ? "⏰ Sélectionnez vos photos"
              : "📸 Temps pour sélectionner"}
          </p>
          <p className={`text-xs font-medium ${urgency === 'critical' ? 'text-rose-600' : urgency === 'warning' ? 'text-amber-600' : 'text-indigo-600'}`}>
            Marquez vos favoris avant la fin du délai
          </p>
        </div>
      </div>

      {/* Countdown Display */}
      <div className="grid grid-cols-4 gap-2">
        {/* Days */}
        <div className="text-center">
          <div className={`${badgeStyles[urgency]} rounded-xl py-2 px-1 mb-1`}>
            <p className="text-2xl font-black leading-none">
              {timeRemaining.days.toString().padStart(2, "0")}
            </p>
          </div>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${textStyles[urgency]}`}>
            Jours
          </p>
        </div>

        {/* Hours */}
        <div className="text-center">
          <div className={`${badgeStyles[urgency]} rounded-xl py-2 px-1 mb-1`}>
            <p className="text-2xl font-black leading-none">
              {timeRemaining.hours.toString().padStart(2, "0")}
            </p>
          </div>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${textStyles[urgency]}`}>
            Heures
          </p>
        </div>

        {/* Minutes */}
        <div className="text-center">
          <div className={`${badgeStyles[urgency]} rounded-xl py-2 px-1 mb-1`}>
            <p className="text-2xl font-black leading-none">
              {timeRemaining.minutes.toString().padStart(2, "0")}
            </p>
          </div>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${textStyles[urgency]}`}>
            Minutes
          </p>
        </div>

        {/* Seconds */}
        <div className="text-center">
          <div className={`${badgeStyles[urgency]} rounded-xl py-2 px-1 mb-1`}>
            <p className="text-2xl font-black leading-none">
              {timeRemaining.seconds.toString().padStart(2, "0")}
            </p>
          </div>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${textStyles[urgency]}`}>
            Secondes
          </p>
        </div>
      </div>
    </div>
  );
}
