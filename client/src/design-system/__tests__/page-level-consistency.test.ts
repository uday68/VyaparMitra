import { render } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import React from 'react';
import { ThemeProvider } from '../themes/ThemeProvider';

// Import all page components for testing
import Home from '../../pages/Home';
import { Login } from '../../pages/Login';
import { SignUp } from '../../pages/SignUp';
import VoiceSettings from '../../pages/VoiceSettings';
import { VoiceSettingsPage } from '../../pages/VoiceSettingsPage';
import VoiceCustomization from '../../pages/VoiceCustomization';
import HandsFreeSettings from '../../pages/HandsFreeSettings';
import { WelcomeLanguageSelection } from '../../pages/WelcomeLanguageSelection';
import { CustomerShop } from '../../pages/CustomerShop';

// Mock dependencies
jest.mock('wouter', () => ({
  useLocation: () => ['/test', jest.fn()],
  Link: ({ children, href }: any) => React.createElement('a', { href }, children)
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
    language: 'en',
    changeLanguage: jest.fn(),
    supportedLanguages: {
      en: { name: 'English', nativeName: 'English' },
      hi: { name: 'Hindi', nativeName: 'हिन्दी' }
    }
  })
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isLoading: false
  })
}));

jest.mock('../../hooks/use-products', () => ({
  useProducts: () => ({
    data: [],
    isLoading: false
  })
}));

jest.mock('../../hooks/use-negotiations', () => ({
  useCreateNegotiation: () => ({
    mutateAsync: jest.fn(),
    isPending: false
  })
}));

// Test wrapper with theme provider
const TestWrapper: React.FC<{ children: React.ReactNode; theme?: 'light' | 'dark'; colorScheme?: 'blue' | 'green' | 'purple' }> = ({ 
  children, 
  theme = 'light',
  colorScheme = 'blue'
}) => React.createElement(ThemeProvider, { defaultTheme: theme, defaultColorScheme: colorScheme, children });

// Page components that have been updated with design system
const updatedPageComponents = [
  { name: 'Home', component: Home },
  { name: 'Login', component: Login },
  { name: 'SignUp', component: SignUp },
  { name: 'VoiceSettings', component: VoiceSettings },
  { name: 'VoiceSettingsPage', component: VoiceSettingsPage },
  { name: 'VoiceCustomization', component: VoiceCustomization },
  { name: 'HandsFreeSettings', component: HandsFreeSettings },
  { name: 'WelcomeLanguageSelection', component: WelcomeLanguageSelection },
  { name: 'CustomerShop', component: CustomerShop }
];

