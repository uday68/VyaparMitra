import { Theme } from '../types';
import { colorTokens } from '../tokens/colors';
import { typographyTokens } from '../tokens/typography';
import { spacingTokens } from '../tokens/spacing';
import { shadowTokens } from '../tokens/shadows';
import { animationTokens } from '../tokens/animations';

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    ...colorTokens,
    // Light theme specific overrides
    neutral: {
      ...colorTokens.neutral,
      // Ensure proper contrast for light theme (WCAG AA compliant)
      50: '#f6f7f8',   // background-light
      100: '#e2e8f0',  // borders
      200: '#cbd5e0',  // muted elements
      300: '#a0aec0',  // secondary text
      400: '#6b7280',  // muted text (WCAG AA compliant: 4.59:1)
      500: '#4b5563',  // body text (WCAG AA compliant: 7.59:1)
      600: '#2d3748',  // emphasis text
      700: '#1a202c',  // headings
      800: '#111418',  // primary text
      900: '#0a0e13'   // high contrast text
    }
  },
  typography: typographyTokens,
  spacing: spacingTokens,
  shadows: shadowTokens,
  animations: animationTokens
};

// Light theme CSS custom properties
export const lightThemeProperties = {
  // Colors
  '--color-background': '#ffffff',
  '--color-background-light': colorTokens.neutral[50],
  '--color-background-muted': '#f8fafc',
  '--color-foreground': colorTokens.neutral[800],
  '--color-foreground-muted': colorTokens.neutral[400],
  
  // Primary colors
  '--color-primary': colorTokens.primary.blue,
  '--color-primary-foreground': '#ffffff',
  '--color-primary-green': colorTokens.primary.green,
  '--color-primary-purple': colorTokens.primary.purple,
  '--color-primary-blue-variant': colorTokens.primary.blueVariant,
  
  // Semantic colors
  '--color-success': colorTokens.semantic.success,
  '--color-success-foreground': '#ffffff',
  '--color-warning': colorTokens.semantic.warning,
  '--color-warning-foreground': '#ffffff',
  '--color-error': colorTokens.semantic.error,
  '--color-error-foreground': '#ffffff',
  '--color-info': colorTokens.semantic.info,
  '--color-info-foreground': '#ffffff',
  
  // Neutral colors
  '--color-border': lightTheme.colors.neutral[100],
  '--color-border-muted': lightTheme.colors.neutral[50],
  '--color-input': lightTheme.colors.neutral[100],
  '--color-ring': colorTokens.primary.blue,
  
  // Card colors
  '--color-card': '#ffffff',
  '--color-card-foreground': colorTokens.neutral[800],
  '--color-card-border': lightTheme.colors.neutral[100],
  
  // Muted colors
  '--color-muted': lightTheme.colors.neutral[50],
  '--color-muted-foreground': lightTheme.colors.neutral[400],
  
  // Accent colors
  '--color-accent': lightTheme.colors.neutral[50],
  '--color-accent-foreground': colorTokens.neutral[800],
  
  // Voice UI colors
  '--color-voice-background': 'rgba(28, 116, 233, 0.1)',
  '--color-voice-border': 'rgba(28, 116, 233, 0.2)',
  '--color-voice-foreground': colorTokens.primary.blue,
  
  // Glass effect colors
  '--color-glass-background': 'rgba(255, 255, 255, 0.8)',
  '--color-glass-border': 'rgba(255, 255, 255, 0.2)',
};