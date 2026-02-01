import { ColorTokens } from '../types';

// Professional color tokens for VyaparMitra vendor dashboard
export const colorTokens: ColorTokens = {
  // Professional primary colors - sophisticated and business-focused
  primary: {
    blue: '#0f172a',      // Slate-900 - Professional dark blue
    green: '#059669',     // Emerald-600 - Success/money green
    purple: '#7c3aed',    // Violet-600 - Premium accent
    blueVariant: '#1e293b' // Slate-800 - Secondary dark
  },
  
  // Semantic colors (WCAG AA compliant)
  semantic: {
    success: '#059669',   // Emerald-600 - Professional green
    warning: '#d97706',   // Amber-600 - Clear warning
    error: '#dc2626',     // Red-600 - Clear error
    info: '#0284c7'       // Sky-600 - Professional info blue
  },
  
  // Professional neutral palette - sophisticated grays
  neutral: {
    50: '#f8fafc',   // Slate-50 - Clean background
    100: '#f1f5f9',  // Slate-100 - Light surface
    200: '#e2e8f0',  // Slate-200 - Subtle borders
    300: '#cbd5e1',  // Slate-300 - Muted elements
    400: '#94a3b8',  // Slate-400 - Secondary text
    500: '#64748b',  // Slate-500 - Body text
    600: '#475569',  // Slate-600 - Emphasis text
    700: '#334155',  // Slate-700 - Headings
    800: '#1e293b',  // Slate-800 - Dark text
    900: '#0f172a'   // Slate-900 - Darkest text
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
  '--color-background-muted': colorTokens.neutral[100],
  '--color-foreground': colorTokens.neutral[900],
  '--color-muted': colorTokens.neutral[400],
  '--color-border': colorTokens.neutral[200],
  
  '--color-card-background': '#ffffff',
  '--color-card-border': colorTokens.neutral[200],
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
  
  // Professional vendor dashboard colors
  'vendor-primary': colorTokens.primary.blue,
  'vendor-success': colorTokens.semantic.success,
  'vendor-warning': colorTokens.semantic.warning,
  'vendor-surface': colorTokens.neutral[50],
  'vendor-border': colorTokens.neutral[200],
  'vendor-text': colorTokens.neutral[900],
  'vendor-muted': colorTokens.neutral[500],
};