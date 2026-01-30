/**
 * Animation Utilities
 * 
 * Utilities for consistent animations and transitions across the design system
 */

import { animationTokens } from '../tokens/animations';

/**
 * Predefined animation presets
 */
export const animationPresets = {
  // Theme transitions
  themeTransition: {
    duration: animationTokens.duration.normal,
    easing: animationTokens.easing.easeInOut,
    properties: ['background-color', 'color', 'border-color', 'box-shadow']
  },
  
  // Component state transitions
  hover: {
    duration: animationTokens.duration.fast,
    easing: animationTokens.easing.easeOut,
    properties: ['transform', 'box-shadow', 'background-color']
  },
  
  focus: {
    duration: animationTokens.duration.fast,
    easing: animationTokens.easing.easeOut,
    properties: ['box-shadow', 'border-color']
  },
  
  // Voice UI animations
  voicePulse: {
    duration: '2s',
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    iteration: 'infinite',
    direction: 'alternate'
  },
  
  voiceWave: {
    duration: '1s',
    easing: animationTokens.easing.easeInOut,
    iteration: 'infinite',
    direction: 'alternate'
  },
  
  // Modal and overlay animations
  fadeIn: {
    duration: animationTokens.duration.normal,
    easing: animationTokens.easing.easeOut,
    properties: ['opacity']
  },
  
  slideUp: {
    duration: animationTokens.duration.normal,
    easing: animationTokens.easing.easeOut,
    properties: ['transform', 'opacity']
  },
  
  // Loading animations
  spin: {
    duration: '1s',
    easing: animationTokens.easing.linear,
    iteration: 'infinite'
  },
  
  bounce: {
    duration: '1s',
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    iteration: 'infinite'
  }
} as const;

/**
 * Generate CSS transition string
 */
export function createTransition(
  properties: string[],
  duration: string = animationTokens.duration.normal,
  easing: string = animationTokens.easing.easeInOut
): string {
  return properties
    .map(prop => `${prop} ${duration} ${easing}`)
    .join(', ');
}

/**
 * Generate animation CSS string
 */
export function createAnimation(
  name: string,
  duration: string,
  easing: string = animationTokens.easing.easeInOut,
  iteration: string = '1',
  direction: string = 'normal',
  fillMode: string = 'both'
): string {
  return `${name} ${duration} ${easing} ${iteration} ${direction} ${fillMode}`;
}

/**
 * Common transition classes
 */
export const transitionClasses = {
  // Theme transitions
  theme: 'transition-colors duration-300 ease-in-out',
  
  // Interactive elements
  interactive: 'transition-all duration-150 ease-out',
  hover: 'transition-transform duration-150 ease-out hover:scale-105',
  focus: 'transition-shadow duration-150 ease-out focus:ring-2 focus:ring-primary',
  
  // Voice UI
  voicePulse: 'animate-voice-pulse',
  voiceWave: 'animate-voice-wave',
  
  // Layout
  fadeIn: 'animate-theme-transition',
  slideUp: 'transform transition-all duration-300 ease-out',
  
  // Loading states
  spin: 'animate-spin',
  bounce: 'animate-bounce'
} as const;

/**
 * Get transition class for specific use case
 */
export function getTransitionClass(
  type: keyof typeof transitionClasses
): string {
  return transitionClasses[type];
}

/**
 * Reduced motion utilities
 */
export const reducedMotionClasses = {
  respectMotion: 'motion-reduce:transition-none motion-reduce:animate-none',
  forceMotion: 'motion-safe:transition-all motion-safe:animate-pulse'
} as const;

/**
 * Animation timing functions
 */
export const easingFunctions = {
  // Standard easing
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Custom easing for specific use cases
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  
  // Voice UI specific
  voicePulse: 'cubic-bezier(0.4, 0, 0.6, 1)',
  voiceWave: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
} as const;

/**
 * Animation duration presets
 */
export const durationPresets = {
  instant: '0ms',
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '750ms',
  slowest: '1000ms'
} as const;

/**
 * Stagger animation utilities
 */
export function createStaggerDelay(index: number, baseDelay: number = 100): string {
  return `${index * baseDelay}ms`;
}

/**
 * Generate staggered animation classes
 */
export function getStaggeredClasses(
  totalItems: number,
  baseDelay: number = 100,
  animationClass: string = 'animate-fadeIn'
): string[] {
  return Array.from({ length: totalItems }, (_, index) => 
    `${animationClass} [animation-delay:${createStaggerDelay(index, baseDelay)}]`
  );
}

/**
 * Voice UI specific animations
 */
export const voiceAnimations = {
  // Microphone button states
  micIdle: 'scale-100 opacity-70',
  micListening: 'scale-110 opacity-100 animate-voice-pulse',
  micProcessing: 'scale-105 opacity-90 animate-spin',
  micError: 'scale-95 opacity-60 animate-bounce',
  
  // Waveform animations
  waveformIdle: 'opacity-30',
  waveformActive: 'opacity-100 animate-voice-wave',
  
  // Voice banner states
  bannerSlideIn: 'transform translate-y-0 opacity-100 transition-all duration-300 ease-out',
  bannerSlideOut: 'transform -translate-y-full opacity-0 transition-all duration-300 ease-in'
} as const;

/**
 * Get voice animation class
 */
export function getVoiceAnimationClass(
  state: keyof typeof voiceAnimations
): string {
  return voiceAnimations[state];
}

/**
 * Performance optimization utilities
 */
export const performanceOptimizations = {
  // Use transform and opacity for better performance
  gpuAccelerated: 'transform-gpu',
  willChange: 'will-change-transform',
  
  // Contain layout shifts
  containLayout: 'contain-layout',
  containStyle: 'contain-style',
  
  // Optimize repaints
  backfaceHidden: 'backface-visibility-hidden',
  perspective: 'perspective-1000'
} as const;

/**
 * Apply performance optimizations to animated elements
 */
export function getOptimizedAnimationClass(baseClass: string): string {
  return `${baseClass} ${performanceOptimizations.gpuAccelerated} ${performanceOptimizations.backfaceHidden}`;
}