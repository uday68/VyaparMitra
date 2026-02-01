import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

// Button variants using design tokens and design reference patterns
const buttonVariants = cva(
  // Base styles - consistent across all variants
  'inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] min-h-[44px]',
  {
    variants: {
      variant: {
        // Primary button - solid background (from design references)
        primary: 'bg-primary text-white hover:opacity-90 focus-visible:ring-primary/50 shadow-lg hover:shadow-xl',
        
        // Secondary button - outline style (from design references)
        secondary: 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white focus-visible:ring-primary/50',
        
        // Ghost button - transparent background (from design references)
        ghost: 'text-primary bg-transparent hover:bg-primary/10 focus-visible:ring-primary/50',
        
        // Voice button - special styling for voice interactions (purple theme)
        voice: 'bg-primary-purple text-white hover:opacity-90 focus-visible:ring-primary-purple/50 shadow-lg shadow-primary-purple/20 hover:shadow-xl hover:shadow-primary-purple/30',
        
        // Destructive button - for dangerous actions
        destructive: 'bg-semantic-error text-white hover:opacity-90 focus-visible:ring-semantic-error/50 shadow-lg hover:shadow-xl',
        
        // Success button - for positive actions
        success: 'bg-primary-green text-white hover:opacity-90 focus-visible:ring-primary-green/50 shadow-lg hover:shadow-xl'
      },
      size: {
        sm: 'h-9 px-3 text-sm min-h-[36px]',
        md: 'h-11 px-4 text-base min-h-[44px]',
        lg: 'h-14 px-6 text-lg min-h-[48px]',
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px]'
      },
      colorScheme: {
        blue: '',
        green: '',
        purple: ''
      }
    },
    compoundVariants: [
      // Color scheme variants for primary buttons
      {
        variant: 'primary',
        colorScheme: 'green',
        class: 'bg-primary-green focus-visible:ring-primary-green/50'
      },
      {
        variant: 'primary',
        colorScheme: 'purple',
        class: 'bg-primary-purple focus-visible:ring-primary-purple/50'
      },
      // Color scheme variants for secondary buttons
      {
        variant: 'secondary',
        colorScheme: 'green',
        class: 'border-primary-green text-primary-green hover:bg-primary-green focus-visible:ring-primary-green/50'
      },
      {
        variant: 'secondary',
        colorScheme: 'purple',
        class: 'border-primary-purple text-primary-purple hover:bg-primary-purple focus-visible:ring-primary-purple/50'
      },
      // Color scheme variants for ghost buttons
      {
        variant: 'ghost',
        colorScheme: 'green',
        class: 'text-primary-green hover:bg-primary-green/10 focus-visible:ring-primary-green/50'
      },
      {
        variant: 'ghost',
        colorScheme: 'purple',
        class: 'text-primary-purple hover:bg-primary-purple/10 focus-visible:ring-primary-purple/50'
      }
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      colorScheme: 'blue'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    colorScheme,
    asChild = false, 
    leftIcon,
    rightIcon,
    isLoading = false,
    loadingText,
    children,
    disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props 
  }, ref) => {
    const isDisabled = disabled || isLoading;

    // Generate accessible label if not provided
    const accessibleLabel = ariaLabel || (typeof children === 'string' ? children : undefined);

    return (
      <button
        className={cn(buttonVariants({ variant, size, colorScheme, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-label={accessibleLabel}
        aria-describedby={ariaDescribedBy}
        aria-busy={isLoading}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        {...props}
      >
        {isLoading && (
          <div 
            className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {!isLoading && leftIcon && (
          <span aria-hidden="true">{leftIcon}</span>
        )}
        <span className={isLoading && !loadingText ? 'sr-only' : ''}>
          {isLoading ? loadingText || 'Loading...' : children}
        </span>
        {!isLoading && rightIcon && (
          <span aria-hidden="true">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };