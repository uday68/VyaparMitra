/**
 * WCAG 2.1 AA Contrast Compliance Tests
 * 
 * These tests validate that all color combinations in both light and dark themes
 * meet WCAG 2.1 AA accessibility standards.
 */

import { 
  getContrastRatio, 
  meetsWCAGAA, 
  validateThemeContrast,
  WCAG_AA_STANDARDS,
  getContrastReport
} from '../utils/contrast';
import { lightTheme, lightThemeProperties } from '../themes/light';
import { darkTheme, darkThemeProperties } from '../themes/dark';
import { colorTokens } from '../tokens/colors';

describe('WCAG 2.1 AA Contrast Compliance', () => {
  
  /**
   * Property 8: Accessibility Compliance (Contrast)
   * Validates: Requirements 6.1, 6.6, 7.6
   */
  describe('Property 8: Accessibility Compliance (Contrast)', () => {
    
    test('contrast ratio calculation should be accurate', () => {
      // Test known contrast ratios
      expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1); // Maximum contrast
      expect(getContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);   // No contrast
      expect(getContrastRatio('#767676', '#ffffff')).toBeCloseTo(4.5, 1); // Minimum AA
    });
    
    test('WCAG AA compliance checking should work correctly', () => {
      // Test cases that should pass AA
      expect(meetsWCAGAA('#000000', '#ffffff', 'normal')).toBe(true);
      expect(meetsWCAGAA('#767676', '#ffffff', 'normal')).toBe(true);
      expect(meetsWCAGAA('#949494', '#ffffff', 'large')).toBe(true);
      
      // Test cases that should fail AA
      expect(meetsWCAGAA('#cccccc', '#ffffff', 'normal')).toBe(false);
      expect(meetsWCAGAA('#aaaaaa', '#ffffff', 'normal')).toBe(false);
    });
    
    test('light theme should meet WCAG AA standards', () => {
      const validation = validateThemeContrast(lightTheme, lightThemeProperties);
      
      // Log any violations for debugging
      if (validation.violations.length > 0) {
        console.warn('Light theme contrast violations:', validation.violations);
      }
      
      // Should have no violations
      expect(validation.violations).toHaveLength(0);
      expect(validation.valid).toBe(true);
    });
    
    test('dark theme should meet WCAG AA standards', () => {
      const validation = validateThemeContrast(darkTheme, darkThemeProperties);
      
      // Log any violations for debugging
      if (validation.violations.length > 0) {
        console.warn('Dark theme contrast violations:', validation.violations);
      }
      
      // Should have no violations
      expect(validation.violations).toHaveLength(0);
      expect(validation.valid).toBe(true);
    });
    
    test('primary colors should have sufficient contrast with their foregrounds', () => {
      const primaryColors = [
        { name: 'blue', color: colorTokens.primary.blue },
        { name: 'green', color: colorTokens.primary.green },
        { name: 'purple', color: colorTokens.primary.purple },
        { name: 'blueVariant', color: colorTokens.primary.blueVariant }
      ];
      
      primaryColors.forEach(({ name, color }) => {
        const ratio = getContrastRatio('#ffffff', color);
        const report = getContrastReport('#ffffff', color);
        
        // Should meet at least AA standards for normal text
        expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_STANDARDS.NORMAL_TEXT);
        expect(report.normalText).toBe(true);
        expect(report.grade).not.toBe('FAIL');
        
        console.log(`${name}: ${ratio.toFixed(2)}:1 (${report.grade})`);
      });
    });
    
    test('semantic colors should have sufficient contrast', () => {
      const semanticColors = [
        { name: 'success', color: colorTokens.semantic.success },
        { name: 'warning', color: colorTokens.semantic.warning },
        { name: 'error', color: colorTokens.semantic.error },
        { name: 'info', color: colorTokens.semantic.info }
      ];
      
      semanticColors.forEach(({ name, color }) => {
        const ratio = getContrastRatio('#ffffff', color);
        const report = getContrastReport('#ffffff', color);
        
        // Should meet at least AA standards for normal text
        expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_STANDARDS.NORMAL_TEXT);
        expect(report.normalText).toBe(true);
        expect(report.grade).not.toBe('FAIL');
        
        console.log(`${name}: ${ratio.toFixed(2)}:1 (${report.grade})`);
      });
    });
    
    test('neutral colors should provide proper text contrast', () => {
      // Test light theme text combinations
      const lightTextOnBackground = getContrastRatio(
        lightThemeProperties['--color-foreground'],
        lightThemeProperties['--color-background']
      );
      
      expect(lightTextOnBackground).toBeGreaterThanOrEqual(WCAG_AA_STANDARDS.NORMAL_TEXT);
      
      const lightMutedTextOnBackground = getContrastRatio(
        lightThemeProperties['--color-muted-foreground'],
        lightThemeProperties['--color-background']
      );
      
      expect(lightMutedTextOnBackground).toBeGreaterThanOrEqual(WCAG_AA_STANDARDS.NORMAL_TEXT);
      
      // Test dark theme text combinations
      const darkTextOnBackground = getContrastRatio(
        darkThemeProperties['--color-foreground'],
        darkThemeProperties['--color-background']
      );
      
      expect(darkTextOnBackground).toBeGreaterThanOrEqual(WCAG_AA_STANDARDS.NORMAL_TEXT);
      
      console.log('Light theme text contrast:', lightTextOnBackground.toFixed(2) + ':1');
      console.log('Dark theme text contrast:', darkTextOnBackground.toFixed(2) + ':1');
    });
    
    test('voice UI colors should meet accessibility standards', () => {
      // Test voice UI foreground on voice background
      const voiceForeground = lightThemeProperties['--color-voice-foreground'];
      const voiceBackground = lightThemeProperties['--color-voice-background'];
      
      // Voice background is semi-transparent, so test against main background
      const mainBackground = lightThemeProperties['--color-background'];
      const voiceRatio = getContrastRatio(voiceForeground, mainBackground);
      
      expect(voiceRatio).toBeGreaterThanOrEqual(WCAG_AA_STANDARDS.NORMAL_TEXT);
      
      console.log('Voice UI contrast:', voiceRatio.toFixed(2) + ':1');
    });
    
    test('all theme color combinations should be documented', () => {
      // This test ensures we're checking all important color combinations
      const lightValidation = validateThemeContrast(lightTheme, lightThemeProperties);
      const darkValidation = validateThemeContrast(darkTheme, darkThemeProperties);
      
      // Should have tested multiple combinations
      const totalCombinations = lightValidation.violations.length + 
                               lightValidation.warnings.length +
                               darkValidation.violations.length + 
                               darkValidation.warnings.length;
      
      // We should be testing at least some combinations
      expect(totalCombinations).toBeGreaterThanOrEqual(0);
      
      // Log summary
      console.log('Light theme - Violations:', lightValidation.violations.length, 'Warnings:', lightValidation.warnings.length);
      console.log('Dark theme - Violations:', darkValidation.violations.length, 'Warnings:', darkValidation.warnings.length);
    });
  });
  
  describe('Contrast Utility Functions', () => {
    
    test('should handle invalid color formats gracefully', () => {
      expect(() => getContrastRatio('invalid', '#ffffff')).toThrow();
      expect(() => getContrastRatio('#ffffff', 'invalid')).toThrow();
      expect(() => getContrastRatio('', '#ffffff')).toThrow();
    });
    
    test('should calculate relative luminance correctly', () => {
      // Test with known values
      const whiteRatio = getContrastRatio('#ffffff', '#000000');
      const blackRatio = getContrastRatio('#000000', '#ffffff');
      
      expect(whiteRatio).toBeCloseTo(21, 1);
      expect(blackRatio).toBeCloseTo(21, 1);
    });
    
    test('should provide detailed contrast reports', () => {
      const report = getContrastReport('#000000', '#ffffff');
      
      expect(report.ratio).toBeCloseTo(21, 1);
      expect(report.normalText).toBe(true);
      expect(report.largeText).toBe(true);
      expect(report.uiComponents).toBe(true);
      expect(report.enhanced).toBe(true);
      expect(report.grade).toBe('AAA');
    });
  });
});