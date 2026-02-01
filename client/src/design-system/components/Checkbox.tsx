import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  variant?: 'default' | 'error' | 'success';
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ 
    className, 
    label,
    description,
    variant = 'default', 
    indeterminate = false,
    checked,
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = "w-5 h-5 rounded-md border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-0";
    
    const variantStyles = {
      default: cn(
        "border-neutral-300 dark:border-neutral-600",
        checked || indeterminate 
          ? "bg-primary border-primary text-white" 
          : "bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-500",
        "focus:ring-primary/20"
      ),
      error: cn(
        "border-error",
        checked || indeterminate 
          ? "bg-error border-error text-white" 
          : "bg-white dark:bg-neutral-900 hover:border-error/70",
        "focus:ring-error/20"
      ),
      success: cn(
        "border-success",
        checked || indeterminate 
          ? "bg-success border-success text-white" 
          : "bg-white dark:bg-neutral-900 hover:border-success/70",
        "focus:ring-success/20"
      )
    };

    const getIcon = () => {
      if (indeterminate) {
        return (
          <span className="material-symbols-outlined text-sm leading-none">
            remove
          </span>
        );
      }
      if (checked) {
        return (
          <span className="material-symbols-outlined text-sm leading-none">
            check
          </span>
        );
      }
      return null;
    };

    const content = (
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            ref={ref}
            checked={checked}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div
            className={cn(
              baseStyles,
              variantStyles[variant],
              disabled && "opacity-50 cursor-not-allowed",
              "flex items-center justify-center cursor-pointer"
            )}
            role="checkbox"
            aria-checked={indeterminate ? 'mixed' : checked}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (!disabled && props.onChange) {
                  const syntheticEvent = {
                    target: { checked: !checked },
                    currentTarget: { checked: !checked }
                  } as React.ChangeEvent<HTMLInputElement>;
                  props.onChange(syntheticEvent);
                }
              }
            }}
            onClick={() => {
              if (!disabled && props.onChange) {
                const syntheticEvent = {
                  target: { checked: !checked },
                  currentTarget: { checked: !checked }
                } as React.ChangeEvent<HTMLInputElement>;
                props.onChange(syntheticEvent);
              }
            }}
          >
            {getIcon()}
          </div>
        </div>
        
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label className={cn(
                "block text-base font-medium cursor-pointer",
                disabled 
                  ? "text-neutral-400 dark:text-neutral-500" 
                  : "text-neutral-900 dark:text-neutral-100"
              )}>
                {label}
              </label>
            )}
            {description && (
              <p className={cn(
                "text-sm mt-1",
                disabled 
                  ? "text-neutral-400 dark:text-neutral-500" 
                  : "text-neutral-600 dark:text-neutral-400"
              )}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );

    return (
      <div className={cn("relative", className)}>
        {content}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";