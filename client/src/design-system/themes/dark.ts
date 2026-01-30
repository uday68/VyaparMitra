import { Theme } from '../types';
import { colorTokens } from '../tokens/colors';
import { typographyTokens } from '../tokens/typography';
import { spacingTokens } from '../tokens/spacing';
import { shadowTokens, darkModeShadows } from '../tokens/shadows';
import { animationTokens } from '../tokens/animations';

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    ...colorTokens,
    // Dark theme specific overrides
    neutral: {
      ...colorTokens.neutral,
      // Inverted neutral scale for dark theme (WCAG AA compliant)
      50: '#0a0e13',   // darkest background
      100: '#111821',  // background-dark
      200: '#1a202c',  // card backgrounds
      300: '#2d3748',  // borders
      400: '#4a5568',  // muted text
      500: '#9ca3af',  // secondary text (WCAG AA compliant with dark bg)
      600: '#a0aec0',  // body text
      700: '#cbd5e0',  // emphasis text
      800: '#e2e8f0',  // headings
      900: '#f7fafc'   // primary text (white)
    }
  },
  typography: typographyTokens,
  spacing: spacingTokens,
  shadows: {
    ...shadowTokens,
    // Override with dark mode shadows
    sm: darkModeShadows.card,
    md: darkModeShadows.cardElevated,
    lg: darkModeShadows.voiceBanner,
    '2xl': darkModeShadows.modal,
  },
  animations: animationTokens
};

// Dark theme CSS custom properties
export const darkThemeProperties = {
  // Colors
  '--color-background': darkTheme.colors.neutral[100], // #111821
  '--color-background-light': '#171022', // from voice_assistant_settings
  '--color-background-muted': '#231a31', // from voice_assistant_settings
  '--color-foreground': darkTheme.colors.neutral[900], // white
  '--color-foreground-muted': darkTheme.colors.neutral[500],
  
  // Primary colors (same as light theme)
  '--color-primary': colorTokens.primary.blue,
  '--color-primary-foreground': '#ffffff',
  '--color-primary-green': colorTokens.primary.green,
  '--color-primary-purple': colorTokens.primary.purple,
  '--color-primary-blue-variant': colorTokens.primary.blueVariant,
  
  // Semantic colors (same as light theme)
  '--color-success': colorTokens.semantic.success,
  '--color-success-foreground': '#ffffff',
  '--color-warning': colorTokens.semantic.warning,
  '--color-warning-foreground': '#ffffff',
  '--color-error': colorTokens.semantic.error,
  '--color-error-foreground': '#ffffff',
  '--color-info': colorTokens.semantic.info,
  '--color-info-foreground': '#ffffff',
  
  // Neutral colors
  '--color-border': 'rgba(255, 255, 255, 0.1)',
  '--color-border-muted': 'rgba(255, 255, 255, 0.05)',
  '--color-input': 'rgba(255, 255, 255, 0.1)',
  '--color-ring': colorTokens.primary.blue,
  
  // Card colors
  '--color-card': darkTheme.colors.neutral[200], // #1a202c
  '--color-card-foreground': darkTheme.colors.neutral[900],
  '--color-card-border': 'rgba(255, 255, 255, 0.1)',
  
  // Muted colors
  '--color-muted': darkTheme.colors.neutral[200],
  '--color-muted-foreground': darkTheme.colors.neutral[500],
  
  // Accent colors
  '--color-accent': darkTheme.colors.neutral[200],
  '--color-accent-foreground': darkTheme.colors.neutral[900],
  
  // Voice UI colors
  '--color-voice-background': 'rgba(28, 116, 233, 0.2)',
  '--color-voice-border': 'rgba(28, 116, 233, 0.3)',
  '--color-voice-foreground': colorTokens.primary.blue,
  
  // Glass effect colors
  '--color-glass-background': 'rgba(0, 0, 0, 0.8)',
  '--color-glass-border': 'rgba(255, 255, 255, 0.1)',
};