/**
 * WCAG 2.1 Contrast Utilities
 * 
 * Utilities for calculating and validating color contrast ratios
 * according to WCAG 2.1 AA standards.
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid hex color format');
  }
  
  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * WCAG 2.1 AA compliance levels
 */
export const WCAG_AA_STANDARDS = {
  NORMAL_TEXT: 4.5,      // Normal text (< 18pt or < 14pt bold)
  LARGE_TEXT: 3.0,       // Large text (≥ 18pt or ≥ 14pt bold)
  UI_COMPONENTS: 3.0,    // UI components and graphical objects
  ENHANCED: 7.0          // AAA level (enhanced contrast)
} as const;

/**
 * Check if contrast ratio meets WCAG 2.1 AA standards
 */
export function meetsWCAGAA(
  foreground: string, 
  background: string, 
  level: 'normal' | 'large' | 'ui' | 'enhanced' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const required = WCAG_AA_STANDARDS[
    level === 'normal' ? 'NORMAL_TEXT' :
    level === 'large' ? 'LARGE_TEXT' :
    level === 'ui' ? 'UI_COMPONENTS' :
    'ENHANCED'
  ];
  
  return ratio >= required;
}

/**
 * Get contrast compliance report for a color combination
 */
export interface ContrastReport {
  ratio: number;
  normalText: boolean;
  largeText: boolean;
  uiComponents: boolean;
  enhanced: boolean;
  grade: 'AAA' | 'AA' | 'FAIL';
}

export function getContrastReport(foreground: string, background: string): ContrastReport {
  const ratio = getContrastRatio(foreground, background);
  
  const normalText = ratio >= WCAG_AA_STANDARDS.NORMAL_TEXT;
  const largeText = ratio >= WCAG_AA_STANDARDS.LARGE_TEXT;
  const uiComponents = ratio >= WCAG_AA_STANDARDS.UI_COMPONENTS;
  const enhanced = ratio >= WCAG_AA_STANDARDS.ENHANCED;
  
  const grade = enhanced ? 'AAA' : (normalText ? 'AA' : 'FAIL');
  
  return {
    ratio,
    normalText,
    largeText,
    uiComponents,
    enhanced,
    grade
  };
}

/**
 * Validate all color combinations in a theme for WCAG compliance
 */
export interface ThemeContrastValidation {
  valid: boolean;
  violations: Array<{
    foreground: string;
    background: string;
    ratio: number;
    required: number;
    context: string;
  }>;
  warnings: Array<{
    foreground: string;
    background: string;
    ratio: number;
    context: string;
  }>;
}

