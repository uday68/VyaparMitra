/**
 * Responsive Design Utilities
 * 
 * Utilities for handling responsive design patterns and breakpoints
 */

import { BreakpointConfig, ResponsiveValue } from '../types';

// Breakpoints from design references
export const breakpoints: BreakpointConfig = {
  mobile: '320px',   // Mobile-first
  tablet: '768px',   // Tablet
  desktop: '1024px', // Desktop
  wide: '1280px'     // Wide screens
};

// Breakpoint values as numbers for calculations
export const breakpointValues = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1280
} as const;

/**
 * Get responsive value based on current breakpoint
 */
export function getResponsiveValue<T>(
  value: ResponsiveValue<T>,
  currentBreakpoint: keyof BreakpointConfig
): T | undefined {
  // Return the most specific value available
  if (value[currentBreakpoint] !== undefined) {
    return value[currentBreakpoint];
  }
  
  // Fallback to smaller breakpoints
  const fallbackOrder: (keyof BreakpointConfig)[] = ['wide', 'desktop', 'tablet', 'mobile'];
  const currentIndex = fallbackOrder.indexOf(currentBreakpoint);
  
  for (let i = currentIndex + 1; i < fallbackOrder.length; i++) {
    const fallbackKey = fallbackOrder[i];
    if (value[fallbackKey] !== undefined) {
      return value[fallbackKey];
    }
  }
  
  return undefined;
}

/**
 * Generate responsive CSS classes
 */
export function generateResponsiveClasses(
  baseClass: string,
  values: ResponsiveValue<string>
): string {
  const classes: string[] = [];
  
  // Add mobile-first (no prefix)
  if (values.mobile) {
    classes.push(`${baseClass}-${values.mobile}`);
  }
  
  // Add prefixed classes for larger breakpoints
  if (values.tablet) {
    classes.push(`md:${baseClass}-${values.tablet}`);
  }
  
  if (values.desktop) {
    classes.push(`lg:${baseClass}-${values.desktop}`);
  }
  
  if (values.wide) {
    classes.push(`xl:${baseClass}-${values.wide}`);
  }
  
  return classes.join(' ');
}

/**
 * Check if current viewport matches breakpoint
 */
export function matchesBreakpoint(
  breakpoint: keyof BreakpointConfig,
  viewportWidth: number
): boolean {
  const minWidth = breakpointValues[breakpoint];
  
  switch (breakpoint) {
    case 'mobile':
      return viewportWidth >= minWidth && viewportWidth < breakpointValues.tablet;
    case 'tablet':
      return viewportWidth >= minWidth && viewportWidth < breakpointValues.desktop;
    case 'desktop':
      return viewportWidth >= minWidth && viewportWidth < breakpointValues.wide;
    case 'wide':
      return viewportWidth >= minWidth;
    default:
      return false;
  }
}

/**
 * Get current breakpoint based on viewport width
 */
export function getCurrentBreakpoint(viewportWidth: number): keyof BreakpointConfig {
  if (viewportWidth >= breakpointValues.wide) return 'wide';
  if (viewportWidth >= breakpointValues.desktop) return 'desktop';
  if (viewportWidth >= breakpointValues.tablet) return 'tablet';
  return 'mobile';
}

/**
 * Touch target utilities for accessibility
 */
export const touchTargets = {
  minimum: 44,      // WCAG minimum (44px)
  comfortable: 48,  // Comfortable size
  large: 56         // Large touch target
} as const;

/**
 * Validate touch target size
 */
export function validateTouchTarget(
  width: number,
  height: number,
  level: 'minimum' | 'comfortable' | 'large' = 'minimum'
): boolean {
  const required = touchTargets[level];
  return width >= required && height >= required;
}

/**
 * Container size utilities
 */
export const containerSizes = {
  mobile: 430,    // Max mobile width from design references
  tablet: 768,    // Tablet container
  desktop: 1024,  // Desktop container
  wide: 1280      // Wide container
} as const;

/**
 * Generate container classes
 */
export function getContainerClass(
  maxWidth: keyof typeof containerSizes = 'desktop'
): string {
  const width = containerSizes[maxWidth];
  return `max-w-[${width}px] mx-auto px-4 md:px-6 lg:px-8`;
}

/**
 * Responsive typography scale
 */
export const responsiveTypography = {
  headline: {
    mobile: 'text-2xl',
    tablet: 'text-3xl',
    desktop: 'text-4xl'
  },
  title: {
    mobile: 'text-xl',
    tablet: 'text-2xl',
    desktop: 'text-3xl'
  },
  body: {
    mobile: 'text-base',
    tablet: 'text-lg',
    desktop: 'text-lg'
  },
  caption: {
    mobile: 'text-sm',
    tablet: 'text-sm',
    desktop: 'text-base'
  }
} as const;

/**
 * Get responsive typography classes
 */
export function getResponsiveTypography(
  variant: keyof typeof responsiveTypography
): string {
  const values = responsiveTypography[variant];
  return generateResponsiveClasses('', values);
}

/**
 * Responsive spacing utilities
 */
export const responsiveSpacing = {
  section: {
    mobile: '8',
    tablet: '12',
    desktop: '16'
  },
  component: {
    mobile: '4',
    tablet: '6',
    desktop: '8'
  },
  element: {
    mobile: '2',
    tablet: '3',
    desktop: '4'
  }
} as const;

/**
 * Get responsive spacing classes
 */
export function getResponsiveSpacing(
  variant: keyof typeof responsiveSpacing,
  property: 'p' | 'm' | 'px' | 'py' | 'pt' | 'pb' | 'pl' | 'pr' | 'mx' | 'my' | 'mt' | 'mb' | 'ml' | 'mr' = 'p'
): string {
  const values = responsiveSpacing[variant];
  return generateResponsiveClasses(property, values);
}