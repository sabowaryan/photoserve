"use client";

import Image from "next/image";

interface WatermarkOverlayProps {
  /** Whether the watermark should be visible */
  visible: boolean;
  /** Position of the watermark */
  position?: "bottom-right" | "center" | "bottom-left";
  /** Opacity of the watermark (0-100) */
  opacity?: number;
}

/**
 * WatermarkOverlay Component
 * 
 * CSS-based overlay with PikSend logo for free guest galleries.
 * Requirements: 2.1, 2.2
 * - Positioned in bottom-right corner by default
 * - 30% opacity
 * - Displays PikSend logo
 */
export function WatermarkOverlay({
  visible,
  position = "bottom-right",
  opacity = 30,
}: WatermarkOverlayProps) {
  if (!visible) {
    return null;
  }

  const positionClasses = {
    "bottom-right": "bottom-3 right-3",
    "bottom-left": "bottom-3 left-3",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} z-10 pointer-events-none select-none`}
      style={{ opacity: opacity / 100 }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg">
        <Image
          src="/icons/logo.svg"
          alt=""
          width={24}
          height={24}
          className="w-6 h-6"
        />
        <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
          PikSend
        </span>
      </div>
    </div>
  );
}
