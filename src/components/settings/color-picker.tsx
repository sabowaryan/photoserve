'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
}

const DEFAULT_PRESETS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#6366f1', // Indigo
];

export function ColorPicker({ label, value, onChange, presets = DEFAULT_PRESETS }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHexInput(newValue);
    
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handlePresetClick = (color: string) => {
    setHexInput(color);
    onChange(color);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      
      {/* Hex Input */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg border-2 border-slate-200 shadow-sm flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <Input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          placeholder="#000000"
          className="font-mono text-sm"
          maxLength={7}
        />
      </div>

      {/* Preset Colors */}
      <div className="grid grid-cols-8 gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={cn(
              'w-10 h-10 rounded-lg border-2 transition-all hover:scale-110',
              value === preset
                ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2'
                : 'border-slate-200 hover:border-slate-300'
            )}
            style={{ backgroundColor: preset }}
            title={preset}
          >
            {value === preset && (
              <Check className="w-5 h-5 text-white drop-shadow-md mx-auto" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
