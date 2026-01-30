import React from 'react';
import { cn } from '@/lib/utils';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  className?: string;
  disabled?: boolean;
}

export function RadioGroup({ 
  name, 
  value, 
  onChange, 
  options, 
  className,
  disabled = false 
}: RadioGroupProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
            value === option.value
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="sr-only"
          />
          
          {/* Custom radio button */}
          <div className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full border-2 mr-3 mt-0.5 transition-all duration-200",
            value === option.value
              ? "border-primary bg-primary"
              : "border-neutral-300 dark:border-neutral-600"
          )}>
            {value === option.value && (
              <div className="w-full h-full rounded-full bg-white scale-50" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {option.icon && (
                <span className="text-neutral-600 dark:text-neutral-400">
                  {option.icon}
                </span>
              )}
              <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {option.label}
              </span>
            </div>
            {option.description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {option.description}
              </p>
            )}
          </div>
          
          {/* Selection indicator */}
          {value === option.value && (
            <div className="flex-shrink-0 ml-2">
              <span className="material-symbols-outlined text-primary text-xl">
                check_circle
              </span>
            </div>
          )}
        </label>
      ))}
    </div>
  );
}