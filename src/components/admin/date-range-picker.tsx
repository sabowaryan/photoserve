"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onDateChange: (dateFrom: string, dateTo: string) => void;
  isLoading?: boolean;
}

/**
 * Preset date ranges for quick selection
 */
const presets = [
  { label: "7 derniers jours", days: 7 },
  { label: "30 derniers jours", days: 30 },
  { label: "90 derniers jours", days: 90 },
  { label: "Cette année", days: -1 }, // Special case for year-to-date
];

/**
 * Format date to YYYY-MM-DD for input fields
 */
function formatDateForInput(date: Date): string {
  const isoString = date.toISOString().split("T")[0];
  return isoString ?? "";
}

/**
 * Get date range for preset
 */
function getPresetDates(days: number): { from: string; to: string } {
  const to = new Date();
  let from: Date;

  if (days === -1) {
    // Year-to-date
    from = new Date(to.getFullYear(), 0, 1);
  } else {
    from = new Date();
    from.setDate(from.getDate() - days);
  }

  return {
    from: formatDateForInput(from),
    to: formatDateForInput(to),
  };
}

/**
 * Date Range Picker Component
 * 
 * Allows users to select a date range for filtering analytics data.
 * Includes preset options for common date ranges.
 * 
 * Requirements: 5.5
 */
export function DateRangePicker({
  dateFrom,
  dateTo,
  onDateChange,
  isLoading = false,
}: DateRangePickerProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [localFrom, setLocalFrom] = useState(dateFrom);
  const [localTo, setLocalTo] = useState(dateTo);

  // Sync local state with props
  useEffect(() => {
    setLocalFrom(dateFrom);
    setLocalTo(dateTo);
  }, [dateFrom, dateTo]);

  const handlePresetClick = (days: number) => {
    const { from, to } = getPresetDates(days);
    setLocalFrom(from);
    setLocalTo(to);
    onDateChange(from, to);
    setShowPresets(false);
  };

  const handleApply = () => {
    if (localFrom && localTo && localFrom <= localTo) {
      onDateChange(localFrom, localTo);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Date inputs */}
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Du</span>
          </div>
          <Input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-40"
            disabled={isLoading}
          />
          <span className="text-sm font-medium text-slate-600">au</span>
          <Input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-40"
            disabled={isLoading}
          />
          <Button
            onClick={handleApply}
            disabled={isLoading || !localFrom || !localTo || localFrom > localTo}
            size="sm"
          >
            Appliquer
          </Button>
        </div>

        {/* Presets dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            Périodes prédéfinies
            <ChevronDown className={`h-4 w-4 transition-transform ${showPresets ? "rotate-180" : ""}`} />
          </Button>

          {showPresets && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-10 min-w-[180px]">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset.days)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current selection display */}
      <div className="mt-3 text-xs text-slate-500">
        Période sélectionnée:{" "}
        <span className="font-medium text-slate-700">
          {new Date(dateFrom).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
        {" - "}
        <span className="font-medium text-slate-700">
          {new Date(dateTo).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
