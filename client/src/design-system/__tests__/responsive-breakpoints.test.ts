/**
 * Property Tests for Responsive Breakpoints
 * 
 * Tests that verify responsive design compliance across all breakpoints
 * and ensure consistent behavior at different viewport sizes.
 */

const fc = require('fast-check');
const { 
  breakpoints, 
  breakpointValues, 
  getCurrentBreakpoint, 
  matchesBreakpoint,
  getResponsiveValue,
  generateResponsiveClasses,
  getContainerClass,
  getResponsiveTypography,
  getResponsiveSpacing
} = require('../utils/responsive');

describe('Responsive Breakpoints Property Tests', () => {
  /**
   * Property 5: Responsive Design Compliance (Breakpoints)
   * Validates: Requirements 5.1, 5.2, 5.3, 5.4
   */
  describe('Property 5: Responsive Design Compliance (Breakpoints)', () => {
    it('should have consistent breakpoint values matching design references', () => {
      fc.assert(fc.property(
        fc.constantFrom('mobile', 'tablet', 'desktop', 'wide'),
        (breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide') => {
          const expectedValues: Record<string, string> = {
            mobile: '320px',
            tablet: '768px', 
            desktop: '1024px',
            wide: '1280px'
          };
          
          // **Validates: Requirements 5.1**
          expect(breakpoints[breakpoint]).toBe(expectedValues[breakpoint]);
          expect(breakpointValues[breakpoint]).toBe(parseInt(expectedValues[breakpoint]));
          
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should correctly identify current breakpoint for any viewport width', () => {
      fc.assert(fc.property(
        fc.integer({ min: 200, max: 2000 }),
        (viewportWidth: number) => {
          const currentBreakpoint = getCurrentBreakpoint(viewportWidth);
          
          // Verify breakpoint logic
          if (viewportWidth >= 1280) {
            expect(currentBreakpoint).toBe('wide');
          } else if (viewportWidth >= 1024) {
            expect(currentBreakpoint).toBe('desktop');
          } else if (viewportWidth >= 768) {
            expect(currentBreakpoint).toBe('tablet');
          } else {
            expect(currentBreakpoint).toBe('mobile');
          }
          
          // **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
          return ['mobile', 'tablet', 'desktop', 'wide'].includes(currentBreakpoint);
        }
      ), { numRuns: 100 });
    });

    it('should correctly match breakpoint ranges for any viewport width', () => {
      fc.assert(fc.property(
        fc.integer({ min: 200, max: 2000 }),
        fc.constantFrom('mobile', 'tablet', 'desktop', 'wide'),
        (viewportWidth: number, breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide') => {
          const matches = matchesBreakpoint(breakpoint, viewportWidth);
          
          // Verify range matching logic
          switch (breakpoint) {
            case 'mobile':
              expect(matches).toBe(viewportWidth >= 320 && viewportWidth < 768);
              break;
            case 'tablet':
              expect(matches).toBe(viewportWidth >= 768 && viewportWidth < 1024);
              break;
            case 'desktop':
              expect(matches).toBe(viewportWidth >= 1024 && viewportWidth < 1280);
              break;
            case 'wide':
              expect(matches).toBe(viewportWidth >= 1280);
              break;
          }
          
          // **Validates: Requirements 5.2, 5.3, 5.4**
          return typeof matches === 'boolean';
        }
      ), { numRuns: 100 });
    });

    it('should generate correct responsive classes for any value combination', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.record({
          mobile: fc.option(fc.string({ minLength: 1, maxLength: 10 })),
          tablet: fc.option(fc.string({ minLength: 1, maxLength: 10 })),
          desktop: fc.option(fc.string({ minLength: 1, maxLength: 10 })),
          wide: fc.option(fc.string({ minLength: 1, maxLength: 10 }))
        }),
        (baseClass: string, values: any) => {
          const classes = generateResponsiveClasses(baseClass, values);
          
          // Verify mobile-first approach (no prefix for mobile)
          if (values.mobile) {
            expect(classes).toContain(`${baseClass}-${values.mobile}`);
            expect(classes).not.toContain(`sm:${baseClass}-${values.mobile}`);
          }
          
          // Verify prefixed classes for larger breakpoints
          if (values.tablet) {
            expect(classes).toContain(`md:${baseClass}-${values.tablet}`);
          }
          
          if (values.desktop) {
            expect(classes).toContain(`lg:${baseClass}-${values.desktop}`);
          }
          
          if (values.wide) {
            expect(classes).toContain(`xl:${baseClass}-${values.wide}`);
          }
          
          // **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
          return typeof classes === 'string';
        }
      ), { numRuns: 100 });
    });

    it('should resolve responsive values with proper fallback logic', () => {
      fc.assert(fc.property(
        fc.record({
          mobile: fc.option(fc.string()),
          tablet: fc.option(fc.string()),
          desktop: fc.option(fc.string()),
          wide: fc.option(fc.string())
        }),
        fc.constantFrom('mobile', 'tablet', 'desktop', 'wide'),
        (values: any, currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide') => {
          const resolvedValue = getResponsiveValue(values, currentBreakpoint);
          
          // If current breakpoint has a value, it should be returned
          if (values[currentBreakpoint] !== undefined) {
            expect(resolvedValue).toBe(values[currentBreakpoint]);
          } else {
            // Should fallback to smaller breakpoints
            const fallbackOrder = ['wide', 'desktop', 'tablet', 'mobile'];
            const currentIndex = fallbackOrder.indexOf(currentBreakpoint);
            
            let expectedValue = undefined;
            for (let i = currentIndex + 1; i < fallbackOrder.length; i++) {
              const fallbackKey = fallbackOrder[i];
              if (values[fallbackKey] !== undefined) {
                expectedValue = values[fallbackKey];
                break;
              }
            }
            
            expect(resolvedValue).toBe(expectedValue);
          }
          
          // **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
          return true;
        }
      ), { numRuns: 100 });
    });
  });

  describe('Container and Layout Utilities', () => {
    it('should generate correct container classes for all max-width options', () => {
      fc.assert(fc.property(
        fc.constantFrom('mobile', 'tablet', 'desktop', 'wide'),
        (maxWidth: 'mobile' | 'tablet' | 'desktop' | 'wide') => {
          const containerClass = getContainerClass(maxWidth);
          
          // Should contain max-width, centering, and responsive padding
          expect(containerClass).toContain('max-w-');
          expect(containerClass).toContain('mx-auto');
          expect(containerClass).toContain('px-');
          
          // Verify correct max-width values
          const expectedWidths: Record<string, string> = {
            mobile: '430px',
            tablet: '768px', 
            desktop: '1024px',
            wide: '1280px'
          };
          
          expect(containerClass).toContain(`max-w-[${expectedWidths[maxWidth]}]`);
          
          // **Validates: Requirements 5.2, 5.3, 5.4**
          return typeof containerClass === 'string' && containerClass.length > 0;
        }
      ), { numRuns: 100 });
    });

    it('should generate responsive typography classes correctly', () => {
      fc.assert(fc.property(
        fc.constantFrom('headline', 'title', 'body', 'caption'),
        (variant: 'headline' | 'title' | 'body' | 'caption') => {
          const typographyClass = getResponsiveTypography(variant);
          
          // Should contain responsive text size classes
          expect(typographyClass).toMatch(/text-/);
          
          // Verify mobile-first approach
          const expectedMobileClasses: Record<string, string> = {
            headline: 'text-2xl',
            title: 'text-xl', 
            body: 'text-base',
            caption: 'text-sm'
          };
          
          expect(typographyClass).toContain(expectedMobileClasses[variant]);
          
          // **Validates: Requirements 5.6**
          return typeof typographyClass === 'string' && typographyClass.length > 0;
        }
      ), { numRuns: 100 });
    });

    it('should generate responsive spacing classes correctly', () => {
      fc.assert(fc.property(
        fc.constantFrom('section', 'component', 'element'),
        fc.constantFrom('p', 'm', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'mx', 'my', 'mt', 'mb', 'ml', 'mr'),
        (variant: 'section' | 'component' | 'element', property: string) => {
          const spacingClass = getResponsiveSpacing(variant, property as any);
          
          // Should contain the specified property prefix
          expect(spacingClass).toContain(`${property}-`);
          
          // Should contain responsive prefixes for larger breakpoints
          if (spacingClass.includes('md:')) {
            expect(spacingClass).toMatch(/md:[a-z]+-\d+/);
          }
          
          if (spacingClass.includes('lg:')) {
            expect(spacingClass).toMatch(/lg:[a-z]+-\d+/);
          }
          
          // **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
          return typeof spacingClass === 'string' && spacingClass.length > 0;
        }
      ), { numRuns: 100 });
    });
  });

  describe('Breakpoint Consistency', () => {
    it('should maintain consistent ordering across all breakpoint utilities', () => {
      fc.assert(fc.property(
        fc.constant(true),
        () => {
          // Verify breakpoint values are in ascending order
          expect(breakpointValues.mobile).toBeLessThan(breakpointValues.tablet);
          expect(breakpointValues.tablet).toBeLessThan(breakpointValues.desktop);
          expect(breakpointValues.desktop).toBeLessThan(breakpointValues.wide);
          
          // Verify no gaps or overlaps in breakpoint ranges
          const testWidths = [319, 320, 767, 768, 1023, 1024, 1279, 1280];
          
          testWidths.forEach(width => {
            const breakpoint = getCurrentBreakpoint(width);
            expect(['mobile', 'tablet', 'desktop', 'wide']).toContain(breakpoint);
          });
          
          // **Validates: Requirements 5.1**
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should handle edge cases at breakpoint boundaries', () => {
      fc.assert(fc.property(
        fc.constantFrom(319, 320, 767, 768, 1023, 1024, 1279, 1280),
        (boundaryWidth: number) => {
          const breakpoint = getCurrentBreakpoint(boundaryWidth);
          
          // Test specific boundary conditions
          if (boundaryWidth === 319) expect(breakpoint).toBe('mobile');
          if (boundaryWidth === 320) expect(breakpoint).toBe('mobile');
          if (boundaryWidth === 767) expect(breakpoint).toBe('mobile');
          if (boundaryWidth === 768) expect(breakpoint).toBe('tablet');
          if (boundaryWidth === 1023) expect(breakpoint).toBe('tablet');
          if (boundaryWidth === 1024) expect(breakpoint).toBe('desktop');
          if (boundaryWidth === 1279) expect(breakpoint).toBe('desktop');
          if (boundaryWidth === 1280) expect(breakpoint).toBe('wide');
          
          // **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
          return true;
        }
      ), { numRuns: 100 });
    });
  });
});

// Tag: Feature: frontend-design-system-consistency, Property 5: Responsive Design Compliance (Breakpoints)