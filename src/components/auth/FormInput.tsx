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
    const [shouldShake, setShouldShake] = React.useState(false);

    const hasError = Boolean(error);
    const inputType = showPasswordToggle && showPassword ? "text" : type;

    // Trigger shake animation when error appears
    React.useEffect(() => {
      if (hasError) {
        setShouldShake(true);
        const timer = setTimeout(() => setShouldShake(false), 400);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [hasError]);

    return (
      <div className={cn("space-y-1.5", className)}>
        <label
          htmlFor={id}
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1"
        >
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>

        <div className="relative group">
          {icon && (
            <div className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200",
              isFocused ? "text-primary" : "text-slate-400",
              hasError && "text-red-600",
              success && !hasError && "text-green-600"
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
              "flex h-12 w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 outline-none",
              "bg-white text-slate-900 placeholder:text-slate-400",
              icon && "pl-11",
              (showPasswordToggle || success) && "pr-11",
              hasError
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : success
                  ? "border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  : "border-slate-300 hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              shouldShake && "animate-shake"
            )}
            {...props}
          />

          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600"
              size={20}
              aria-hidden="true"
            />
          )}
        </div>

        {helperText && !hasError && (
          <p id={`${id}-helper`} className="text-xs text-slate-500 ml-1">
            {helperText}
          </p>
        )}

        {hasError && (
          <div
            id={`${id}-error`}
            className="flex items-center gap-1.5 text-xs font-medium text-red-600 ml-1 animate-in fade-in slide-in-from-top-2 duration-300"
            role="alert"
            aria-live="assertive"
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
