"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const authButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 relative overflow-hidden group hover:scale-[1.02]",
  {
    variants: {
      variant: {
        primary:
          "bg-piksend-gradient text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 border border-transparent hover:opacity-90",
        secondary:
          "bg-white/5 backdrop-blur-sm text-primary border border-primary/10 hover:bg-white/10 hover:border-primary/20 hover:text-primary shadow-sm",
        oauth:
          "bg-white/90 backdrop-blur-sm text-slate-700 border border-slate-200 shadow-sm hover:bg-white hover:border-primary/20 hover:shadow-md hover:text-primary transition-colors",
        ghost:
          "bg-transparent text-primary hover:text-primary/80 hover:bg-primary/5",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-12 px-6 text-sm",
        lg: "h-14 px-8 text-base",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface AuthButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof authButtonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
}

const AuthButton = React.forwardRef<HTMLButtonElement, AuthButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(authButtonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {/* Shine effect for primary button */}
        {variant === 'primary' && (
          <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
        )}

        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin text-current" aria-hidden="true" />
            <span className="opacity-90">{children}</span>
          </>
        ) : (
          <>
            {icon && <span aria-hidden="true" className="transition-transform group-hover:scale-110">{icon}</span>}
            <span>{children}</span>
          </>
        )}
      </button>
    );
  }
);

AuthButton.displayName = "AuthButton";

export { AuthButton, authButtonVariants };
