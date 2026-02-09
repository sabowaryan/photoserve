"use client";

import * as React from "react";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      success = false,
      icon,
      showPasswordToggle = false,
      type = "text",
      required = false,
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const hasError = Boolean(error);
    const inputType = showPasswordToggle && showPassword ? "text" : type;

    return (
      <div className={cn("space-y-1.5", className)}>
        <label
          htmlFor={id}
          className="block text-xs font-bold text-slate-300 uppercase tracking-wider ml-1"
        >
          {label}
          {required && <span className="text-rose-400 ml-1">*</span>}
        </label>

        <div className="relative group">
          {icon && (
            <div className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200",
              isFocused ? "text-indigo-400" : "text-slate-500",
              hasError && "text-rose-400",
              success && !hasError && "text-emerald-400"
            )}>
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            type={inputType}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              helperText || error
                ? `${id}-helper ${id}-error`
                : undefined
            }
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "flex h-12 w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 outline-none",
              "bg-slate-900/50 backdrop-blur-sm text-slate-100 placeholder:text-slate-500",
              "shadow-inner",
              icon && "pl-11",
              (showPasswordToggle || success) && "pr-11",
              hasError
                ? "border-rose-500/50 bg-rose-950/20 focus:border-rose-500 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.15)]"
                : success
                  ? "border-emerald-500/50 bg-emerald-950/20 focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                  : "border-white/10 hover:border-white/20 focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.15)] focus:bg-slate-900/80",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            {...props}
          />

          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-all"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          )}

          {success && !hasError && !showPasswordToggle && (
            <CheckCircle
              className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"
              size={20}
              aria-hidden="true"
            />
          )}
        </div>

        {helperText && !hasError && (
          <p id={`${id}-helper`} className="text-xs text-slate-400 ml-1">
            {helperText}
          </p>
        )}

        {hasError && (
          <div
            id={`${id}-error`}
            className="flex items-center gap-1.5 text-xs font-medium text-rose-400 ml-1 animate-slide-in-from-top-2"
            role="alert"
          >
            <AlertCircle size={14} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export { FormInput };
