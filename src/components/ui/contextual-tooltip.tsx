"use client";

import { useState, useEffect, useRef } from "react";
import { X, Sparkles } from "lucide-react";

interface ContextualTooltipProps {
  id: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  targetSelector?: string;
  onDismiss?: () => void;
  showOnce?: boolean;
  userId?: string;
}

/**
 * Contextual Tooltip Component
 * 
 * Displays helpful tooltips for first-time users to guide them through the interface.
 * Tooltips can be dismissed and won't show again if showOnce is true.
 * 
 * Requirements: 13.2 - Display contextual tooltips on first visit
 */
export function ContextualTooltip({
  id,
  title,
  description,
  position = "bottom",
  targetSelector,
  onDismiss,
  showOnce = true,
  userId,
}: ContextualTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if tooltip has been dismissed before
    if (showOnce && userId) {
      const dismissedKey = `tooltip_dismissed_${userId}_${id}`;
      const isDismissed = localStorage.getItem(dismissedKey) === "true";
      if (isDismissed) {
        return;
      }
    }

    // Find target element and position tooltip
    if (targetSelector) {
      const targetElement = document.querySelector(targetSelector);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        let top = 0;
        let left = 0;

        switch (position) {
          case "top":
            top = rect.top + scrollTop - 10;
            left = rect.left + scrollLeft + rect.width / 2;
            break;
          case "bottom":
            top = rect.bottom + scrollTop + 10;
            left = rect.left + scrollLeft + rect.width / 2;
            break;
          case "left":
            top = rect.top + scrollTop + rect.height / 2;
            left = rect.left + scrollLeft - 10;
            break;
          case "right":
            top = rect.top + scrollTop + rect.height / 2;
            left = rect.right + scrollLeft + 10;
            break;
        }

        setCoords({ top, left });
        setIsVisible(true);
      }
    } else {
      setIsVisible(true);
    }
  }, [targetSelector, position, showOnce, userId, id]);

  const handleDismiss = () => {
    setIsVisible(false);
    
    // Store dismissal in localStorage
    if (showOnce && userId) {
      const dismissedKey = `tooltip_dismissed_${userId}_${id}`;
      localStorage.setItem(dismissedKey, "true");
    }

    onDismiss?.();
  };

  if (!isVisible) return null;

  const positionClasses = {
    top: "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2",
    left: "-translate-y-1/2 -translate-x-full",
    right: "-translate-y-1/2",
  };

  const arrowClasses = {
    top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-indigo-600",
    bottom: "top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-indigo-600",
    left: "right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-indigo-600",
    right: "left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-indigo-600",
  };

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-[9999] ${positionClasses[position]} animate-in fade-in slide-in-from-bottom-2 duration-300`}
      style={targetSelector ? { top: coords.top, left: coords.left } : undefined}
    >
      <div className="relative bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl shadow-2xl max-w-xs">
        {/* Arrow */}
        <div
          className={`absolute w-0 h-0 border-8 border-transparent ${arrowClasses[position]}`}
        />

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-300 flex-shrink-0" />
              <h4 className="text-sm font-bold">{title}</h4>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-white/90 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
