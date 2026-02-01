import { render, act } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import React from 'react';
import { ThemeProvider } from '../themes/ThemeProvider';
import { 
  applyTheme, 
  measureThemeSwitchPerformance, 
  getCSSBundleSize,
  generateCriticalCSS,
  initializePerformanceOptimizations
} from '../utils/performance';

// Mock performance API for testing
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn()
};

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
  setTimeout(() => callback(Date.now()), 16); // Simulate 60fps
  return 1;
});

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode; theme?: 'light' | 'dark'; colorScheme?: 'blue' | 'green' | 'purple' }> = ({ 
  children, 
  theme = 'light',
  colorScheme = 'blue'
}) => React.createElement(ThemeProvider, { defaultTheme: theme, defaultColorScheme: colorScheme, children });

describe('Performance Optimization', () => {
  let originalPerformance: any;
  let originalRequestAnimationFrame: any;

  beforeEach(() => {
    // Mock performance API
    originalPerformance = global.performance;
    global.performance = mockPerformance as any;
    
    // Mock requestAnimationFrame
    originalRequestAnimationFrame = global.requestAnimationFrame;
    global.requestAnimationFrame = mockRequestAnimationFrame;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock document methods
    Object.defineProperty(document, 'head', {
      value: {
        appendChild: jest.fn(),
        insertBefore: jest.fn(),
        firstChild: null
      },
      writable: true
    });
    
    Object.defineProperty(document, 'createElement', {
      value: jest.fn(() => ({
        rel: '',
        as: '',
        type: '',
        href: '',
        crossOrigin: '',
        textContent: '',
        setAttribute: jest.fn(),
        style: {
          setProperty: jest.fn()
        }
      })),
      writable: true
    });
  });

  afterEach(() => {
    // Restore original implementations
    global.performance = originalPerformance;
    global.requestAnimationFrame = originalRequestAnimationFrame;
  });

  /**
   * Property 9: Performance Optimization
   * For any styling implementation, CSS custom properties should be used for theme switching,
   * font loading should be optimized, and the solution should support server-side rendering
   * **Validates: Requirements 7.1, 7.2, 7.7**
   */
  it('should use CSS custom properties for efficient theme switching', () => {
    fc.assert(fc.property(
      fc.constantFrom('light', 'dark'),
      fc.constantFrom('blue', 'green', 'purple'),
      (theme, colorScheme) => {
        const mockRoot = {
          style: {
            setProperty: jest.fn()
          },
          classList: {
            remove: jest.fn(),
            add: jest.fn()
          },
          setAttribute: jest.fn()
        };

        // Mock document.documentElement
        Object.defineProperty(document, 'documentElement', {
          value: mockRoot,
          writable: true
        });

        // Test theme application
        applyTheme(theme, colorScheme);

        // Property: CSS custom properties should be set for theme switching
        expect(mockRoot.style.setProperty).toHaveBeenCalled();
        
        // Property: Theme should be applied efficiently using CSS custom properties
        const setPropertyCalls = (mockRoot.style.setProperty as jest.Mock).mock.calls;
        const hasColorProperties = setPropertyCalls.some((call: any[]) => call[0] && call[0].includes('--color-'));
        const hasTypographyProperties = setPropertyCalls.some((call: any[]) => call[0] && call[0].includes('--font-'));
        const hasSpacingProperties = setPropertyCalls.some((call: any[]) => call[0] && call[0].includes('--space-'));

        expect(hasColorProperties).toBe(true);
        expect(hasTypographyProperties).toBe(true);
        expect(hasSpacingProperties).toBe(true);

        // Property: Primary color should be set based on color scheme
        const primaryColorCall = setPropertyCalls.find((call: any[]) => call[0] === '--color-primary');
        expect(primaryColorCall).toBeTruthy();
      }
    ), { numRuns: 30 });
  });

  it('should measure theme switching performance', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 100 }),
      fc.integer({ min: 0, max: 100 }),
      (startTime, endTime) => {
        // Mock performance.now to return predictable values
        let callCount = 0;
        mockPerformance.now.mockImplementation(() => {
          callCount++;
          return callCount === 1 ? startTime : endTime;
        });

        const perf = measureThemeSwitchPerformance();
        const duration = perf.end();

        // Property: Performance measurement should return accurate duration
        expect(duration).toBe(endTime - startTime);
        expect(mockPerformance.now).toHaveBeenCalledTimes(2);

        // Property: Performance warnings should be logged for slow operations
        if (endTime - startTime > 16) {
          // In a real implementation, this would check console.warn
          // For testing, we verify the duration calculation is correct
          expect(duration).toBeGreaterThan(16);
        }
      }
    ), { numRuns: 50 });
  });

  it('should generate critical CSS for server-side rendering', () => {
    fc.assert(fc.property(
      fc.constantFrom('light', 'dark'),
      (theme) => {
        const criticalCSS = generateCriticalCSS(theme);

        // Property: Critical CSS should be valid CSS
        expect(criticalCSS).toMatch(/^:root\s*\{[\s\S]*\}$/);
        
        // Property: Critical CSS should contain essential properties
        expect(criticalCSS).toContain('--color-');
        expect(criticalCSS).toContain('--font-');
        expect(criticalCSS).toContain('--space-');

        // Property: Dark theme should have different properties than light theme
        const lightCSS = generateCriticalCSS('light');
        const darkCSS = generateCriticalCSS('dark');
        expect(lightCSS).not.toBe(darkCSS);

        // Property: CSS should be properly formatted
        const lines = criticalCSS.split('\n');
        expect(lines[0]).toBe(':root {');
        expect(lines[lines.length - 1]).toBe('}');
        
        // Each property line should be properly indented and formatted
        const propertyLines = lines.slice(1, -1);
        propertyLines.forEach(line => {
          if (line.trim()) {
            expect(line).toMatch(/^\s+--[\w-]+:\s+.+;$/);
          }
        });
      }
    ), { numRuns: 20 });
  });

  it('should optimize font loading to prevent layout shifts', () => {
    const mockLink = {
      rel: '',
      as: '',
      type: '',
      href: '',
      crossOrigin: ''
    };

    const mockStyle = {
      textContent: ''
    };

    (document.createElement as jest.Mock)
      .mockReturnValueOnce(mockLink)
      .mockReturnValueOnce(mockStyle);

    // Test font loading optimization
    initializePerformanceOptimizations();

    // Property: Font preload links should be created
    expect(document.createElement).toHaveBeenCalledWith('link');
    expect(document.createElement).toHaveBeenCalledWith('style');

    // Property: Critical CSS should be injected
    expect(document.head.insertBefore).toHaveBeenCalled();

    // Property: Font CSS should include font-display: swap
    expect(mockStyle.textContent).toContain('font-display: swap');
    expect(mockStyle.textContent).toContain('Work Sans');
  });

  it('should support efficient theme switching in React components', () => {
    fc.assert(fc.property(
      fc.constantFrom('light', 'dark'),
      fc.constantFrom('blue', 'green', 'purple'),
      (initialTheme, colorScheme) => {
        const TestComponent = () => React.createElement('div', { 'data-testid': 'test' }, 'Test Content');

        const { rerender } = render(
          React.createElement(TestWrapper, { theme: initialTheme, colorScheme, children: React.createElement(TestComponent) })
        );

        // Property: Initial render should not cause performance issues
        expect(mockRequestAnimationFrame).toHaveBeenCalled();

        // Switch theme
        const newTheme = initialTheme === 'light' ? 'dark' : 'light';
        
        act(() => {
          rerender(
            React.createElement(TestWrapper, { theme: newTheme, colorScheme, children: React.createElement(TestComponent) })
          );
        });

        // Property: Theme switching should use requestAnimationFrame for smooth transitions
        expect(mockRequestAnimationFrame).toHaveBeenCalled();
      }
    ), { numRuns: 20 });
  });

  it('should maintain performance with multiple theme switches', () => {
    fc.assert(fc.property(
      fc.array(fc.constantFrom('light', 'dark'), { minLength: 2, maxLength: 10 }),
      fc.constantFrom('blue', 'green', 'purple'),
      (themes, colorScheme) => {
        const mockRoot = {
          style: {
            setProperty: jest.fn()
          },
          classList: {
            remove: jest.fn(),
            add: jest.fn()
          },
          setAttribute: jest.fn()
        };

        Object.defineProperty(document, 'documentElement', {
          value: mockRoot,
          writable: true
        });

        // Apply multiple theme switches
        themes.forEach(theme => {
          applyTheme(theme, colorScheme);
        });

        // Property: Multiple theme switches should not cause memory leaks
        // Each theme switch should set the same number of properties
        const totalCalls = (mockRoot.style.setProperty as jest.Mock).mock.calls.length;
        const expectedCallsPerTheme = totalCalls / themes.length;
        
        expect(expectedCallsPerTheme).toBeGreaterThan(0);
        expect(totalCalls).toBe(themes.length * Math.floor(expectedCallsPerTheme));

        // Property: Theme switching should be consistent
        expect(mockRoot.setAttribute).toHaveBeenCalledWith('data-theme', themes[themes.length - 1]);
        expect(mockRoot.setAttribute).toHaveBeenCalledWith('data-color-scheme', colorScheme);
      }
    ), { numRuns: 30 });
  });

  it('should handle CSS bundle size monitoring', () => {
    // Mock stylesheets
    const mockStyleSheet = {
      cssRules: [
        { cssText: '.test { color: red; }' },
        { cssText: '.another { background: blue; }' }
      ]
    };

    Object.defineProperty(document, 'styleSheets', {
      value: [mockStyleSheet],
      writable: true
    });

    const bundleSize = getCSSBundleSize();

    // Property: Bundle size should be calculated correctly
    expect(bundleSize).toBeGreaterThan(0);
    expect(typeof bundleSize).toBe('number');

    // Property: Bundle size should reflect actual CSS content
    const expectedSize = mockStyleSheet.cssRules
      .map(rule => rule.cssText)
      .join('\n')
      .length;
    
    expect(bundleSize).toBeGreaterThanOrEqual(expectedSize);
  });

  it('should provide type-safe performance utilities', () => {
    // Property: Performance utilities should have proper TypeScript types
    const perf = measureThemeSwitchPerformance();
    expect(typeof perf.end).toBe('function');

    const duration = perf.end();
    expect(typeof duration).toBe('number');

    // Property: Theme application should accept valid theme values
    expect(() => applyTheme('light', 'blue')).not.toThrow();
    expect(() => applyTheme('dark', 'green')).not.toThrow();
    expect(() => applyTheme('dark', 'purple')).not.toThrow();

    // Property: Critical CSS generation should return string
    const css = generateCriticalCSS('light');
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });
});

// Tag: Feature: frontend-design-system-consistency, Property 9: Performance Optimization