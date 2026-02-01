import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

// Toggle variants using design tokens
const toggleVariants = cva(
  'relative inline-flex items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] min-w-[44px]',
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-12'
      },
      colorScheme: {
        blue: 'data-[state=checked]:bg-primary focus-visible:ring-primary/50',
        green: 'data-[state=checked]:bg-primary-green focus-visible:ring-primary-green/50',
        purple: 'data-[state=checked]:bg-primary-purple focus-visible:ring-primary-purple/50'
      }
    },
    defaultVariants: {
      size: 'md',
      colorScheme: 'blue'
    }
  }
);

const toggleThumbVariants = cva(
  'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform',
  {
    variants: {
      size: {
        sm: 'h-3 w-3 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5',
        md: 'h-4 w-4 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1',
        lg: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
);

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>,
    VariantProps<typeof toggleVariants> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ 
    className, 
    size, 
    colorScheme,
    checked = false,
    onCheckedChange,
    label,
    description,
    disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-labelledby': ariaLabelledBy,
    id,
    ...props 
  }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;
    const descriptionId = description ? `${toggleId}-description` : undefined;
    const labelId = label ? `${toggleId}-label` : undefined;

    // Generate accessible label
    const accessibleLabel = ariaLabel || label || 'Toggle';

    return (
      <div className="flex items-center justify-between gap-4 min-h-[44px]">
        {(label || description) && (
          <div className="flex flex-col flex-1">
            {label && (
              <label 
                id={labelId}
                htmlFor={toggleId}
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p 
                id={descriptionId}
                className="text-xs text-muted"
              >
                {description}
              </p>
            )}
          </div>
        )}
        <button
          ref={ref}
          id={toggleId}
          role="switch"
          type="button"
          aria-checked={checked}
          aria-label={accessibleLabel}
          aria-describedby={cn(
            ariaDescribedBy,
            descriptionId
          ).trim() || undefined}
          aria-labelledby={cn(
            ariaLabelledBy,
            labelId
          ).trim() || undefined}
          data-state={checked ? 'checked' : 'unchecked'}
          className={cn(
            toggleVariants({ size, colorScheme }),
            checked 
              ? '' 
              : 'bg-neutral-300 dark:bg-neutral-600',
            className
          )}
          onClick={handleClick}
          disabled={disabled}
          {...props}
        >
          <span
            data-state={checked ? 'checked' : 'unchecked'}
            className={cn(toggleThumbVariants({ size }))}
            aria-hidden="true"
          />
          <span className="sr-only">
            {checked ? 'Enabled' : 'Disabled'}
          </span>
        </button>
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export { Toggle, toggleVariants };