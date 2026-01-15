"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface WatermarkOverlayProps {
  /** Whether the watermark should be visible */
  visible: boolean;
  /** Position of the watermark */
  position?: "bottom-right" | "center" | "bottom-left" | "bottom-center";
  /** Opacity of the watermark (0-100) */
  opacity?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * WatermarkOverlay Component
 * 
 * Professional, elegant watermark overlay with PikSend logo for free guest galleries.
 * Requirements: 2.1, 2.2
 * - Responsive design (adapts to mobile/desktop)
 * - Multiple position options
 * - Configurable size and opacity
 * - Elegant glassmorphism design
 */
export function WatermarkOverlay({
  visible,
  position = "bottom-right",
  opacity = 30,
  size = "md",
}: WatermarkOverlayProps) {
  if (!visible) {
    return null;
  }

  const positionClasses = {
    "bottom-right": "bottom-3 right-3 md:bottom-4 md:right-4",
    "bottom-left": "bottom-3 left-3 md:bottom-4 md:left-4",
    "bottom-center": "bottom-3 left-1/2 -translate-x-1/2 md:bottom-4",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  const sizeClasses = {
    sm: {
      container: "px-2 py-1.5 md:px-2.5 md:py-2 rounded-lg md:rounded-xl gap-1.5 md:gap-2",
      logo: "w-4 h-4 md:w-5 md:h-5",
      text: "text-[9px] md:text-[10px]",
    },
    md: {
      container: "px-2.5 py-2 md:px-3 md:py-2.5 rounded-lg md:rounded-xl gap-1.5 md:gap-2",
      logo: "w-5 h-5 md:w-6 md:h-6",
      text: "text-[10px] md:text-xs",
    },
    lg: {
      container: "px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl gap-2 md:gap-2.5",
      logo: "w-6 h-6 md:w-7 md:h-7",
      text: "text-xs md:text-sm",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={cn(
        "absolute z-[5] pointer-events-none select-none transition-opacity duration-300",
        positionClasses[position]
      )}
      style={{ opacity: opacity / 100 }}
      aria-hidden="true"
    >
      <div 
        className={cn(
          "flex items-center backdrop-blur-md shadow-2xl",
          "bg-gradient-to-br from-slate-900/95 to-slate-800/95",
          "border border-white/10",
          "hover:from-slate-900 hover:to-slate-800 transition-all duration-300",
          currentSize.container
        )}
      >
        <div className="relative flex-shrink-0">
          <Image
            src="/icons/logo.svg"
            alt=""
            width={28}
            height={28}
            className={cn(currentSize.logo, "drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]")}
          />
        </div>
        <span 
          className={cn(
            "font-black text-white tracking-wider uppercase",
            "drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]",
            currentSize.text
          )}
          dir="ltr"
        >
          PikSend
        </span>
      </div>
    </div>
  );
}

