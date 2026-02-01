import React from 'react';
import { cn } from '@/lib/utils';

interface VoiceStatusIndicatorProps {
  status: 'idle' | 'listening' | 'processing' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function VoiceStatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = false,
  className 
}: VoiceStatusIndicatorProps) {
  // Size variants using design tokens
  const sizeStyles = {
    sm: {
      container: 'w-8 h-8',
      icon: 'text-lg',
      label: 'text-xs',
      pulse: 'w-8 h-8'
    },
    md: {
      container: 'w-12 h-12',
      icon: 'text-xl',
      label: 'text-sm',
      pulse: 'w-12 h-12'
    },
    lg: {
      container: 'w-16 h-16',
      icon: 'text-2xl',
      label: 'text-base',
      pulse: 'w-16 h-16'
    }
  };

  // Status-based styling using design tokens
  const statusStyles = {
    idle: {
      bg: 'bg-neutral-200 dark:bg-neutral-700',
      text: 'text-neutral-600 dark:text-neutral-400',
      icon: 'mic_off',
      label: 'Ready',
      pulse: false
    },
    listening: {
      bg: 'bg-primary-purple text-white',
      text: 'text-white',
      icon: 'mic',
      label: 'Listening',
      pulse: true,
      pulseColor: 'bg-primary-purple/30'
    },
    processing: {
      bg: 'bg-primary text-white',
      text: 'text-white', 
      icon: 'hourglass_empty',
      label: 'Processing',
      pulse: false,
      spin: true
    },
    error: {
      bg: 'bg-error text-white',
      text: 'text-error',
      icon: 'error',
      label: 'Error',
      pulse: true,
      pulseColor: 'bg-error/30'
    }
  };

  const currentSize = sizeStyles[size];
  const currentStatus = statusStyles[status];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Status indicator with icon */}
      <div className="relative flex items-center justify-center">
        {/* Pulse animation background */}
        {currentStatus.pulse && (
          <div 
            className={cn(
              "absolute inset-0 rounded-full animate-ping",
              currentStatus.pulseColor,
              currentSize.pulse
            )}
          />
        )}
        
        {/* Main status button */}
        <button
          className={cn(
            "relative flex items-center justify-center rounded-full",
            "border-2 border-transparent transition-all duration-200",
            "focus:outline-none focus:ring-4 focus:ring-offset-2",
            "hover:scale-105 active:scale-95",
            currentSize.container,
            currentStatus.bg,
            
            // Focus ring colors based on status
            status === 'listening' && 'focus:ring-primary-purple/30',
            status === 'processing' && 'focus:ring-primary/30',
            status === 'error' && 'focus:ring-error/30',
            status === 'idle' && 'focus:ring-neutral-400/30'
          )}
          aria-label={`Voice status: ${currentStatus.label}`}
          role="button"
          tabIndex={0}
        >
          <span 
            className={cn(
              "material-symbols-outlined",
              currentSize.icon,
              currentStatus.text,
              // Spin animation for processing
              currentStatus.spin && 'animate-spin'
            )}
          >
            {currentStatus.icon}
          </span>
        </button>
      </div>

      {/* Status label */}
      {showLabel && (
        <span 
          className={cn(
            "font-semibold text-center",
            currentSize.label,
            currentStatus.text
          )}
        >
          {currentStatus.label}
        </span>
      )}
    </div>
  );
}