"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function SettingsScrollHandler() {
  const searchParams = useSearchParams();
  const shouldScrollToUpgrade = searchParams.get("upgrade") === "true";

  useEffect(() => {
    if (shouldScrollToUpgrade) {
      // Small delay to ensure the page is fully rendered
      const timer = setTimeout(() => {
        const subscriptionSection = document.getElementById("subscription-section");
        if (subscriptionSection) {
          subscriptionSection.scrollIntoView({ behavior: "smooth", block: "start" });
          
          // Add a highlight effect
          subscriptionSection.classList.add("ring-4", "ring-indigo-500/20");
          setTimeout(() => {
            subscriptionSection.classList.remove("ring-4", "ring-indigo-500/20");
          }, 2000);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [shouldScrollToUpgrade]);

  return null;
}
