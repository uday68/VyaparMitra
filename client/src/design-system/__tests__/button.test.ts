/**
 * Property 2: Component Variant Completeness (Buttons)
 * Validates: Requirements 2.1
 * 
 * This property test ensures that all button variants are properly implemented
 * and maintain consistent styling across different combinations of props.
 */

import { buttonVariants } from '../../components/ui/button';
import { describe, it, expect } from '@jest/globals';

describe('Button Component Property Tests', () => {
  const variants = ['primary', 'secondary', 'ghost', 'voice'] as const;
  const sizes = ['sm', 'md', 'lg'] as const;
  const colorSchemes = ['blue', 'green', 'purple'] as const;

  it('Property 2: Component Variant Completeness (Buttons) - All variant combinations generate valid classes', () => {
    variants.forEach(variant => {
      sizes.forEach(size => {
        colorSchemes.forEach(colorScheme => {
          // Generate classes for this combination
          const classes = buttonVariants({ variant, size, colorScheme });
          
          // Verify classes are generated
          expect(classes).toBeDefined();
          expect(typeof classes).toBe('string');
          expect(classes.length).toBeGreaterThan(0);
          
          // Verify base classes are present
          expect(classes).toContain('inline-flex');
          expect(classes).toContain('items-center');
          expect(classes).toContain('justify-center');
          expect(classes).toContain('font-body');
          expect(classes).toContain('font-semibold');
          expect(classes).toContain('transition-all');
          expect(classes).toContain('duration-200');
          
          // Verify size-specific classes
          switch (size) {
            case 'sm':
              expect(classes).toContain('h-8');
              expect(classes).toContain('px-3');
              expect(classes).toContain('text-sm');
              expect(classes).toContain('rounded-md');
              break;
            case 'md':
              expect(classes).toContain('h-10');
              expect(classes).toContain('px-4');
              expect(classes).toContain('text-base');
              expect(classes).toContain('rounded-lg');
              break;
            case 'lg':
              expect(classes).toContain('h-12');
              expect(classes).toContain('px-6');
              expect(classes).toContain('text-lg');
              expect(classes).toContain('rounded-xl');
              break;
          }
          
          // Verify variant-specific styling exists
          const hasVariantStyling = classes.includes('bg-') || 
                                   classes.includes('text-') || 
                                   classes.includes('border-');
          expect(hasVariantStyling).toBe(true);
          
          // Verify accessibility classes
          expect(classes).toContain('focus-visible:outline-none');
          expect(classes).toContain('focus-visible:ring-2');
          expect(classes).toContain('disabled:pointer-events-none');
          expect(classes).toContain('disabled:opacity-50');
        });
      });
    });
  });

  it('Property 2: Default variant configuration', () => {
    const defaultClasses = buttonVariants({});
    
    // Should use default values
    expect(defaultClasses).toContain('h-10'); // md size
    expect(defaultClasses).toContain('px-4'); // md size
    expect(defaultClasses).toContain('text-base'); // md size
    expect(defaultClasses).toContain('rounded-lg'); // md size
    
    // Should include primary variant styling
    expect(defaultClasses).toContain('bg-primary');
    expect(defaultClasses).toContain('text-white');
  });

  it('Property 2: Voice variant special styling', () => {
    const voiceClasses = buttonVariants({ variant: 'voice' });
    
    // Voice variant should have special styling
    expect(voiceClasses).toContain('bg-primary-purple');
    expect(voiceClasses).toContain('text-white');
    expect(voiceClasses).toContain('border-primary-purple');
    expect(voiceClasses).toContain('relative');
    expect(voiceClasses).toContain('overflow-hidden');
  });

  it('Property 2: Ghost variant minimal styling', () => {
    const ghostClasses = buttonVariants({ variant: 'ghost' });
    
    // Ghost variant should have minimal styling
    expect(ghostClasses).toContain('bg-transparent');
    expect(ghostClasses).toContain('border-transparent');
    expect(ghostClasses).toContain('text-neutral-700');
  });

  it('Property 2: Secondary variant outlined styling', () => {
    const secondaryClasses = buttonVariants({ variant: 'secondary' });
    
    // Secondary variant should be outlined
    expect(secondaryClasses).toContain('bg-transparent');
    expect(secondaryClasses).toContain('text-primary');
    expect(secondaryClasses).toContain('border-2');
    expect(secondaryClasses).toContain('border-primary');
  });

  it('Property 2: Color scheme compound variants work correctly', () => {
    // Test primary button with different color schemes
    const blueClasses = buttonVariants({ variant: 'primary', colorScheme: 'blue' });
    const greenClasses = buttonVariants({ variant: 'primary', colorScheme: 'green' });
    const purpleClasses = buttonVariants({ variant: 'primary', colorScheme: 'purple' });
    
    expect(blueClasses).toContain('bg-primary-blue');
    expect(greenClasses).toContain('bg-primary-green');
    expect(purpleClasses).toContain('bg-primary-purple');
    
    // Test secondary button with different color schemes
    const blueSecondary = buttonVariants({ variant: 'secondary', colorScheme: 'blue' });
    const greenSecondary = buttonVariants({ variant: 'secondary', colorScheme: 'green' });
    const purpleSecondary = buttonVariants({ variant: 'secondary', colorScheme: 'purple' });
    
    expect(blueSecondary).toContain('text-primary-blue');
    expect(greenSecondary).toContain('text-primary-green');
    expect(purpleSecondary).toContain('text-primary-purple');
  });

  it('Property 2: Touch target accessibility requirements', () => {
    // All sizes should meet minimum touch target requirements
    const smallClasses = buttonVariants({ size: 'sm' });
    const mediumClasses = buttonVariants({ size: 'md' });
    const largeClasses = buttonVariants({ size: 'lg' });
    
    // Small buttons should have minimum 32px height (h-8)
    expect(smallClasses).toContain('h-8');
    expect(smallClasses).toContain('min-w-[64px]');
    
    // Medium buttons should have 40px height (h-10)
    expect(mediumClasses).toContain('h-10');
    expect(mediumClasses).toContain('min-w-[80px]');
    
    // Large buttons should have 48px height (h-12)
    expect(largeClasses).toContain('h-12');
    expect(largeClasses).toContain('min-w-[96px]');
  });

  it('Property 2: Consistent hover and focus states across variants', () => {
    variants.forEach(variant => {
      const classes = buttonVariants({ variant });
      
      // All variants should have focus states
      expect(classes).toContain('focus-visible:outline-none');
      expect(classes).toContain('focus-visible:ring-2');
      expect(classes).toContain('focus-visible:ring-offset-2');
      
      // All variants should have disabled states
      expect(classes).toContain('disabled:pointer-events-none');
      expect(classes).toContain('disabled:opacity-50');
      
      // All variants should have transitions
      expect(classes).toContain('transition-all');
      expect(classes).toContain('duration-200');
    });
  });
});