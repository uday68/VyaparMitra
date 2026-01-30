import { TypographyTokens } from '../types';

// Typography tokens based on design references using Work Sans
export const typographyTokens: TypographyTokens = {
  fontFamily: {
    display: ['Work Sans', 'sans-serif'],
    body: ['Work Sans', 'sans-serif']
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px - Small labels, timestamps
    sm: '0.875rem',   // 14px - Body text, descriptions
    base: '1rem',     // 16px - Default body text
    lg: '1.125rem',   // 18px - Large body text, product names
    xl: '1.25rem',    // 20px - Section headers
    '2xl': '2rem',    // 32px - Page headlines (from welcome page)
    '3xl': '3rem',    // 48px - Large headlines
  },
  
  fontWeight: {
    light: 300,       // Light weight from design references
    normal: 400,      // Normal weight
    medium: 500,      // Medium weight for emphasis
    semibold: 600,    // Semibold for important text
    bold: 700         // Bold for headers and CTAs
  },
  
  lineHeight: {
    tight: '1.25',    // For headlines
    normal: '1.5',    // For body text
    relaxed: '1.75'   // For descriptions
  }
};

// CSS Custom Properties for typography
export const typographyCustomProperties = {
  '--font-family-display': typographyTokens.fontFamily.display.join(', '),
  '--font-family-body': typographyTokens.fontFamily.body.join(', '),
  
  '--font-size-xs': typographyTokens.fontSize.xs,
  '--font-size-sm': typographyTokens.fontSize.sm,
  '--font-size-base': typographyTokens.fontSize.base,
  '--font-size-lg': typographyTokens.fontSize.lg,
  '--font-size-xl': typographyTokens.fontSize.xl,
  '--font-size-2xl': typographyTokens.fontSize['2xl'],
  '--font-size-3xl': typographyTokens.fontSize['3xl'],
  
  '--font-weight-light': typographyTokens.fontWeight.light.toString(),
  '--font-weight-normal': typographyTokens.fontWeight.normal.toString(),
  '--font-weight-medium': typographyTokens.fontWeight.medium.toString(),
  '--font-weight-semibold': typographyTokens.fontWeight.semibold.toString(),
  '--font-weight-bold': typographyTokens.fontWeight.bold.toString(),
  
  '--line-height-tight': typographyTokens.lineHeight.tight,
  '--line-height-normal': typographyTokens.lineHeight.normal,
  '--line-height-relaxed': typographyTokens.lineHeight.relaxed,
};

// Tailwind CSS typography configuration
export const tailwindTypography = {
  fontFamily: {
    display: typographyTokens.fontFamily.display,
    body: typographyTokens.fontFamily.body,
    sans: typographyTokens.fontFamily.body, // Override default sans
  },
  
  fontSize: {
    xs: [typographyTokens.fontSize.xs, { lineHeight: typographyTokens.lineHeight.normal }],
    sm: [typographyTokens.fontSize.sm, { lineHeight: typographyTokens.lineHeight.normal }],
    base: [typographyTokens.fontSize.base, { lineHeight: typographyTokens.lineHeight.normal }],
    lg: [typographyTokens.fontSize.lg, { lineHeight: typographyTokens.lineHeight.normal }],
    xl: [typographyTokens.fontSize.xl, { lineHeight: typographyTokens.lineHeight.tight }],
    '2xl': [typographyTokens.fontSize['2xl'], { lineHeight: typographyTokens.lineHeight.tight }],
    '3xl': [typographyTokens.fontSize['3xl'], { lineHeight: typographyTokens.lineHeight.tight }],
  },
  
  fontWeight: {
    light: typographyTokens.fontWeight.light,
    normal: typographyTokens.fontWeight.normal,
    medium: typographyTokens.fontWeight.medium,
    semibold: typographyTokens.fontWeight.semibold,
    bold: typographyTokens.fontWeight.bold,
  },
  
  lineHeight: {
    tight: typographyTokens.lineHeight.tight,
    normal: typographyTokens.lineHeight.normal,
    relaxed: typographyTokens.lineHeight.relaxed,
  }
};

// Typography utility classes matching design references
export const typographyClasses = {
  // Headlines from design references
  'headline-large': 'text-3xl font-bold leading-tight tracking-tight', // Welcome page headline
  'headline-medium': 'text-2xl font-bold leading-tight tracking-tight', // Page titles
  'headline-small': 'text-xl font-bold leading-tight tracking-tight', // Section headers
  
  // Body text from design references
  'body-large': 'text-lg font-medium leading-normal', // Product names
  'body-medium': 'text-base font-normal leading-normal', // Default body
  'body-small': 'text-sm font-normal leading-normal', // Descriptions
  
  // Labels and captions
  'label-large': 'text-sm font-semibold leading-normal uppercase tracking-wider', // Status labels
  'label-medium': 'text-xs font-bold leading-normal uppercase tracking-wider', // Small labels
  'caption': 'text-xs font-medium leading-normal', // Timestamps, metadata
  
  // Interactive text
  'button-large': 'text-lg font-bold leading-normal tracking-wide', // Primary buttons
  'button-medium': 'text-base font-bold leading-normal', // Secondary buttons
  'button-small': 'text-sm font-bold leading-normal', // Small buttons
  
  // Voice UI specific
  'voice-command': 'text-lg font-bold leading-tight tracking-tight', // Voice command text
  'voice-status': 'text-sm font-semibold leading-normal', // Voice status indicators
};