"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface DateRangeSelectorProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  onDateRangeChange: (from: Date, to: Date) => void;
  loading?: boolean;
}

/**
 * Date Range Selector Component
 * 
 * Provides preset date ranges and custom date picker:
 * - Last 7 days
 * - Last 30 days
 * - Last 90 days
 * - Custom range
 * 
 * Requirements: 8.4
 */
export function DateRangeSelector({
  dateRange,
  onDateRangeChange,
  loading,
}: DateRangeSelectorProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(dateRange.from);
  const [customTo, setCustomTo] = useState<Date | undefined>(dateRange.to);

  const presets = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
  ];

  /**
   * Handle preset selection
   */
  const handlePresetClick = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onDateRangeChange(from, to);
  };

  /**
   * Handle custom range apply
   */
  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onDateRangeChange(customFrom, customTo);
      setCustomOpen(false);
    }
  };

  /**
   * Check if a preset is active
   */
  const isPresetActive = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    
    // Check if dates match (within same day)
    return (
      dateRange.from.toDateString() === from.toDateString() &&
      dateRange.to.toDateString() === to.toDateString()
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      {presets.map((preset) => (
        <Button
          key={preset.days}
          variant={isPresetActive(preset.days) ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(preset.days)}
          disabled={loading}
        >
          {preset.label}
        </Button>
      ))}

      {/* Custom date range picker */}
      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Custom Range
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                From Date
              </label>
              <Calendar
                mode="single"
                selected={customFrom}
                onSelect={setCustomFrom}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                To Date
              </label>
              <Calendar
                mode="single"
                selected={customTo}
                onSelect={setCustomTo}
                disabled={(date) => 
                  date > new Date() || (customFrom ? date < customFrom : false)
                }
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-xs text-slate-600">
                {customFrom && customTo && (
                  <>
                    {format(customFrom, "MMM d, yyyy")} -{" "}
                    {format(customTo, "MMM d, yyyy")}
                  </>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleCustomApply}
                disabled={!customFrom || !customTo}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Current range display */}
      <div className="ml-auto text-sm text-slate-600">
        {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
      </div>
    </div>
  );
}
