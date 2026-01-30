import { SpacingTokens } from '../types';

// Spacing tokens based on design references
export const spacingTokens: SpacingTokens = {
  space: {
    1: '0.25rem',   // 4px - Minimal spacing
    2: '0.5rem',    // 8px - Small gaps
    3: '0.75rem',   // 12px - Medium gaps
    4: '1rem',      // 16px - Standard spacing (from design references)
    5: '1.25rem',   // 20px - Large gaps
    6: '1.5rem',    // 24px - Section spacing
    8: '2rem',      // 32px - Large sections
    10: '2.5rem',   // 40px - Extra large spacing
    12: '3rem',     // 48px - Major sections
    16: '4rem',     // 64px - Page sections
    20: '5rem',     // 80px - Large page sections
    24: '6rem'      // 96px - Extra large page sections
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px - Small elements
    md: '0.5rem',    // 8px - Cards, inputs (from design references)
    lg: '0.75rem',   // 12px - Buttons, cards (from design references)
    xl: '1rem',      // 16px - Large cards (from design references)
    '2xl': '1.5rem', // 24px - Voice banners (from design references)
    '3xl': '2rem',   // 32px - Large panels
    full: '9999px'   // Full rounded (buttons, avatars)
  }
};

// CSS Custom Properties for spacing
export const spacingCustomProperties = {
  '--space-1': spacingTokens.space[1],
  '--space-2': spacingTokens.space[2],
  '--space-3': spacingTokens.space[3],
  '--space-4': spacingTokens.space[4],
  '--space-5': spacingTokens.space[5],
  '--space-6': spacingTokens.space[6],
  '--space-8': spacingTokens.space[8],
  '--space-10': spacingTokens.space[10],
  '--space-12': spacingTokens.space[12],
  '--space-16': spacingTokens.space[16],
  '--space-20': spacingTokens.space[20],
  '--space-24': spacingTokens.space[24],
  
  '--radius-none': spacingTokens.borderRadius.none,
  '--radius-sm': spacingTokens.borderRadius.sm,
  '--radius-md': spacingTokens.borderRadius.md,
  '--radius-lg': spacingTokens.borderRadius.lg,
  '--radius-xl': spacingTokens.borderRadius.xl,
  '--radius-2xl': spacingTokens.borderRadius['2xl'],
  '--radius-3xl': spacingTokens.borderRadius['3xl'],
  '--radius-full': spacingTokens.borderRadius.full,
};

// Tailwind CSS spacing configuration
export const tailwindSpacing = {
  spacing: spacingTokens.space,
  borderRadius: spacingTokens.borderRadius,
};

// Layout patterns from design references
export const layoutPatterns = {
  // Container patterns
  container: {
    mobile: 'max-w-[430px] mx-auto px-4', // Mobile-first container from design references
    tablet: 'max-w-2xl mx-auto px-6',
    desktop: 'max-w-4xl mx-auto px-8',
    wide: 'max-w-6xl mx-auto px-12'
  },
  
  // Card patterns from design references
  card: {
    default: 'p-4 rounded-xl border', // Standard card padding
    compact: 'p-3 rounded-lg border', // Compact cards
    spacious: 'p-6 rounded-2xl border', // Large cards
    voice: 'p-4 rounded-2xl border' // Voice assistant banners
  },
  
  // Header patterns from design references
  header: {
    mobile: 'px-4 py-3 h-16', // Standard header from design references
    withSearch: 'px-4 py-3', // Header with search bar
    minimal: 'px-4 py-2' // Minimal header
  },
  
  // Navigation patterns
  navigation: {
    bottom: 'px-6 pb-6 pt-3', // Bottom navigation from design references
    tabs: 'px-4 pb-4' // Tab navigation
  },
  
  // Voice UI patterns
  voice: {
    banner: 'px-4 mb-4', // Voice assistant banner positioning
    controls: 'p-4 pb-8 space-y-4', // Voice control footer
    waveform: 'h-12 w-full', // Waveform container
    micButton: 'size-16 rounded-full' // Microphone button
  },
  
  // Form patterns
  form: {
    field: 'space-y-2', // Form field spacing
    group: 'space-y-4', // Form group spacing
    actions: 'space-y-3 pt-6' // Form action spacing
  }
};

// Responsive breakpoints from design references
export const breakpoints = {
  mobile: '320px',   // Mobile-first
  tablet: '768px',   // Tablet
  desktop: '1024px', // Desktop
  wide: '1280px'     // Wide screens
};

// Touch target sizes for accessibility
export const touchTargets = {
  minimum: '44px',   // WCAG minimum touch target
  comfortable: '48px', // Comfortable touch target
  large: '56px'      // Large touch target
};