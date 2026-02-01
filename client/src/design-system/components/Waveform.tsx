import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface WaveformProps {
  isActive: boolean;
  amplitude?: number;
  colorScheme?: 'blue' | 'green' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  barCount?: number;
}

export function Waveform({ 
  isActive, 
  amplitude = 1,
  colorScheme = 'purple',
  size = 'md',
  className,
  barCount = 12
}: WaveformProps) {
  const [animationData, setAnimationData] = useState<number[]>([]);

  // Size variants using design tokens
  const sizeStyles = {
    sm: {
      container: 'h-8 w-24',
      bar: 'w-1',
      minHeight: 4,
      maxHeight: 16
    },
    md: {
      container: 'h-12 w-32',
      bar: 'w-1.5',
      minHeight: 6,
      maxHeight: 24
    },
    lg: {
      container: 'h-16 w-40',
      bar: 'w-2',
      minHeight: 8,
      maxHeight: 32
    }
  };

  // Color scheme variants using design tokens
  const colorSchemeStyles = {
    blue: 'bg-primary-blue',
    green: 'bg-primary-green', 
    purple: 'bg-primary-purple'
  };

  const currentSize = sizeStyles[size];

  // Generate random waveform data
  useEffect(() => {
    if (!isActive) {
      // Set all bars to minimum height when inactive
      setAnimationData(Array(barCount).fill(currentSize.minHeight));
      return;
    }

    const interval = setInterval(() => {
      const newData = Array.from({ length: barCount }, (_, i) => {
        // Create wave-like pattern with some randomness
        const baseWave = Math.sin((i / barCount) * Math.PI * 2) * 0.5 + 0.5;
        const randomFactor = Math.random() * 0.4 + 0.6; // 0.6 to 1.0
        const amplitudeFactor = amplitude * 0.8 + 0.2; // Ensure minimum activity
        
        const height = currentSize.minHeight + 
          (currentSize.maxHeight - currentSize.minHeight) * 
          baseWave * randomFactor * amplitudeFactor;
        
        return Math.round(height);
      });
      
      setAnimationData(newData);
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isActive, amplitude, barCount, currentSize.minHeight, currentSize.maxHeight]);

  // Initialize with minimum heights
  useEffect(() => {
    setAnimationData(Array(barCount).fill(currentSize.minHeight));
  }, [barCount, currentSize.minHeight]);

  return (
    <div 
      className={cn(
        "flex items-end justify-center gap-1",
        currentSize.container,
        className
      )}
      role="img"
      aria-label={isActive ? "Voice waveform animation active" : "Voice waveform inactive"}
    >
      {animationData.map((height, index) => (
        <div
          key={index}
          className={cn(
            "rounded-full transition-all duration-100 ease-out",
            currentSize.bar,
            colorSchemeStyles[colorScheme],
            // Opacity variation for depth effect
            index % 3 === 0 ? 'opacity-100' : 
            index % 3 === 1 ? 'opacity-80' : 'opacity-60',
            // Subtle glow effect when active
            isActive && 'shadow-sm'
          )}
          style={{
            height: `${height}px`,
            // Stagger animation slightly for wave effect
            transitionDelay: `${index * 10}ms`
          }}
        />
      ))}
      
      {/* Subtle background glow when active */}
      {isActive && (
        <div 
          className={cn(
            "absolute inset-0 rounded-lg opacity-20 blur-sm -z-10",
            colorSchemeStyles[colorScheme]
          )}
        />
      )}
    </div>
  );
}