export function validateThemeContrast(theme: {
  colors: {
    primary: Record<string, string>;
    semantic: Record<string, string>;
    neutral: Record<string, string>;
  };
}, themeProperties: Record<string, string>): ThemeContrastValidation {
  const violations: ThemeContrastValidation['violations'] = [];
  const warnings: ThemeContrastValidation['warnings'] = [];
  
  // Get background colors
  const backgroundColor = themeProperties['--color-background'];
  const cardBackground = themeProperties['--color-card'];
  const mutedBackground = themeProperties['--color-muted'];
  
  // Get foreground colors
  const foregroundColor = themeProperties['--color-foreground'];
  const mutedForeground = themeProperties['--color-muted-foreground'];
  
  // Test primary text on backgrounds
  const textCombinations = [
    { fg: foregroundColor, bg: backgroundColor, context: 'Primary text on background' },
    { fg: foregroundColor, bg: cardBackground, context: 'Primary text on card' },
    { fg: mutedForeground, bg: backgroundColor, context: 'Muted text on background' },
    { fg: mutedForeground, bg: cardBackground, context: 'Muted text on card' },
  ];
  
  textCombinations.forEach(({ fg, bg, context }) => {
    if (fg && bg) {
      try {
        const ratio = getContrastRatio(fg, bg);
        
        if (ratio < WCAG_AA_STANDARDS.NORMAL_TEXT) {
          violations.push({
            foreground: fg,
            background: bg,
            ratio,
            required: WCAG_AA_STANDARDS.NORMAL_TEXT,
            context
          });
        } else if (ratio < WCAG_AA_STANDARDS.ENHANCED) {
          warnings.push({
            foreground: fg,
            background: bg,
            ratio,
            context: `${context} (could be enhanced)`
          });
        }
      } catch (error) {
        // Skip invalid color combinations
      }
    }
  });
  
  // Test primary colors on backgrounds
  Object.entries(theme.colors.primary).forEach(([name, color]) => {
    const primaryForeground = themeProperties['--color-primary-foreground'];
    if (primaryForeground) {
      try {
        const ratio = getContrastRatio(primaryForeground, color);
        
        if (ratio < WCAG_AA_STANDARDS.NORMAL_TEXT) {
          violations.push({
            foreground: primaryForeground,
            background: color,
            ratio,
            required: WCAG_AA_STANDARDS.NORMAL_TEXT,
            context: `Primary foreground on ${name} background`
          });
        }
      } catch (error) {
        // Skip invalid color combinations
      }
    }
  });
  
  // Test semantic colors
  Object.entries(theme.colors.semantic).forEach(([name, color]) => {
    const semanticForeground = themeProperties[`--color-${name}-foreground`];
    if (semanticForeground) {
      try {
        const ratio = getContrastRatio(semanticForeground, color);
        
        if (ratio < WCAG_AA_STANDARDS.NORMAL_TEXT) {
          violations.push({
            foreground: semanticForeground,
            background: color,
            ratio,
            required: WCAG_AA_STANDARDS.NORMAL_TEXT,
            context: `${name} foreground on ${name} background`
          });
        }
      } catch (error) {
        // Skip invalid color combinations
      }
    }
  });
  
  return {
    valid: violations.length === 0,
    violations,
    warnings
  };
}

/**
 * Suggest accessible color alternatives
 */
export function suggestAccessibleColor(
  targetColor: string,
  backgroundColor: string,
  targetRatio: number = WCAG_AA_STANDARDS.NORMAL_TEXT
): string | null {
  const bgRgb = hexToRgb(backgroundColor);
  const targetRgb = hexToRgb(targetColor);
  
  if (!bgRgb || !targetRgb) return null;
  
  const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Try darkening or lightening the target color
  for (let adjustment = 0; adjustment <= 100; adjustment += 5) {
    // Try darkening
    const darkerRgb = {
      r: Math.max(0, targetRgb.r - adjustment * 2.55),
      g: Math.max(0, targetRgb.g - adjustment * 2.55),
      b: Math.max(0, targetRgb.b - adjustment * 2.55)
    };
    
    const darkerLuminance = getRelativeLuminance(darkerRgb.r, darkerRgb.g, darkerRgb.b);
    const darkerRatio = (Math.max(bgLuminance, darkerLuminance) + 0.05) / 
                       (Math.min(bgLuminance, darkerLuminance) + 0.05);
    
    if (darkerRatio >= targetRatio) {
      return `#${Math.round(darkerRgb.r).toString(16).padStart(2, '0')}${Math.round(darkerRgb.g).toString(16).padStart(2, '0')}${Math.round(darkerRgb.b).toString(16).padStart(2, '0')}`;
    }
    
    // Try lightening
    const lighterRgb = {
      r: Math.min(255, targetRgb.r + adjustment * 2.55),
      g: Math.min(255, targetRgb.g + adjustment * 2.55),
      b: Math.min(255, targetRgb.b + adjustment * 2.55)
    };
    
    const lighterLuminance = getRelativeLuminance(lighterRgb.r, lighterRgb.g, lighterRgb.b);
    const lighterRatio = (Math.max(bgLuminance, lighterLuminance) + 0.05) / 
                        (Math.min(bgLuminance, lighterLuminance) + 0.05);
    
    if (lighterRatio >= targetRatio) {
      return `#${Math.round(lighterRgb.r).toString(16).padStart(2, '0')}${Math.round(lighterRgb.g).toString(16).padStart(2, '0')}${Math.round(lighterRgb.b).toString(16).padStart(2, '0')}`;
    }
  }
  
  return null;
}