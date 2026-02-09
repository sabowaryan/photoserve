"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordStrengthIndicatorProps {
  password: string;
  onStrengthChange?: (strength: number) => void;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: "Contains uppercase letter",
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: "Contains lowercase letter",
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: "Contains number",
    test: (pwd) => /\d/.test(pwd),
  },
  {
    label: "Contains special character",
    test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  },
];

const getStrengthColor = (strength: number): string => {
  if (strength === 0) return "bg-slate-800";
  if (strength <= 2) return "bg-rose-500"; // Weak - rose-500
  if (strength === 3) return "bg-amber-500"; // Fair - amber-500
  if (strength === 4) return "bg-yellow-500"; // Good - yellow-500
  return "bg-emerald-500"; // Strong/Very Strong - emerald-500
};

const getStrengthLabel = (strength: number): { label: string; color: string } => {
  if (strength === 0) return { label: "No password", color: "text-slate-400" };
  if (strength <= 2) return { label: "Weak", color: "text-rose-400" };
  if (strength === 3) return { label: "Fair", color: "text-amber-400" };
  if (strength === 4) return { label: "Good", color: "text-yellow-400" };
  return { label: "Strong", color: "text-emerald-400" };
};

const PasswordStrengthIndicator = React.forwardRef<
  HTMLDivElement,
  PasswordStrengthIndicatorProps
>(({ password, onStrengthChange, className }, ref) => {
  const metRequirements = requirements.filter((req) => req.test(password));
  const strength = metRequirements.length;
  const strengthInfo = getStrengthLabel(strength);

  React.useEffect(() => {
    onStrengthChange?.(strength);
  }, [strength, onStrengthChange]);

  if (!password) {
    return null;
  }

  return (
    <div ref={ref} className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">
            Password strength
          </span>
          <span
            className={cn(
              "text-xs font-semibold transition-colors duration-300",
              strengthInfo.color
            )}
          >
            {strengthInfo.label}
          </span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors duration-300",
                level <= strength
                  ? getStrengthColor(strength)
                  : "bg-slate-800"
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-300">Requirements:</p>
        <ul className="space-y-1.5">
          {requirements.map((req, index) => {
            const isMet = req.test(password);
            return (
              <li
                key={index}
                className="flex items-center gap-2 text-xs"
              >
                {isMet ? (
                  <Check
                    size={16}
                    className="text-emerald-500 flex-shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <X
                    size={16}
                    className="text-slate-400 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "transition-colors duration-300",
                    isMet ? "text-emerald-400 font-medium" : "text-slate-400"
                  )}
                >
                  {req.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
});

PasswordStrengthIndicator.displayName = "PasswordStrengthIndicator";

export { PasswordStrengthIndicator };
