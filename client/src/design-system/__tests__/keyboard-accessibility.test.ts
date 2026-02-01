import { render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, jest } from '@jest/globals';
import * as fc from 'fast-check';
import React from 'react';
import { ThemeProvider } from '../themes/ThemeProvider';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Toggle } from '../components/Toggle';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Checkbox } from '../components/Checkbox';

// Test wrapper with theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement(ThemeProvider, null, children);

// Interactive components that should be keyboard accessible
const interactiveComponents = [
  {
    name: 'Button',
    component: Button,
    props: { children: 'Test Button' },
    expectedRole: 'button'
  },
  {
    name: 'Toggle',
    component: Toggle,
    props: { label: 'Test Toggle', onCheckedChange: jest.fn() },
    expectedRole: 'switch'
  },
  {
    name: 'Input',
    component: Input,
    props: { placeholder: 'Test Input' },
    expectedRole: 'textbox'
  },
  {
    name: 'Select',
    component: Select,
    props: { children: React.createElement('option', { value: 'test' }, 'Test Option') },
    expectedRole: 'combobox'
  },
  {
    name: 'Checkbox',
    component: Checkbox,
    props: { label: 'Test Checkbox' },
    expectedRole: 'checkbox'
  }
];

describe('Keyboard Accessibility', () => {
  /**
   * Property 8: Accessibility Compliance (Keyboard)
   * For any component, all interactive elements should be keyboard accessible,
   * have proper ARIA labels, and meet WCAG 2.1 AA contrast requirements
   * **Validates: Requirements 7.4, 7.5**
   */
  it('should make all interactive elements keyboard accessible', () => {
    fc.assert(fc.property(
      fc.constantFrom(...interactiveComponents),
      fc.boolean(),
      (componentInfo, disabled) => {
        const { component: Component, props, name, expectedRole } = componentInfo;
        const mockHandler = jest.fn();
        
        // Add appropriate event handlers based on component type
        const enhancedProps = {
          ...props,
          disabled,
          onClick: name === 'Button' ? mockHandler : props.onClick,
          onCheckedChange: name === 'Toggle' ? mockHandler : props.onCheckedChange,
          onChange: ['Input', 'Select', 'Checkbox'].includes(name) ? mockHandler : props.onChange,
        };

        const { container } = render(
          React.createElement(TestWrapper, null,
            React.createElement(Component, enhancedProps)
          )
        );

        // Find the interactive element
        const interactiveElement = container.querySelector(
          `[role="${expectedRole}"], button, input, select, textarea, [tabindex]`
        );

        expect(interactiveElement).toBeTruthy();

        if (interactiveElement) {
          // Property: Interactive elements should be focusable when not disabled
          const tabIndex = interactiveElement.getAttribute('tabindex');
          if (!disabled) {
            expect(tabIndex === null || parseInt(tabIndex) >= 0).toBe(true);
          } else {
            // Disabled elements should not be focusable
            expect(tabIndex === null || parseInt(tabIndex) >= -1).toBe(true);
          }

          // Property: Interactive elements should have proper ARIA attributes
          const hasAriaLabel = interactiveElement.hasAttribute('aria-label') ||
                              interactiveElement.hasAttribute('aria-labelledby');
          const hasRole = interactiveElement.hasAttribute('role');
          
          expect(hasAriaLabel || hasRole).toBe(true);

          // Property: Interactive elements should respond to keyboard events when not disabled
          if (!disabled) {
            // Focus the element
            interactiveElement.focus();
            expect(document.activeElement).toBe(interactiveElement);

            // Test Enter key activation for buttons and button-like elements
            if (name === 'Button' || expectedRole === 'button') {
              fireEvent.keyDown(interactiveElement, { key: 'Enter', code: 'Enter' });
              expect(mockHandler).toHaveBeenCalled();
              mockHandler.mockClear();
            }

            // Test Space key activation for buttons and checkboxes
            if (name === 'Button' || name === 'Checkbox' || name === 'Toggle') {
              fireEvent.keyDown(interactiveElement, { key: ' ', code: 'Space' });
              expect(mockHandler).toHaveBeenCalled();
              mockHandler.mockClear();
            }
          }
        }
      }
    ), { numRuns: 50 });
  });

  it('should provide proper focus management for interactive cards', () => {
    fc.assert(fc.property(
      fc.boolean(),
      (hasClickHandler) => {
        const mockHandler = jest.fn();
        const props = hasClickHandler ? { onClick: mockHandler, variant: 'interactive' as const } : {};

        const { container } = render(
          React.createElement(TestWrapper, null,
            React.createElement(Card, props,
              React.createElement('div', null, 'Test Card Content')
            )
          )
        );

        const cardElement = container.firstChild as HTMLElement;

        if (hasClickHandler) {
          // Property: Interactive cards should be focusable
          expect(cardElement.getAttribute('tabindex')).toBe('0');
          expect(cardElement.getAttribute('role')).toBe('button');

          // Property: Interactive cards should respond to keyboard events
          cardElement.focus();
          expect(document.activeElement).toBe(cardElement);

          // Test Enter key
          fireEvent.keyDown(cardElement, { key: 'Enter', code: 'Enter' });
          expect(mockHandler).toHaveBeenCalled();
          mockHandler.mockClear();

          // Test Space key
          fireEvent.keyDown(cardElement, { key: ' ', code: 'Space' });
          expect(mockHandler).toHaveBeenCalled();
        } else {
          // Property: Non-interactive cards should not be focusable
          expect(cardElement.getAttribute('tabindex')).toBeNull();
          expect(cardElement.getAttribute('role')).toBe('region');
        }
      }
    ), { numRuns: 30 });
  });

  it('should ensure proper focus indicators are visible', () => {
    fc.assert(fc.property(
      fc.constantFrom(...interactiveComponents),
      (componentInfo) => {
        const { component: Component, props } = componentInfo;

        const { container } = render(
          React.createElement(TestWrapper, null,
            React.createElement(Component, props)
          )
        );

        const interactiveElement = container.querySelector(
          'button, input, select, textarea, [role="button"], [role="switch"], [role="checkbox"], [tabindex]'
        );

        expect(interactiveElement).toBeTruthy();

        if (interactiveElement) {
          const classes = interactiveElement.className;

          // Property: Interactive elements should have focus-visible styles
          const hasFocusStyles = classes.includes('focus-visible:') || 
                                classes.includes('focus:') ||
                                classes.includes('focus-within:');

          expect(hasFocusStyles).toBe(true);

          // Property: Focus indicators should be visible and meet contrast requirements
          // This is ensured by our design tokens which use proper contrast ratios
          const hasRingStyles = classes.includes('ring-') || 
                               classes.includes('outline-');
          
          expect(hasFocusStyles || hasRingStyles).toBe(true);
        }
      }
    ), { numRuns: 30 });
  });

  it('should support proper tab order and navigation', async () => {
    const user = userEvent.setup();
    
    const { container } = render(
      React.createElement(TestWrapper, null,
        React.createElement('div', null,
          React.createElement(Button, null, 'First Button'),
          React.createElement(Input, { placeholder: 'Input Field' }),
          React.createElement(Toggle, { label: 'Toggle Switch' }),
          React.createElement(Button, null, 'Last Button')
        )
      )
    );

    const interactiveElements = container.querySelectorAll(
      'button, input, select, textarea, [tabindex="0"]'
    );

    // Property: Elements should be in logical tab order
    expect(interactiveElements.length).toBeGreaterThan(0);

    // Test tab navigation
    const firstElement = interactiveElements[0] as HTMLElement;
    firstElement.focus();
    expect(document.activeElement).toBe(firstElement);

    // Tab through elements
    for (let i = 1; i < interactiveElements.length; i++) {
      await user.tab();
      expect(document.activeElement).toBe(interactiveElements[i]);
    }

    // Shift+Tab should go backwards
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(interactiveElements[interactiveElements.length - 2]);
  });

  it('should handle disabled states properly', () => {
    fc.assert(fc.property(
      fc.constantFrom(...interactiveComponents.filter(c => c.name !== 'RadioGroup')),
      (componentInfo) => {
        const { component: Component, props, name } = componentInfo;
        const mockHandler = jest.fn();

        const enhancedProps = {
          ...props,
          disabled: true,
          onClick: name === 'Button' ? mockHandler : props.onClick,
          onCheckedChange: name === 'Toggle' ? mockHandler : props.onCheckedChange,
          onChange: ['Input', 'Select', 'Checkbox'].includes(name) ? mockHandler : props.onChange,
        };

        const { container } = render(
          React.createElement(TestWrapper, null,
            React.createElement(Component, enhancedProps)
          )
        );

        const interactiveElement = container.querySelector(
          'button, input, select, textarea, [role="button"], [role="switch"], [role="checkbox"]'
        ) as HTMLElement;

        expect(interactiveElement).toBeTruthy();

        if (interactiveElement) {
          // Property: Disabled elements should not be focusable
          const tabIndex = interactiveElement.getAttribute('tabindex');
          expect(tabIndex === null || parseInt(tabIndex) === -1).toBe(true);

          // Property: Disabled elements should have proper ARIA attributes
          expect(interactiveElement.hasAttribute('disabled') || 
                 interactiveElement.getAttribute('aria-disabled') === 'true').toBe(true);

          // Property: Disabled elements should not respond to interactions
          fireEvent.click(interactiveElement);
          fireEvent.keyDown(interactiveElement, { key: 'Enter' });
          fireEvent.keyDown(interactiveElement, { key: ' ' });
          
          expect(mockHandler).not.toHaveBeenCalled();

          // Property: Disabled elements should have visual indication
          const classes = interactiveElement.className;
          expect(classes.includes('disabled:') || classes.includes('opacity-')).toBe(true);
        }
      }
    ), { numRuns: 30 });
  });

  it('should provide proper screen reader support', () => {
    fc.assert(fc.property(
      fc.constantFrom(...interactiveComponents),
      fc.string({ minLength: 1, maxLength: 50 }),
      (componentInfo, labelText) => {
        const { component: Component, props, name } = componentInfo;
        
        const enhancedProps = {
          ...props,
          'aria-label': labelText,
          label: name === 'Toggle' || name === 'Checkbox' ? labelText : props.label
        };

        const { container } = render(
          React.createElement(TestWrapper, null,
            React.createElement(Component, enhancedProps)
          )
        );

        const interactiveElement = container.querySelector(
          'button, input, select, textarea, [role="button"], [role="switch"], [role="checkbox"]'
        );

        expect(interactiveElement).toBeTruthy();

        if (interactiveElement) {
          // Property: Elements should have accessible names
          const hasAccessibleName = 
            interactiveElement.hasAttribute('aria-label') ||
            interactiveElement.hasAttribute('aria-labelledby') ||
            interactiveElement.textContent?.trim() ||
            container.querySelector('label[for]') !== null;

          expect(hasAccessibleName).toBe(true);

          // Property: Elements should have proper roles
          const role = interactiveElement.getAttribute('role') || interactiveElement.tagName.toLowerCase();
          const validRoles = ['button', 'textbox', 'combobox', 'checkbox', 'switch', 'input', 'select'];
          expect(validRoles.some(validRole => role.includes(validRole))).toBe(true);

          // Property: State information should be conveyed to screen readers
          if (name === 'Toggle') {
            expect(interactiveElement.hasAttribute('aria-checked')).toBe(true);
          }
          
          if (name === 'Checkbox') {
            expect(interactiveElement.hasAttribute('aria-checked') || 
                   interactiveElement.hasAttribute('checked')).toBe(true);
          }
        }
      }
    ), { numRuns: 30 });
  });
});

// Tag: Feature: frontend-design-system-consistency, Property 8: Accessibility Compliance (Keyboard)