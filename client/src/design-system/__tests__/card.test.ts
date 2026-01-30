/**
 * Property 2: Component Variant Completeness (Cards)
 * Validates: Requirements 2.2
 * 
 * This property test ensures that all card variants are properly implemented
 * and maintain consistent styling across different combinations of props.
 */

import { cardVariants } from '../../components/ui/card';
import { describe, it, expect } from '@jest/globals';

describe('Card Component Property Tests', () => {
  const variants = ['default', 'elevated', 'outlined', 'glass'] as const;
  const paddings = ['sm', 'md', 'lg'] as const;
  const borderRadii = ['md', 'lg', 'xl', '2xl'] as const;
  const shadows = ['none', 'sm', 'md', 'lg'] as const;

  it('Property 2: Component Variant Completeness (Cards) - All variant combinations generate valid classes', () => {
    variants.forEach(variant => {
      paddings.forEach(padding => {
        borderRadii.forEach(borderRadius => {
          shadows.forEach(shadow => {
            // Generate classes for this combination
            const classes = cardVariants({ variant, padding, borderRadius, shadow });
            
            // Verify classes are generated
            expect(classes).toBeDefined();
            expect(typeof classes).toBe('string');
            expect(classes.length).toBeGreaterThan(0);
            
            // Verify base classes are present
            expect(classes).toContain('bg-card');
            expect(classes).toContain('text-card-foreground');
            expect(classes).toContain('transition-all');
            expect(classes).toContain('duration-200');
            expect(classes).toContain('theme-transition');
            
            // Verify padding classes
            switch (padding) {
              case 'sm':
                expect(classes).toContain('p-3');
                break;
              case 'md':
                expect(classes).toContain('p-4');
                break;
              case 'lg':
                expect(classes).toContain('p-6');
                break;
            }
            
            // Verify border radius classes
            switch (borderRadius) {
              case 'md':
                expect(classes).toContain('rounded-md');
                break;
              case 'lg':
                expect(classes).toContain('rounded-lg');
                break;
              case 'xl':
                expect(classes).toContain('rounded-xl');
                break;
              case '2xl':
                expect(classes).toContain('rounded-2xl');
                break;
            }
            
            // Verify shadow classes
            switch (shadow) {
              case 'none':
                expect(classes).toContain('shadow-none');
                break;
              case 'sm':
                expect(classes).toContain('shadow-sm');
                break;
              case 'md':
                expect(classes).toContain('shadow-md');
                break;
              case 'lg':
                expect(classes).toContain('shadow-lg');
                break;
            }
          });
        });
      });
    });
  });

  it('Property 2: Default card configuration', () => {
    const defaultClasses = cardVariants({});
    
    // Should use default values
    expect(defaultClasses).toContain('p-4'); // md padding
    expect(defaultClasses).toContain('rounded-xl'); // xl border radius
    expect(defaultClasses).toContain('shadow-sm'); // sm shadow
    
    // Should include default variant styling
    expect(defaultClasses).toContain('border');
    expect(defaultClasses).toContain('border-card-border');
    expect(defaultClasses).toContain('hover:shadow-md');
  });

  it('Property 2: Elevated variant enhanced shadows', () => {
    const elevatedClasses = cardVariants({ variant: 'elevated' });
    
    // Elevated variant should have enhanced shadows
    expect(elevatedClasses).toContain('shadow-md');
    expect(elevatedClasses).toContain('hover:shadow-lg');
    expect(elevatedClasses).toContain('border');
    expect(elevatedClasses).toContain('border-card-border');
  });

  it('Property 2: Outlined variant border emphasis', () => {
    const outlinedClasses = cardVariants({ variant: 'outlined' });
    
    // Outlined variant should emphasize borders
    expect(outlinedClasses).toContain('border-2');
    expect(outlinedClasses).toContain('border-card-border');
    expect(outlinedClasses).toContain('shadow-none');
    expect(outlinedClasses).toContain('hover:shadow-sm');
  });

  it('Property 2: Glass variant translucent effects', () => {
    const glassClasses = cardVariants({ variant: 'glass' });
    
    // Glass variant should have special effects
    expect(glassClasses).toContain('glass-panel');
    expect(glassClasses).toContain('shadow-lg');
    expect(glassClasses).toContain('hover:shadow-xl');
    expect(glassClasses).toContain('backdrop-blur-md');
  });

  it('Property 2: Padding variants provide correct spacing', () => {
    const smallPadding = cardVariants({ padding: 'sm' });
    const mediumPadding = cardVariants({ padding: 'md' });
    const largePadding = cardVariants({ padding: 'lg' });
    
    expect(smallPadding).toContain('p-3');
    expect(mediumPadding).toContain('p-4');
    expect(largePadding).toContain('p-6');
  });

  it('Property 2: Border radius variants provide correct rounding', () => {
    const mdRadius = cardVariants({ borderRadius: 'md' });
    const lgRadius = cardVariants({ borderRadius: 'lg' });
    const xlRadius = cardVariants({ borderRadius: 'xl' });
    const xxlRadius = cardVariants({ borderRadius: '2xl' });
    
    expect(mdRadius).toContain('rounded-md');
    expect(lgRadius).toContain('rounded-lg');
    expect(xlRadius).toContain('rounded-xl');
    expect(xxlRadius).toContain('rounded-2xl');
  });

  it('Property 2: Shadow variants provide correct elevation', () => {
    const noShadow = cardVariants({ shadow: 'none' });
    const smallShadow = cardVariants({ shadow: 'sm' });
    const mediumShadow = cardVariants({ shadow: 'md' });
    const largeShadow = cardVariants({ shadow: 'lg' });
    
    expect(noShadow).toContain('shadow-none');
    expect(smallShadow).toContain('shadow-sm');
    expect(mediumShadow).toContain('shadow-md');
    expect(largeShadow).toContain('shadow-lg');
  });

  it('Property 2: All variants include theme transition support', () => {
    variants.forEach(variant => {
      const classes = cardVariants({ variant });
      
      // All variants should support theme transitions
      expect(classes).toContain('theme-transition');
      expect(classes).toContain('transition-all');
      expect(classes).toContain('duration-200');
    });
  });

  it('Property 2: All variants use design system color tokens', () => {
    variants.forEach(variant => {
      const classes = cardVariants({ variant });
      
      // All variants should use design system tokens
      expect(classes).toContain('bg-card');
      expect(classes).toContain('text-card-foreground');
      
      // Most variants should have borders (except glass which uses glass-panel)
      if (variant !== 'glass') {
        expect(classes).toContain('border-card-border');
      }
    });
  });

  it('Property 2: Hover states are consistent across variants', () => {
    const defaultCard = cardVariants({ variant: 'default' });
    const elevatedCard = cardVariants({ variant: 'elevated' });
    const outlinedCard = cardVariants({ variant: 'outlined' });
    const glassCard = cardVariants({ variant: 'glass' });
    
    // All variants should have hover states
    expect(defaultCard).toContain('hover:shadow-md');
    expect(elevatedCard).toContain('hover:shadow-lg');
    expect(outlinedCard).toContain('hover:shadow-sm');
    expect(glassCard).toContain('hover:shadow-xl');
  });

  it('Property 2: Design system token consistency', () => {
    // Test that all combinations use consistent design tokens
    variants.forEach(variant => {
      paddings.forEach(padding => {
        const classes = cardVariants({ variant, padding });
        
        // Should always include base design system classes
        expect(classes).toContain('bg-card');
        expect(classes).toContain('text-card-foreground');
        
        // Should include proper spacing from design system
        const hasPadding = classes.includes('p-3') || 
                          classes.includes('p-4') || 
                          classes.includes('p-6');
        expect(hasPadding).toBe(true);
        
        // Should include proper border radius from design system
        const hasBorderRadius = classes.includes('rounded-md') ||
                               classes.includes('rounded-lg') ||
                               classes.includes('rounded-xl') ||
                               classes.includes('rounded-2xl');
        expect(hasBorderRadius).toBe(true);
      });
    });
  });
});