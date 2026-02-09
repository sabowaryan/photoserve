"use client";

import * as React from "react";
import { CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SuccessMessageProps {
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const SuccessMessage = React.forwardRef<HTMLDivElement, SuccessMessageProps>(
  ({ title, message, dismissible = false, onDismiss, className }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300",
          "bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 backdrop-blur-md shadow-lg shadow-emerald-900/10",
          className
        )}
      >
        <div className="bg-emerald-900/50 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
          <CheckCircle
            className="text-emerald-400"
            size={18}
            aria-hidden="true"
          />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {title && (
            <p className="text-sm font-bold text-emerald-100 mb-1 tracking-wide">{title}</p>
          )}
          <p className="text-sm text-emerald-200/90 leading-relaxed font-medium">{message}</p>
        </div>
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 p-1 text-emerald-300 hover:text-white hover:bg-emerald-500/20 rounded-lg transition-colors -mr-1"
            aria-label="Dismiss success message"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

SuccessMessage.displayName = "SuccessMessage";

export { SuccessMessage };
