import { AnimationTokens } from '../types';

// Animation tokens for consistent transitions and micro-interactions
export const animationTokens: AnimationTokens = {
  duration: {
    fast: '150ms',    // Quick interactions
    normal: '300ms',  // Standard transitions
    slow: '500ms'     // Slow, emphasized transitions
  },
  
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

// CSS Custom Properties for animations
export const animationCustomProperties = {
  '--duration-fast': animationTokens.duration.fast,
  '--duration-normal': animationTokens.duration.normal,
  '--duration-slow': animationTokens.duration.slow,
  
  '--easing-linear': animationTokens.easing.linear,
  '--easing-ease-in': animationTokens.easing.easeIn,
  '--easing-ease-out': animationTokens.easing.easeOut,
  '--easing-ease-in-out': animationTokens.easing.easeInOut,
};

// Tailwind CSS animation configuration
export const tailwindAnimations = {
  transitionDuration: {
    fast: animationTokens.duration.fast,
    normal: animationTokens.duration.normal,
    slow: animationTokens.duration.slow,
  },
  
  transitionTimingFunction: {
    linear: animationTokens.easing.linear,
    'ease-in': animationTokens.easing.easeIn,
    'ease-out': animationTokens.easing.easeOut,
    'ease-in-out': animationTokens.easing.easeInOut,
  },
  
  // Custom animations from design references
  keyframes: {
    // Voice waveform animation
    'waveform-pulse': {
      '0%, 100%': { height: '8px' },
      '50%': { height: '24px' }
    },
    
    // Voice assistant pulse
    'voice-pulse': {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '100%': { transform: 'scale(1.5)', opacity: '0' }
    },
    
    // Button press animation
    'button-press': {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(0.98)' },
      '100%': { transform: 'scale(1)' }
    },
    
    // Fade in animation
    'fade-in': {
      '0%': { opacity: '0', transform: 'translateY(10px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' }
    },
    
    // Slide up animation
    'slide-up': {
      '0%': { transform: 'translateY(100%)' },
      '100%': { transform: 'translateY(0)' }
    },
    
    // Scale in animation
    'scale-in': {
      '0%': { transform: 'scale(0.8)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' }
    }
  },
  
  animation: {
    'waveform-pulse': 'waveform-pulse 1.5s ease-in-out infinite',
    'voice-pulse': 'voice-pulse 2s ease-in-out infinite',
    'button-press': 'button-press 0.15s ease-in-out',
    'fade-in': 'fade-in 0.3s ease-out',
    'slide-up': 'slide-up 0.3s ease-out',
    'scale-in': 'scale-in 0.3s ease-out',
  }
};

// Predefined animation classes for common patterns
export const animationClasses = {
  // Hover animations
  'hover-lift': 'transition-transform duration-normal ease-out hover:scale-105',
  'hover-glow': 'transition-shadow duration-normal ease-out hover:shadow-lg',
  'hover-fade': 'transition-opacity duration-fast ease-out hover:opacity-80',
  
  // Focus animations
  'focus-ring': 'transition-all duration-fast ease-out focus:ring-2 focus:ring-primary focus:ring-offset-2',
  'focus-scale': 'transition-transform duration-fast ease-out focus:scale-105',
  
  // Active animations
  'active-press': 'transition-transform duration-fast ease-out active:scale-98',
  'active-fade': 'transition-opacity duration-fast ease-out active:opacity-70',
  
  // Loading animations
  'loading-spin': 'animate-spin',
  'loading-pulse': 'animate-pulse',
  'loading-bounce': 'animate-bounce',
  
  // Voice UI animations
  'voice-waveform': 'animate-waveform-pulse',
  'voice-pulse': 'animate-voice-pulse',
  'voice-listening': 'animate-pulse',
  
  // Page transitions
  'page-enter': 'animate-fade-in',
  'modal-enter': 'animate-scale-in',
  'drawer-enter': 'animate-slide-up',
  
  // Theme transitions
  'theme-transition': 'transition-colors duration-normal ease-in-out',
};