import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error' | 'success';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant = 'default', 
    leftIcon, 
    rightIcon, 
    isLoading,
    type,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const baseStyles = "flex h-12 w-full rounded-xl border-2 bg-white px-4 py-3 text-base font-medium transition-all duration-200 placeholder:text-neutral-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-100";
    
    const variantStyles = {
      default: "border-neutral-200 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-neutral-700 dark:focus:border-primary",
      error: "border-error focus:border-error focus:ring-4 focus:ring-error/10",
      success: "border-success focus:border-success focus:ring-4 focus:ring-success/10"
    };

    const iconStyles = "absolute top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400";

    return (
      <div className="relative">
        {leftIcon && (
          <div className={cn(iconStyles, "left-4")}>
            {leftIcon}
          </div>
        )}
        
        <input
          type={inputType}
          className={cn(
            baseStyles,
            variantStyles[variant],
            leftIcon && "pl-12",
            (rightIcon || isPassword || isLoading) && "pr-12",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {isLoading && (
          <div className={cn(iconStyles, "right-4")}>
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        
        {isPassword && !isLoading && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={cn(iconStyles, "right-4 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors")}
            tabIndex={-1}
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
        
        {rightIcon && !isPassword && !isLoading && (
          <div className={cn(iconStyles, "right-4")}>
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";