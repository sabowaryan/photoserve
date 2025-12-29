import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export date utilities for convenience
export {
  formatDateFr,
  formatDateShortFr,
  formatDateTimeFr,
  formatDistanceFr,
  formatCurrencyFr,
  formatNumberFr,
  isDatePast,
  addDaysToDate,
  DATE_FORMAT_FULL,
  DATE_FORMAT_SHORT,
  DATE_FORMAT_WITH_TIME,
  frLocale,
} from "./date";
