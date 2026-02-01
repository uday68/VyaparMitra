import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ButtonProps } from "@/design-system/types"

const buttonVariants = cva(
  // Base styles using design system tokens
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-body font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary button - uses current color scheme
        primary: "bg-primary text-white border border-primary hover:bg-primary/90 active:bg-primary/80 focus-visible:ring-primary/50 shadow-sm hover:shadow-md active:shadow-sm",
        
        // Secondary button - outlined style
        secondary: "bg-transparent text-primary border-2 border-primary hover:bg-primary/5 active:bg-primary/10 focus-visible:ring-primary/50",
        
        // Outline button - same as secondary for compatibility
        outline: "bg-transparent text-primary border-2 border-primary hover:bg-primary/5 active:bg-primary/10 focus-visible:ring-primary/50",
        
        // Ghost button - minimal style
        ghost: "bg-transparent text-neutral-700 border border-transparent hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-neutral-500/50 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:active:bg-neutral-700",
        
        // Voice-enabled button - special styling for voice features
        voice: "bg-primary-purple text-white border border-primary-purple hover:bg-primary-purple/90 active:bg-primary-purple/80 focus-visible:ring-primary-purple/50 shadow-sm hover:shadow-md active:shadow-sm relative overflow-hidden",
      },
      
      size: {
        sm: "h-8 px-3 text-sm rounded-md min-w-[64px]", // Meets touch target requirements
        md: "h-10 px-4 text-base rounded-lg min-w-[80px]", // Default size
        lg: "h-12 px-6 text-lg rounded-xl min-w-[96px]", // Large buttons
      },
      
      // Color scheme variants for different page types
      colorScheme: {
        blue: "",
        green: "",
        purple: "",
      },
    },
    compoundVariants: [
      // Primary button color schemes
      {
        variant: "primary",
        colorScheme: "blue",
        class: "bg-primary-blue border-primary-blue hover:bg-primary-blue/90 active:bg-primary-blue/80 focus-visible:ring-primary-blue/50"
      },
      {
        variant: "primary",
        colorScheme: "green",
        class: "bg-primary-green border-primary-green hover:bg-primary-green/90 active:bg-primary-green/80 focus-visible:ring-primary-green/50"
      },
      {
        variant: "primary",
        colorScheme: "purple",
        class: "bg-primary-purple border-primary-purple hover:bg-primary-purple/90 active:bg-primary-purple/80 focus-visible:ring-primary-purple/50"
      },
      
      // Secondary button color schemes
      {
        variant: "secondary",
        colorScheme: "blue",
        class: "text-primary-blue border-primary-blue hover:bg-primary-blue/5 active:bg-primary-blue/10 focus-visible:ring-primary-blue/50"
      },
      {
        variant: "secondary",
        colorScheme: "green",
        class: "text-primary-green border-primary-green hover:bg-primary-green/5 active:bg-primary-green/10 focus-visible:ring-primary-green/50"
      },
      {
        variant: "secondary",
        colorScheme: "purple",
        class: "text-primary-purple border-primary-purple hover:bg-primary-purple/5 active:bg-primary-purple/10 focus-visible:ring-primary-purple/50"
      },
      
      // Outline button color schemes (same as secondary)
      {
        variant: "outline",
        colorScheme: "blue",
        class: "text-primary-blue border-primary-blue hover:bg-primary-blue/5 active:bg-primary-blue/10 focus-visible:ring-primary-blue/50"
      },
      {
        variant: "outline",
        colorScheme: "green",
        class: "text-primary-green border-primary-green hover:bg-primary-green/5 active:bg-primary-green/10 focus-visible:ring-primary-green/50"
      },
      {
        variant: "outline",
        colorScheme: "purple",
        class: "text-primary-purple border-primary-purple hover:bg-primary-purple/5 active:bg-primary-purple/10 focus-visible:ring-primary-purple/50"
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      colorScheme: "blue",
    },
  },
)

// Loading spinner component
const LoadingSpinner = ({ size = "sm" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };
  
  return (
    <svg
      className={cn("animate-spin", sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export interface ExtendedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ExtendedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    colorScheme,
    asChild = false, 
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, colorScheme, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner size={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"} />}
        {!isLoading && leftIcon && leftIcon}
        <span className={cn(isLoading && "opacity-0")}>{children}</span>
        {!isLoading && rightIcon && rightIcon}
        
        {/* Voice button special effect */}
        {variant === "voice" && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse" />
        )}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
