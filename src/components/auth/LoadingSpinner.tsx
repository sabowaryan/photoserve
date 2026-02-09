"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = "md", text, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center gap-3", className)}
        role="status"
        aria-live="polite"
      >
        <Loader2
          size={sizeMap[size]}
          className="animate-spin text-indigo-600"
          aria-hidden="true"
        />
        {text && (
          <p className="text-sm font-medium text-slate-600">
            {text}
            <span className="animate-pulse">...</span>
          </p>
        )}
        <span className="sr-only">Loading</span>
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

export { LoadingSpinner };
