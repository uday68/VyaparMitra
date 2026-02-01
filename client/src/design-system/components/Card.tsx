import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

// Card variants using design tokens and design reference patterns
const cardVariants = cva(
  // Base styles - consistent across all variants
  'rounded-xl transition-all duration-200',
  {
    variants: {
      variant: {
        // Default card - standard styling from design references
        default: 'bg-white dark:bg-card-background border border-card-border',
        
        // Elevated card - with shadow (product cards from design references)
        elevated: 'bg-white dark:bg-card-background border border-card-border shadow-lg hover:shadow-xl',
        
        // Outlined card - prominent border (language selection from design references)
        outlined: 'bg-white dark:bg-card-background border-2 border-card-border hover:border-primary/50',
        
        // Glass card - semi-transparent (voice panels from design references)
        glass: 'bg-white/80 dark:bg-card-background/80 backdrop-blur-sm border border-card-border/50',
        
        // Interactive card - for clickable cards
        interactive: 'bg-white dark:bg-card-background border border-card-border hover:border-primary/50 hover:shadow-md cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2'
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8'
      },
      shadow: {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl'
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      shadow: 'none'
    }
  }
);

const cardHeaderVariants = cva(
  'flex flex-col space-y-1.5',
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-3 pb-0',
        md: 'p-4 pb-0',
        lg: 'p-6 pb-0',
        xl: 'p-8 pb-0'
      }
    },
    defaultVariants: {
      padding: 'md'
    }
  }
);

const cardContentVariants = cva(
  '',
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-3 pt-0',
        md: 'p-4 pt-0',
        lg: 'p-6 pt-0',
        xl: 'p-8 pt-0'
      }
    },
    defaultVariants: {
      padding: 'md'
    }
  }
);

const cardFooterVariants = cva(
  'flex items-center',
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-3 pt-0',
        md: 'p-4 pt-0',
        lg: 'p-6 pt-0',
        xl: 'p-8 pt-0'
      }
    },
    defaultVariants: {
      padding: 'md'
    }
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    padding, 
    shadow, 
    onClick,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...props 
  }, ref) => {
    const isInteractive = variant === 'interactive' || onClick;
    
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, shadow, className }))}
        role={isInteractive ? 'button' : 'region'}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        onClick={onClick}
        onKeyDown={isInteractive ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(e as any);
          }
        } : undefined}
        {...props}
      />
    );
  }
);

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padding, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(cardHeaderVariants({ padding, className }))}
      {...props}
    />
  )
);

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-bold leading-tight tracking-tight text-foreground', className)}
      {...props}
    />
  )
);

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted leading-normal', className)}
      {...props}
    />
  )
);

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardContentVariants({ padding, className }))}
      {...props}
    />
  )
);

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, padding, ...props }, ref) => (
    <footer
      ref={ref}
      className={cn(cardFooterVariants({ padding, className }))}
      {...props}
    />
  )
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  cardVariants 
};