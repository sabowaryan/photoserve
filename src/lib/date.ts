/**
 * Date formatting utilities with French locale
 * 
 * Requirements: 12.2 - Format dates using French locale (dd MMMM yyyy)
 * Requirements: 12.3 - Use French currency formatting where applicable
 */
import { format, formatDistanceToNow, isPast, addDays, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Default date format for French locale: dd MMMM yyyy
 * Example: 25 décembre 2025
 */
export const DATE_FORMAT_FULL = "dd MMMM yyyy";

/**
 * Short date format: dd/MM/yyyy
 * Example: 25/12/2025
 */
export const DATE_FORMAT_SHORT = "dd/MM/yyyy";

/**
 * Date with time format: dd MMMM yyyy à HH:mm
 * Example: 25 décembre 2025 à 14:30
 */
export const DATE_FORMAT_WITH_TIME = "dd MMMM yyyy 'à' HH:mm";

/**
 * Format a date using French locale with the full format (dd MMMM yyyy)
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string in French
 */
export function formatDateFr(date: string | Date | number): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  
  if (!isValid(dateObj)) {
    return "Date invalide";
  }
  
  return format(dateObj, DATE_FORMAT_FULL, { locale: fr });
}

/**
 * Format a date using French locale with short format (dd/MM/yyyy)
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string in French short format
 */
export function formatDateShortFr(date: string | Date | number): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  
  if (!isValid(dateObj)) {
    return "Date invalide";
  }
  
  return format(dateObj, DATE_FORMAT_SHORT, { locale: fr });
}

/**
 * Format a date with time using French locale
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string with time in French
 */
export function formatDateTimeFr(date: string | Date | number): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  
  if (!isValid(dateObj)) {
    return "Date invalide";
  }
  
  return format(dateObj, DATE_FORMAT_WITH_TIME, { locale: fr });
}

/**
 * Format a relative time distance in French (e.g., "dans 3 jours", "il y a 2 heures")
 * @param date - Date string, Date object, or timestamp
 * @param options - Options for formatting
 * @returns Relative time string in French
 */
export function formatDistanceFr(
  date: string | Date | number,
  options: { addSuffix?: boolean } = { addSuffix: true }
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  
  if (!isValid(dateObj)) {
    return "Date invalide";
  }
  
  return formatDistanceToNow(dateObj, { ...options, locale: fr });
}

/**
 * Check if a date is in the past
 * @param date - Date string, Date object, or timestamp
 * @returns true if the date is in the past
 */
export function isDatePast(date: string | Date | number): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return isPast(dateObj);
}

/**
 * Add days to a date
 * @param date - Date string, Date object, or timestamp
 * @param days - Number of days to add
 * @returns New Date object
 */
export function addDaysToDate(date: string | Date | number, days: number): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return addDays(dateObj, days);
}

/**
 * Format currency in French format (€ with comma decimal separator)
 * @param amount - Amount to format
 * @param currency - Currency code (default: EUR)
 * @returns Formatted currency string
 */
export function formatCurrencyFr(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format a number in French format (with space as thousand separator and comma as decimal)
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumberFr(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// Re-export date-fns functions with French locale pre-configured
export { format, formatDistanceToNow, isPast, addDays, isValid, parseISO };
export { fr as frLocale };
