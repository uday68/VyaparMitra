import { useNavigate } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useTranslation } from "../hooks/useTranslation";
import { LanguageSelector } from "./LanguageSelector";
import { HeaderProps } from "@/design-system/types";

const headerVariants = cva(
  // Base styles using design system tokens
  "sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-200 theme-transition",
  {
    variants: {
      colorScheme: {
        blue: "bg-white/90 border-border text-foreground",
        green: "bg-white/90 border-border text-foreground",
        purple: "bg-white/90 border-border text-foreground",
      },
      
      variant: {
        default: "px-4 py-3",
        compact: "px-4 py-2",
        spacious: "px-6 py-4",
      },
    },
    defaultVariants: {
      colorScheme: "blue",
      variant: "default",
    },
  },
);

const headerIconVariants = cva(
  "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
  {
    variants: {
      colorScheme: {
        blue: "bg-primary-blue/10 text-primary-blue hover:bg-primary-blue/20",
        green: "bg-primary-green/10 text-primary-green hover:bg-primary-green/20",
        purple: "bg-primary-purple/10 text-primary-purple hover:bg-primary-purple/20",
      },
    },
    defaultVariants: {
      colorScheme: "blue",
    },
  },
);

const backButtonVariants = cva(
  "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer",
  {
    variants: {
      colorScheme: {
        blue: "text-foreground hover:bg-primary-blue/10 hover:text-primary-blue",
        green: "text-foreground hover:bg-primary-green/10 hover:text-primary-green",
        purple: "text-foreground hover:bg-primary-purple/10 hover:text-primary-purple",
      },
    },
    defaultVariants: {
      colorScheme: "blue",
    },
  },
);

export interface ExtendedHeaderProps extends Omit<HeaderProps, 'colorScheme'>, VariantProps<typeof headerVariants> {
  variant?: 'default' | 'compact' | 'spacious';
  colorScheme?: 'blue' | 'green' | 'purple';
}

export function Header({ 
  title, 
  showBack = false, 
  showLanguageSelector = true,
  colorScheme = "blue",
  variant = "default",
  leftAction,
  rightAction,
  onBack,
  className
}: ExtendedHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Use translation for default title if no title provided
  const displayTitle = title || t('shop.title');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1); // Go back in history
    }
  };

  return (
    <header className={cn(headerVariants({ colorScheme, variant }), className)}>
      <div className="flex items-center justify-between max-w-md mx-auto w-full">
        {/* Left Section */}
        <div className="flex items-center">
          {showBack ? (
            <button 
              onClick={handleBack}
              className={cn(backButtonVariants({ colorScheme }))}
              aria-label={t('common.back')}
            >
              <span className="material-symbols-outlined">arrow_back_ios</span>
            </button>
          ) : leftAction ? (
            leftAction
          ) : (
            <div className={cn(headerIconVariants({ colorScheme }))}>
              <span className="material-symbols-outlined text-xl">translate</span>
            </div>
          )}
        </div>
        
        {/* Center Section - Title */}
        <h1 className="text-foreground text-lg font-bold leading-tight tracking-tight flex-1 text-center font-display px-4">
          {displayTitle}
        </h1>

        {/* Right Section */}
        <div className="flex items-center">
          {rightAction ? (
            rightAction
          ) : showLanguageSelector ? (
            <LanguageSelector variant="icon-only" className="shrink-0" />
          ) : (
            <div className="size-10" /> /* Spacer for balance */
          )}
        </div>
      </div>
    </header>
  );
}
