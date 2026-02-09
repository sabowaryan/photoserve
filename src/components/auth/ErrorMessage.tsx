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
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300",
          "bg-rose-950/30 border border-rose-500/30 text-rose-200 backdrop-blur-md shadow-lg shadow-rose-900/10",
          className
        )}
      >
        <div className="bg-rose-900/50 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
          <AlertCircle
            className="text-rose-400"
            size={18}
            aria-hidden="true"
          />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {title && (
            <p className="text-sm font-bold text-rose-100 mb-1 tracking-wide">{title}</p>
          )}
          <p className="text-sm text-rose-200/90 leading-relaxed font-medium">{message}</p>
        </div>
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 p-1 text-rose-300 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors -mr-1"
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
