import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'error' | 'success';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  isLoading?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant = 'default', 
    resize = 'vertical',
    isLoading,
    rows = 4,
    ...props 
  }, ref) => {
    const baseStyles = "w-full rounded-xl border-2 bg-white px-4 py-3 text-base font-medium transition-all duration-200 placeholder:text-neutral-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-100";
    
    const variantStyles = {
      default: "border-neutral-200 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-neutral-700 dark:focus:border-primary",
      error: "border-error focus:border-error focus:ring-4 focus:ring-error/10",
      success: "border-success focus:border-success focus:ring-4 focus:ring-success/10"
    };

    const resizeStyles = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    };

    return (
      <div className="relative">
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            baseStyles,
            variantStyles[variant],
            resizeStyles[resize],
            isLoading && "pr-12",
            className
          )}
          {...props}
        />
        
        {isLoading && (
          <div className="absolute top-4 right-4">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";