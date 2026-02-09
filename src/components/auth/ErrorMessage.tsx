"use client";

import * as React from "react";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorMessageProps {
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const ErrorMessage = React.forwardRef<HTMLDivElement, ErrorMessageProps>(
  ({ title, message, dismissible = false, onDismiss, className }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300",
          "bg-red-50 border border-red-200 text-red-800 shadow-lg",
          className
        )}
      >
        <div className="bg-red-100 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
          <AlertCircle
            className="text-red-600"
            size={18}
            aria-hidden="true"
          />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {title && (
            <p className="text-sm font-bold text-red-900 mb-1 tracking-wide">{title}</p>
          )}
          <p className="text-sm text-red-800 leading-relaxed font-medium">{message}</p>
        </div>
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors -mr-1"
            aria-label="Dismiss error message"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

ErrorMessage.displayName = "ErrorMessage";

export { ErrorMessage };
