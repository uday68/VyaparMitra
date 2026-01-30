import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { CardProps } from "@/design-system/types"

const cardVariants = cva(
  // Base styles using design system tokens
  "rounded-xl bg-card text-card-foreground transition-all duration-200 theme-transition",
  {
    variants: {
      variant: {
        // Default card - standard styling
        default: "border border-card-border shadow-sm hover:shadow-md",
        
        // Elevated card - more prominent shadow
        elevated: "border border-card-border shadow-md hover:shadow-lg",
        
        // Outlined card - emphasis on border
        outlined: "border-2 border-card-border shadow-none hover:shadow-sm",
        
        // Glass card - translucent effect
        glass: "glass-panel shadow-lg hover:shadow-xl backdrop-blur-md",
      },
      
      padding: {
        sm: "p-3",
        md: "p-4", 
        lg: "p-6",
      },
      
      borderRadius: {
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
      },
      
      shadow: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      borderRadius: "xl",
      shadow: "sm",
    },
  },
)

export interface ExtendedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, ExtendedCardProps>(
  ({ className, variant, padding, borderRadius, shadow, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, borderRadius, shadow, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-xl font-bold leading-tight tracking-tight text-foreground font-display",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground font-body leading-normal", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 pb-6", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between px-6 pb-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Specialized card components for common patterns

const ProductCard = React.forwardRef<
  HTMLDivElement,
  ExtendedCardProps & {
    imageUrl?: string;
    title: string;
    price?: string;
    description?: string;
    onAction?: () => void;
    actionLabel?: string;
  }
>(({ className, imageUrl, title, price, description, onAction, actionLabel, ...props }, ref) => (
  <Card
    ref={ref}
    variant="default"
    className={cn("overflow-hidden hover:shadow-lg transition-shadow cursor-pointer", className)}
    {...props}
  >
    {imageUrl && (
      <div className="aspect-square overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>
    )}
    <CardContent className="p-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg leading-tight">{title}</h3>
        {price && (
          <p className="text-xl font-bold text-primary">{price}</p>
        )}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
      </div>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="mt-4 w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </CardContent>
  </Card>
))
ProductCard.displayName = "ProductCard"

const VoiceCard = React.forwardRef<
  HTMLDivElement,
  ExtendedCardProps & {
    status: 'idle' | 'listening' | 'processing' | 'speaking';
    title: string;
    message?: string;
  }
>(({ className, status, title, message, ...props }, ref) => {
  const statusColors = {
    idle: 'border-neutral-200',
    listening: 'border-primary-blue bg-primary-blue/5',
    processing: 'border-primary-purple bg-primary-purple/5',
    speaking: 'border-primary-green bg-primary-green/5',
  };

  return (
    <Card
      ref={ref}
      variant="outlined"
      className={cn(
        "voice-panel transition-all duration-300",
        statusColors[status],
        className
      )}
      {...props}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-3 h-3 rounded-full animate-pulse",
            status === 'idle' && "bg-neutral-400",
            status === 'listening' && "bg-primary-blue",
            status === 'processing' && "bg-primary-purple",
            status === 'speaking' && "bg-primary-green"
          )} />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{title}</h4>
            {message && (
              <p className="text-xs text-muted-foreground mt-1">{message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
VoiceCard.displayName = "VoiceCard"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  ProductCard,
  VoiceCard,
  cardVariants,
}
