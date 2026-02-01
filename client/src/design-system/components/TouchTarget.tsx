/**
 * Touch Target Component
 * 
 * Ensures all interactive elements meet WCAG 2.1 AA accessibility requirements
 * for touch target sizes (minimum 44px on mobile devices).
 */

import React from 'react';
import { cn } from '../utils/cn';
import { validateTouchTarget, touchTargets } from '../utils/responsive';

interface TouchTargetProps {
  children: React.ReactNode;
  size?: 'minimum' | 'comfortable' | 'large';
  className?: string;
  asChild?: boolean;
}

/**
 * TouchTarget component that ensures minimum touch target sizes
 */
export function TouchTarget({ 
  children, 
  size = 'minimum', 
  className,
  asChild = false 
}: TouchTargetProps) {
  const targetSize = touchTargets[size];
  
  // Generate touch target classes
  const touchTargetClasses = cn(
    // Base touch target styles
    'inline-flex items-center justify-center',
    'relative',
    
    // Size-specific classes
    size === 'minimum' && 'touch-target-minimum',
    size === 'comfortable' && 'touch-target-comfortable', 
    size === 'large' && 'touch-target-large',
    
    // Responsive touch targets (larger on mobile)
    'min-w-[44px] min-h-[44px]', // Mobile minimum
    'md:min-w-[40px] md:min-h-[40px]', // Desktop can be smaller
    
    // Accessibility enhancements
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-primary',
    'focus-visible:ring-offset-2',
    
    className
  );
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(touchTargetClasses, children.props.className)
    });
  }
  
  return (
    <div className={touchTargetClasses}>
      {children}
    </div>
  );
}

interface InteractiveElementProps {
  children: React.ReactNode;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  disabled?: boolean;
  size?: 'minimum' | 'comfortable' | 'large';
  className?: string;
  'aria-label'?: string;
  role?: string;
}

/**
 * Interactive element wrapper that ensures accessibility compliance
 */
export function InteractiveElement({
  children,
  onClick,
  onKeyDown,
  disabled = false,
  size = 'minimum',
  className,
  'aria-label': ariaLabel,
  role = 'button'
}: InteractiveElementProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Handle Enter and Space key activation
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (onClick && !disabled) {
        onClick();
      }
    }
    
    if (onKeyDown) {
      onKeyDown(event);
    }
  };
  
  return (
    <TouchTarget size={size} className={className}>
      <div
        role={role}
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? undefined : onClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        className={cn(
          'w-full h-full flex items-center justify-center',
          'cursor-pointer',
          'transition-all duration-200',
          disabled && 'cursor-not-allowed opacity-50',
          // Ensure content doesn't interfere with touch target
          'select-none'
        )}
      >
        {children}
      </div>
    </TouchTarget>
  );
}

interface TouchTargetButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'minimum' | 'comfortable' | 'large';
  className?: string;
  'aria-label'?: string;
}

/**
 * Button component with guaranteed touch target compliance
 */
export function TouchTargetButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'comfortable',
  className,
  'aria-label': ariaLabel
}: TouchTargetButtonProps) {
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100'
  };
  
  return (
    <InteractiveElement
      onClick={onClick}
      disabled={disabled}
      size={size}
      aria-label={ariaLabel}
      className={cn(
        // Base button styles
        'rounded-lg font-medium transition-colors',
        'border-0 outline-none',
        
        // Variant styles
        variantClasses[variant],
        
        // Padding for content (touch target handles minimum size)
        'px-4 py-2',
        
        className
      )}
    >
      {children}
    </InteractiveElement>
  );
}

interface TouchTargetIconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'minimum' | 'comfortable' | 'large';
  className?: string;
  'aria-label': string; // Required for icon buttons
}

/**
 * Icon button with guaranteed touch target compliance
 */
export function TouchTargetIconButton({
  icon,
  onClick,
  disabled = false,
  size = 'comfortable',
  className,
  'aria-label': ariaLabel
}: TouchTargetIconButtonProps) {
  return (
    <InteractiveElement
      onClick={onClick}
      disabled={disabled}
      size={size}
      aria-label={ariaLabel}
      className={cn(
        // Base icon button styles
        'rounded-full',
        'bg-transparent hover:bg-neutral-100',
        'text-neutral-700',
        'transition-colors',
        
        className
      )}
    >
      <div className="w-6 h-6 flex items-center justify-center">
        {icon}
      </div>
    </InteractiveElement>
  );
}

/**
 * Hook to validate touch target sizes in development
 */
export function useTouchTargetValidation(
  ref: React.RefObject<HTMLElement>,
  expectedSize: 'minimum' | 'comfortable' | 'large' = 'minimum'
) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && ref.current) {
      const element = ref.current;
      const rect = element.getBoundingClientRect();
      
      const isValid = validateTouchTarget(rect.width, rect.height, expectedSize);
      
      if (!isValid) {
        console.warn(
          `Touch target validation failed for element:`,
          element,
          `Expected minimum ${touchTargets[expectedSize]}px, got ${rect.width}x${rect.height}px`
        );
      }
    }
  }, [ref, expectedSize]);
}

/**
 * Higher-order component that adds touch target compliance
 */
export function withTouchTarget<P extends object>(
  Component: React.ComponentType<P>,
  size: 'minimum' | 'comfortable' | 'large' = 'minimum'
) {
  return React.forwardRef<HTMLElement, P & { className?: string }>((props, ref) => {
    return (
      <TouchTarget size={size} className={props.className}>
        <Component {...props} ref={ref} />
      </TouchTarget>
    );
  });
}

/**
 * Utility component for debugging touch targets in development
 */
export function TouchTargetDebugger({ 
  children, 
  showOverlay = false 
}: { 
  children: React.ReactNode; 
  showOverlay?: boolean; 
}) {
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>;
  }
  
  return (
    <div className="relative">
      {children}
      {showOverlay && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full border-2 border-red-500 border-dashed opacity-50" />
          <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-1">
            Touch Target
          </div>
        </div>
      )}
    </div>
  );
}