describe('Page-Level Style Consistency', () => {
  /**
   * Property 4: Page-Level Style Consistency
   * For any page in the application, the styling should use design tokens consistently 
   * and follow the appropriate color scheme and layout patterns for its page type
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6, 4.7**
   */
  it('should use design tokens consistently across all pages', () => {
    fc.assert(fc.property(
      fc.constantFrom(...updatedPageComponents),
      fc.constantFrom('light', 'dark'),
      fc.constantFrom('blue', 'green', 'purple'),
      (pageInfo, theme, colorScheme) => {
        const { component: PageComponent, name: pageName } = pageInfo;
        
        // Render page with theme provider
        const { container } = render(
          React.createElement(TestWrapper, { theme, colorScheme, children: React.createElement(PageComponent) })
        );

        // Check that no hardcoded colors are used
        const htmlContent = container.innerHTML;
        
        // Should not contain hardcoded hex colors
        const hexColorPattern = /#[0-9a-fA-F]{3,6}/g;
        const hexMatches = htmlContent.match(hexColorPattern);
        
        // Allow some exceptions for specific cases (like gradients or brand colors)
        const allowedHexColors = ['#ffffff', '#000000', '#fff', '#000'];
        const invalidHexColors = hexMatches?.filter((color: string) => 
          !allowedHexColors.includes(color.toLowerCase())
        ) || [];

        // Should not contain hardcoded Tailwind bracket notation colors
        const bracketColorPattern = /(?:bg|text|border)-\[#[0-9a-fA-F]{3,6}\]/g;
        const bracketMatches = htmlContent.match(bracketColorPattern) || [];

        // Log violations for debugging
        if (invalidHexColors.length > 0 || bracketMatches.length > 0) {
          console.warn(`Page ${pageName} has hardcoded colors:`, {
            hexColors: invalidHexColors,
            bracketColors: bracketMatches
          });
        }

        // Property: Pages should use design tokens instead of hardcoded colors
        expect(invalidHexColors.length).toBe(0);
        expect(bracketMatches.length).toBe(0);

        // Check for consistent design token usage
        const hasDesignTokenClasses = [
          'text-foreground',
          'text-muted', 
          'bg-background',
          'bg-card-background',
          'border-border',
          'text-primary'
        ].some(className => htmlContent.includes(className));

        // Property: Pages should use design system classes
        expect(hasDesignTokenClasses).toBe(true);
      }
    ), { numRuns: 50 });
  });

  it('should have consistent header patterns across all pages', () => {
    fc.assert(fc.property(
      fc.constantFrom(...updatedPageComponents),
      fc.constantFrom('light', 'dark'),
      (pageInfo, theme) => {
        const { component: PageComponent } = pageInfo;
        
        const { container } = render(
          React.createElement(TestWrapper, { theme, children: React.createElement(PageComponent) })
        );

        // Check for header elements
        const headers = container.querySelectorAll('header, [role="banner"]');
        
        if (headers.length > 0) {
          const header = headers[0];
          const headerClasses = header.className;

          // Property: Headers should use consistent positioning and styling
          const hasConsistentHeaderStyling = [
            'sticky',
            'top-0',
            'z-',
            'bg-background',
            'border-b',
            'border-border'
          ].some(className => headerClasses.includes(className));

          expect(hasConsistentHeaderStyling).toBe(true);
        }
      }
    ), { numRuns: 30 });
  });

  it('should have consistent interactive element states', () => {
    fc.assert(fc.property(
      fc.constantFrom(...updatedPageComponents),
      fc.constantFrom('blue', 'green', 'purple'),
      (pageInfo, colorScheme) => {
        const { component: PageComponent } = pageInfo;
        
        const { container } = render(
          React.createElement(TestWrapper, { colorScheme, children: React.createElement(PageComponent) })
        );

        // Check for interactive elements (buttons, links, inputs)
        const interactiveElements = container.querySelectorAll(
          'button, a, input, select, textarea, [role="button"], [tabindex]'
        );

        let hasConsistentInteractiveStates = true;

        interactiveElements.forEach((element: Element) => {
          const classes = element.className;
          
          // Check for focus states
          const hasFocusState = classes.includes('focus:') || 
                               classes.includes('focus-visible:') ||
                               classes.includes('focus-within:');

          // Check for hover states on clickable elements
          const isClickable = element.tagName === 'BUTTON' || 
                             element.tagName === 'A' ||
                             element.getAttribute('role') === 'button';
          
          const hasHoverState = classes.includes('hover:') || !isClickable;

          if (isClickable && (!hasFocusState || !hasHoverState)) {
            hasConsistentInteractiveStates = false;
          }
        });

        // Property: Interactive elements should have consistent states
        expect(hasConsistentInteractiveStates).toBe(true);
      }
    ), { numRuns: 30 });
  });

  it('should follow appropriate color schemes for page types', () => {
    fc.assert(fc.property(
      fc.constantFrom(...updatedPageComponents),
      fc.constantFrom('blue', 'green', 'purple'),
      (pageInfo, colorScheme) => {
        const { component: PageComponent, name: pageName } = pageInfo;
        
        const { container } = render(
          React.createElement(TestWrapper, { colorScheme, children: React.createElement(PageComponent) })
        );

        const htmlContent = container.innerHTML;

        // Check that color scheme is applied consistently
        const hasColorSchemeClasses = [
          `text-primary-${colorScheme}`,
          `bg-primary-${colorScheme}`,
          `border-primary-${colorScheme}`,
          'text-primary',
          'bg-primary',
          'border-primary'
        ].some(className => htmlContent.includes(className));

        // Property: Pages should use appropriate color schemes
        expect(hasColorSchemeClasses).toBe(true);

        // Voice-related pages should have purple color scheme elements
        if (pageName.toLowerCase().includes('voice')) {
          const hasPurpleElements = htmlContent.includes('primary-purple') || 
                                   htmlContent.includes('text-primary') ||
                                   htmlContent.includes('bg-primary');
          expect(hasPurpleElements).toBe(true);
        }
      }
    ), { numRuns: 30 });
  });

  it('should have consistent loading states and error handling UI', () => {
    fc.assert(fc.property(
      fc.constantFrom(...updatedPageComponents),
      (pageInfo) => {
        const { component: PageComponent } = pageInfo;
        
        const { container } = render(
          React.createElement(TestWrapper, null,
            React.createElement(PageComponent)
          )
        );

        const htmlContent = container.innerHTML;

        // Check for loading indicators
        const hasLoadingStates = [
          'animate-spin',
          'animate-pulse',
          'loading',
          'isLoading',
          'isPending'
        ].some(pattern => htmlContent.includes(pattern));

        // Check for error handling elements
        const hasErrorHandling = [
          'error',
          'alert',
          'warning',
          'danger'
        ].some(pattern => htmlContent.toLowerCase().includes(pattern));

        // Property: Pages should have consistent loading and error states
        // Note: Not all pages will have loading states, so we check if they exist, they're consistent
        if (hasLoadingStates) {
          const hasConsistentLoadingUI = htmlContent.includes('animate-') || 
                                        htmlContent.includes('loading');
          expect(hasConsistentLoadingUI).toBe(true);
        }

        // Property: Error states should use semantic colors when present
        if (hasErrorHandling) {
          const hasSemanticErrorColors = htmlContent.includes('text-semantic-error') ||
                                         htmlContent.includes('bg-semantic-error') ||
                                         htmlContent.includes('text-error') ||
                                         htmlContent.includes('bg-error');
          expect(hasSemanticErrorColors).toBe(true);
        }
      }
    ), { numRuns: 30 });
  });

  it('should use consistent container widths and spacing', () => {
    fc.assert(fc.property(
      fc.constantFrom(...updatedPageComponents),
      (pageInfo) => {
        const { component: PageComponent } = pageInfo;
        
        const { container } = render(
          React.createElement(TestWrapper, null,
            React.createElement(PageComponent)
          )
        );

        // Check for container elements
        const containers = container.querySelectorAll('[class*="container"], [class*="max-w"], [class*="mx-auto"]');
        
        let hasConsistentContainers = true;

        containers.forEach((containerEl: Element) => {
          const classes = containerEl.className;
          
          // Check for consistent container patterns
          const hasProperContainer = classes.includes('max-w-') && classes.includes('mx-auto') ||
                                    classes.includes('container');
          
          if (!hasProperContainer) {
            hasConsistentContainers = false;
          }
        });

        // Property: Pages should use consistent container patterns
        expect(hasConsistentContainers).toBe(true);

        // Check for consistent spacing
        const htmlContent = container.innerHTML;
        const hasSpacingTokens = [
          'space-y-',
          'space-x-',
          'gap-',
          'p-',
          'px-',
          'py-',
          'm-',
          'mx-',
          'my-'
        ].some(spacing => htmlContent.includes(spacing));

        // Property: Pages should use spacing tokens
        expect(hasSpacingTokens).toBe(true);
      }
    ), { numRuns: 30 });
  });
});

// Tag: Feature: frontend-design-system-consistency, Property 4: Page-Level Style Consistency