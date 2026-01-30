/**
 * Design Token Utilities
 * 
 * Utilities for working with design tokens programmatically
 */

import { colorTokens } from '../tokens/colors';
import { typographyTokens } from '../tokens/typography';
import { spacingTokens } from '../tokens/spacing';
import { shadowTokens } from '../tokens/shadows';
import { animationTokens } from '../tokens/animations';

/**
 * Get all design tokens as a flat object
 */
export function getAllTokens() {
  return {
    colors: colorTokens,
    typography: typographyTokens,
    spacing: spacingTokens,
    shadows: shadowTokens,
    animations: animationTokens
  };
}

/**
 * Convert design tokens to CSS custom properties
 */
export function tokensToCustomProperties() {
  const properties: Record<string, string> = {};
  
  // Color tokens
  Object.entries(colorTokens.primary).forEach(([key, value]) => {
    properties[`--color-primary-${key}`] = value;
  });
  
  Object.entries(colorTokens.semantic).forEach(([key, value]) => {
    properties[`--color-semantic-${key}`] = value;
  });
  
  Object.entries(colorTokens.neutral).forEach(([key, value]) => {
    properties[`--color-neutral-${key}`] = value;
  });
  
  // Typography tokens
  properties['--font-family-display'] = typographyTokens.fontFamily.display.join(', ');
  properties['--font-family-body'] = typographyTokens.fontFamily.body.join(', ');
  
  Object.entries(typographyTokens.fontSize).forEach(([key, value]) => {
    properties[`--font-size-${key}`] = value;
  });
  
  Object.entries(typographyTokens.fontWeight).forEach(([key, value]) => {
    properties[`--font-weight-${key}`] = value.toString();
  });
  
  Object.entries(typographyTokens.lineHeight).forEach(([key, value]) => {
    properties[`--line-height-${key}`] = value;
  });
  
  // Spacing tokens
  Object.entries(spacingTokens.space).forEach(([key, value]) => {
    properties[`--space-${key}`] = value;
  });
  
  Object.entries(spacingTokens.borderRadius).forEach(([key, value]) => {
    properties[`--radius-${key}`] = value;
  });
  
  // Shadow tokens
  Object.entries(shadowTokens).forEach(([key, value]) => {
    properties[`--shadow-${key}`] = value;
  });
  
  // Animation tokens
  Object.entries(animationTokens.duration).forEach(([key, value]) => {
    properties[`--duration-${key}`] = value;
  });
  
  Object.entries(animationTokens.easing).forEach(([key, value]) => {
    properties[`--easing-${key}`] = value;
  });
  
  return properties;
}

/**
 * Generate CSS custom properties string
 */
export function generateCSSCustomProperties(): string {
  const properties = tokensToCustomProperties();
  
  return Object.entries(properties)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');
}

/**
 * Token validation utilities
 */
export function validateColorToken(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

export function validateSpacingToken(spacing: string): boolean {
  return /^\d+(\.\d+)?(px|rem|em)$/.test(spacing) || spacing === '0';
}

export function validateFontSizeToken(fontSize: string): boolean {
  return /^\d+(\.\d+)?(px|rem|em)$/.test(fontSize);
}

/**
 * Token conversion utilities
 */
export function remToPx(remValue: string, baseFontSize: number = 16): number {
  const numericValue = parseFloat(remValue.replace('rem', ''));
  return numericValue * baseFontSize;
}

export function pxToRem(pxValue: number, baseFontSize: number = 16): string {
  return `${pxValue / baseFontSize}rem`;
}

/**
 * Get token value by path
 */
export function getTokenValue(path: string): string | number | undefined {
  const tokens = getAllTokens();
  const pathParts = path.split('.');
  
  let current: any = tokens;
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Token documentation utilities
 */
export interface TokenDocumentation {
  name: string;
  value: string | number;
  category: string;
  description: string;
  usage: string[];
}

export function generateTokenDocumentation(): TokenDocumentation[] {
  const docs: TokenDocumentation[] = [];
  
  // Color tokens documentation
  Object.entries(colorTokens.primary).forEach(([key, value]) => {
    docs.push({
      name: `colors.primary.${key}`,
      value,
      category: 'Colors',
      description: `Primary ${key} color from design references`,
      usage: ['Buttons', 'Links', 'Brand elements']
    });
  });
  
  Object.entries(colorTokens.semantic).forEach(([key, value]) => {
    docs.push({
      name: `colors.semantic.${key}`,
      value,
      category: 'Colors',
      description: `Semantic ${key} color for UI states`,
      usage: ['Status indicators', 'Alerts', 'Feedback']
    });
  });
  
  // Typography tokens documentation
  Object.entries(typographyTokens.fontSize).forEach(([key, value]) => {
    docs.push({
      name: `typography.fontSize.${key}`,
      value,
      category: 'Typography',
      description: `Font size ${key} (${remToPx(value)}px)`,
      usage: ['Text elements', 'Headings', 'UI components']
    });
  });
  
  // Spacing tokens documentation
  Object.entries(spacingTokens.space).forEach(([key, value]) => {
    docs.push({
      name: `spacing.space.${key}`,
      value,
      category: 'Spacing',
      description: `Spacing unit ${key} (${remToPx(value)}px)`,
      usage: ['Margins', 'Padding', 'Gaps']
    });
  });
  
  return docs;
}

/**
 * Theme token utilities
 */
export function getThemeTokens(themeName: 'light' | 'dark') {
  // This would be expanded to return theme-specific token values
  return {
    name: themeName,
    tokens: getAllTokens()
  };
}

/**
 * Token consistency checking
 */
export function checkTokenConsistency(): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check color format consistency
  Object.entries(colorTokens.primary).forEach(([key, value]) => {
    if (!validateColorToken(value)) {
      issues.push(`Invalid color format for primary.${key}: ${value}`);
    }
  });
  
  Object.entries(colorTokens.semantic).forEach(([key, value]) => {
    if (!validateColorToken(value)) {
      issues.push(`Invalid color format for semantic.${key}: ${value}`);
    }
  });
  
  Object.entries(colorTokens.neutral).forEach(([key, value]) => {
    if (!validateColorToken(value)) {
      issues.push(`Invalid color format for neutral.${key}: ${value}`);
    }
  });
  
  // Check spacing format consistency
  Object.entries(spacingTokens.space).forEach(([key, value]) => {
    if (!validateSpacingToken(value)) {
      issues.push(`Invalid spacing format for space.${key}: ${value}`);
    }
  });
  
  Object.entries(spacingTokens.borderRadius).forEach(([key, value]) => {
    if (!validateSpacingToken(value) && value !== '9999px') {
      issues.push(`Invalid border radius format for borderRadius.${key}: ${value}`);
    }
  });
  
  // Check typography format consistency
  Object.entries(typographyTokens.fontSize).forEach(([key, value]) => {
    if (!validateFontSizeToken(value)) {
      issues.push(`Invalid font size format for fontSize.${key}: ${value}`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
}