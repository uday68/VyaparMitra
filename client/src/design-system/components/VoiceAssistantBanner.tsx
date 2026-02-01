import React from 'react';
import { cn } from '@/lib/utils';

interface VoiceAssistantBannerProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  message: string;
  onToggle: () => void;
  colorScheme?: 'blue' | 'green' | 'purple';
  className?: string;
}

export function VoiceAssistantBanner({ 
  status, 
  message, 
  onToggle, 
  colorScheme = 'purple',
  className 
}: VoiceAssistantBannerProps) {
  // Status-based styling using design tokens
  const statusStyles = {
    idle: {
      bg: 'bg-neutral-100 dark:bg-neutral-800',
      border: 'border-neutral-200 dark:border-neutral-700',
      text: 'text-neutral-700 dark:text-neutral-300',
      icon: 'text-neutral-500 dark:text-neutral-400'
    },
    listening: {
      bg: 'bg-primary-purple/10 dark:bg-primary-purple/20',
      border: 'border-primary-purple/30 dark:border-primary-purple/40',
      text: 'text-primary-purple dark:text-primary-purple',
      icon: 'text-primary-purple'
    },
    processing: {
      bg: 'bg-primary/10 dark:bg-primary/20',
      border: 'border-primary/30 dark:border-primary/40',
      text: 'text-primary dark:text-primary',
      icon: 'text-primary'
    },
    speaking: {
      bg: 'bg-primary-green/10 dark:bg-primary-green/20',
      border: 'border-primary-green/30 dark:border-primary-green/40',
      text: 'text-primary-green dark:text-primary-green',
      icon: 'text-primary-green'
    }
  };

  // Color scheme variants
  const colorSchemeStyles = {
    blue: 'hover:bg-primary-blue/5 focus:ring-primary-blue/20',
    green: 'hover:bg-primary-green/5 focus:ring-primary-green/20',
    purple: 'hover:bg-primary-purple/5 focus:ring-primary-purple/20'
  };

  const currentStyles = statusStyles[status];

  // Microphone icon with status indicator
  const getMicrophoneIcon = () => {
    if (status === 'listening') {
      return (
        <div className="relative">
          <span className="material-symbols-outlined text-xl">mic</span>
          {/* Pulse animation for listening state */}
          <div className="absolute inset-0 rounded-full bg-primary-purple/20 animate-ping" />
        </div>
      );
    } else if (status === 'processing') {
      return (
        <div className="relative">
          <span className="material-symbols-outlined text-xl animate-pulse">mic</span>
          {/* Processing indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      );
    } else if (status === 'speaking') {
      return (
        <div className="relative">
          <span className="material-symbols-outlined text-xl">volume_up</span>
          {/* Speaking animation */}
          <div className="absolute inset-0 rounded-full bg-primary-green/20 animate-pulse" />
        </div>
      );
    } else {
      return <span className="material-symbols-outlined text-xl">mic_off</span>;
    }
  };

  // Status message with appropriate styling
  const getStatusMessage = () => {
    const defaultMessages = {
      idle: 'Voice assistant is ready',
      listening: 'Listening...',
      processing: 'Processing your request...',
      speaking: 'Speaking response...'
    };

    return message || defaultMessages[status];
  };

  return (
    <div 
      className={cn(
        // Base floating panel design using design tokens
        "fixed top-4 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 px-4 py-3 rounded-2xl border-2",
        "shadow-lg backdrop-blur-sm transition-all duration-300",
        "min-w-[280px] max-w-[400px]",
        
        // Status-based styling
        currentStyles.bg,
        currentStyles.border,
        
        // Interactive states
        "cursor-pointer",
        colorSchemeStyles[colorScheme],
        "focus:outline-none focus:ring-4 focus:ring-offset-2",
        
        // Animation classes
        "transform hover:scale-105 active:scale-95",
        
        className
      )}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Voice assistant ${status}. Click to toggle.`}
    >
      {/* Microphone icon with status indicator */}
      <div className={cn("flex-shrink-0", currentStyles.icon)}>
        {getMicrophoneIcon()}
      </div>

      {/* Status message */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-semibold truncate",
          currentStyles.text
        )}>
          {getStatusMessage()}
        </p>
      </div>

      {/* Waveform animation for active states */}
      {(status === 'listening' || status === 'speaking') && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 bg-current rounded-full animate-pulse",
                currentStyles.icon
              )}
              style={{
                height: `${8 + Math.random() * 8}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.8s'
              }}
            />
          ))}
        </div>
      )}

      {/* Close/minimize button */}
      <button
        className={cn(
          "flex-shrink-0 p-1 rounded-full transition-colors duration-200",
          "hover:bg-black/10 dark:hover:bg-white/10",
          currentStyles.icon
        )}
        onClick={(e) => {
          e.stopPropagation();
          // Could implement minimize functionality here
        }}
        aria-label="Minimize voice assistant"
      >
        <span className="material-symbols-outlined text-sm">
          keyboard_arrow_up
        </span>
      </button>
    </div>
  );
}