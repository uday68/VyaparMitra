import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  variant?: 'default' | 'error' | 'success';
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  leftIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    variant = 'default', 
    options,
    placeholder = 'Select an option',
    onChange,
    leftIcon, 
    isLoading,
    value,
    disabled,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const selectRef = useRef<HTMLDivElement>(null);

    const baseStyles = "flex h-12 w-full rounded-xl border-2 bg-white px-4 py-3 text-base font-medium transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-100";
    
    const variantStyles = {
      default: "border-neutral-200 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-neutral-700 dark:focus:border-primary",
      error: "border-error focus:border-error focus:ring-4 focus:ring-error/10",
      success: "border-success focus:border-success focus:ring-4 focus:ring-success/10"
    };

    const iconStyles = "absolute top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400";

    const selectedOption = options.find(option => option.value === selectedValue);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue);
      onChange(optionValue);
      setIsOpen(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          setIsOpen(!isOpen);
          break;
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            const currentIndex = options.findIndex(opt => opt.value === selectedValue);
            const nextIndex = Math.min(currentIndex + 1, options.length - 1);
            if (options[nextIndex] && !options[nextIndex].disabled) {
              handleSelect(options[nextIndex].value);
            }
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            const currentIndex = options.findIndex(opt => opt.value === selectedValue);
            const prevIndex = Math.max(currentIndex - 1, 0);
            if (options[prevIndex] && !options[prevIndex].disabled) {
              handleSelect(options[prevIndex].value);
            }
          }
          break;
      }
    };

    return (
      <div className="relative" ref={selectRef}>
        {/* Hidden native select for form submission */}
        <select
          ref={ref}
          value={selectedValue}
          onChange={() => {}} // Controlled by custom dropdown
          className="sr-only"
          disabled={disabled}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom select button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            baseStyles,
            variantStyles[variant],
            leftIcon && "pl-12",
            "pr-12 cursor-pointer text-left justify-between items-center",
            !selectedValue && "text-neutral-500 dark:text-neutral-400",
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby="select-label"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {leftIcon && (
              <span className="text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                {leftIcon}
              </span>
            )}
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-primary rounded-full animate-spin flex-shrink-0" />
          ) : (
            <span className={cn(
              "material-symbols-outlined text-xl transition-transform duration-200 flex-shrink-0",
              isOpen && "rotate-180"
            )}>
              expand_more
            </span>
          )}
        </button>

        {/* Dropdown options */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-auto">
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && handleSelect(option.value)}
                disabled={option.disabled}
                className={cn(
                  "w-full px-4 py-3 text-left text-base font-medium transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl",
                  option.value === selectedValue
                    ? "bg-primary/10 text-primary"
                    : "text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800",
                  option.disabled && "opacity-50 cursor-not-allowed"
                )}
                role="option"
                aria-selected={option.value === selectedValue}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{option.label}</span>
                  {option.value === selectedValue && (
                    <span className="material-symbols-outlined text-primary text-xl ml-2">
                      check
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";