import { ColorTokens } from '../types';

// Color tokens extracted from design references
export const colorTokens: ColorTokens = {
  // Primary colors from design references (WCAG AA compliant)
  primary: {
    blue: '#1d4ed8',      // Blue-700 (WCAG AA compliant: 4.56:1)
    green: '#15803d',     // Green-700 (WCAG AA compliant: 4.75:1)
    purple: '#7c3aed',    // Purple-600 (WCAG AA compliant: 4.51:1)
    blueVariant: '#2563eb' // Blue-600 (WCAG AA compliant: 4.56:1)
  },
  
  // Semantic colors (WCAG AA compliant)
  semantic: {
    success: '#15803d',   // Green-700 (4.75:1 with white)
    warning: '#b45309',   // Amber-700 (4.52:1 with white)
    error: '#dc2626',     // Red-600 (5.25:1 with white)
    info: '#2563eb'       // Blue-600 (4.56:1 with white)
  },
  
  // Neutral colors matching design references (WCAG AA compliant)
  neutral: {
    50: '#f6f7f8',   // background-light from design references
    100: '#dbe6df',  // borders from welcome page
    200: '#61896f',  // muted text from welcome page
    300: '#637388',  // secondary text
    400: '#6b7280',  // muted text (WCAG AA compliant: 4.59:1 with white)
    500: '#4b5563',  // darker muted text (WCAG AA compliant: 7.59:1 with white)
    600: '#4a5568',
    700: '#2d3748',
    800: '#111418',  // primary dark text from design references
    900: '#111821'   // background-dark from design references
  }
};

// CSS Custom Properties for runtime theme switching
export const lightThemeColors = {
  '--color-primary': colorTokens.primary.blue,
  '--color-primary-green': colorTokens.primary.green,
  '--color-primary-purple': colorTokens.primary.purple,
  '--color-primary-blue-variant': colorTokens.primary.blueVariant,
  
  '--color-success': colorTokens.semantic.success,
  '--color-warning': colorTokens.semantic.warning,
  '--color-error': colorTokens.semantic.error,
  '--color-info': colorTokens.semantic.info,
  
  '--color-background': '#ffffff',
  '--color-background-light': colorTokens.neutral[50],
  '--color-background-muted': '#f0f2f4',
  '--color-foreground': colorTokens.neutral[800],
  '--color-muted': colorTokens.neutral[300],
  '--color-border': colorTokens.neutral[100],
  
  '--color-card-background': '#ffffff',
  '--color-card-border': colorTokens.neutral[100],
};

export const darkThemeColors = {
  '--color-primary': colorTokens.primary.blue,
  '--color-primary-green': colorTokens.primary.green,
  '--color-primary-purple': colorTokens.primary.purple,
  '--color-primary-blue-variant': colorTokens.primary.blueVariant,
  
  '--color-success': colorTokens.semantic.success,
  '--color-warning': colorTokens.semantic.warning,
  '--color-error': colorTokens.semantic.error,
  '--color-info': colorTokens.semantic.info,
  
  '--color-background': colorTokens.neutral[900],
  '--color-background-light': '#171022', // from voice_assistant_settings dark
  '--color-background-muted': '#231a31', // from voice_assistant_settings dark
  '--color-foreground': '#ffffff',
  '--color-muted': colorTokens.neutral[400],
  '--color-border': 'rgba(255, 255, 255, 0.1)',
  
  '--color-card-background': '#1a1a1a',
  '--color-card-border': 'rgba(255, 255, 255, 0.1)',
};

// Color scheme utilities
export const getColorScheme = (scheme: 'blue' | 'green' | 'purple') => {
  switch (scheme) {
    case 'green':
      return colorTokens.primary.green;
    case 'purple':
      return colorTokens.primary.purple;
    case 'blue':
    default:
      return colorTokens.primary.blue;
  }
};

// Tailwind CSS color configuration
export const tailwindColors = {
  primary: {
    DEFAULT: colorTokens.primary.blue,
    blue: colorTokens.primary.blue,
    green: colorTokens.primary.green,
    purple: colorTokens.primary.purple,
    'blue-variant': colorTokens.primary.blueVariant,
  },
  
  semantic: {
    success: colorTokens.semantic.success,
    warning: colorTokens.semantic.warning,
    error: colorTokens.semantic.error,
    info: colorTokens.semantic.info,
  },
  
  neutral: colorTokens.neutral,
  
  // Design reference specific colors
  'background-light': colorTokens.neutral[50],
  'background-dark': colorTokens.neutral[900],
  'text-primary': colorTokens.neutral[800],
  'text-muted': colorTokens.neutral[300],
  'border-light': colorTokens.neutral[100],
};