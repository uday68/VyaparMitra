import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { VoicePromptGenerator, VoicePromptContext } from '../services/voice_prompt_generator';

describe('VoicePromptGenerator Property Tests', () => {
  /**
   * Property 7: Currency Context Preservation
   * For any price-related voice prompt in any supported language, the prompt should include 
   * appropriate Indian currency context (rupees, ₹, or local currency terms)
   * Validates: Requirements 4.3
   */
  it('Property 7: Currency Context Preservation', async () => {
    await fc.assert(fc.property(
      fc.constantFrom(...VoicePromptGenerator.getSupportedLanguages()), // language
      fc.float({ min: 0.01, max: 10000, noNaN: true }), // price
      fc.constantFrom('kg', 'pcs', 'ltr', 'box'), // unit
      (language, price, unit) => {
        const context: VoicePromptContext = {
          price,
          unit,
          currency: '₹'
        };

        // Test price request prompt
        const priceRequestPrompt = VoicePromptGenerator.generatePrompt(
          'price_request',
          language,
          context
        );

        // Test price confirmation prompt
        const priceConfirmationPrompt = VoicePromptGenerator.generatePrompt(
          'price_confirmation',
          language,
          context
        );

        // Verify currency context is preserved
        expect(priceRequestPrompt).toBeDefined();
        expect(priceRequestPrompt.length).toBeGreaterThan(0);
        
        // Price request should mention rupees or currency context
        const hasRupeeContext = priceRequestPrompt.includes('rupees') || 
                               priceRequestPrompt.includes('रुपए') ||
                               priceRequestPrompt.includes('টাকা') ||
                               priceRequestPrompt.includes('रुपया') ||
                               priceRequestPrompt.includes('ರೂಪಾಯಿ') ||
                               priceRequestPrompt.includes('രൂപ') ||
                               priceRequestPrompt.includes('રૂપિયા') ||
                               priceRequestPrompt.includes('ਰੁਪਿਆ') ||
                               priceRequestPrompt.includes('ரூபாய்') ||
                               priceRequestPrompt.includes('రూపాయ') ||
                               priceRequestPrompt.includes('ଟଙ୍କା') ||
                               priceRequestPrompt.includes('টকা');

        expect(hasRupeeContext).toBe(true);

        // Price confirmation should include ₹ symbol
        expect(priceConfirmationPrompt).toContain('₹');
        expect(priceConfirmationPrompt).toContain(price.toString());
        expect(priceConfirmationPrompt).toContain(unit);

        // Verify unit is properly translated
        const unitTranslation = VoicePromptGenerator.getUnitTranslation(unit, language);
        expect(priceConfirmationPrompt).toContain(unitTranslation);
      }
    ), { numRuns: 100 });
  });

  it('should generate consistent prompts across all supported languages', async () => {
    await fc.assert(fc.property(
      fc.constantFrom(...VoicePromptGenerator.getAvailablePromptTypes()),
      fc.record({
        quantity: fc.option(fc.integer({ min: 1, max: 1000 })),
        price: fc.option(fc.float({ min: 0.01, max: 10000, noNaN: true })),
        unit: fc.option(fc.constantFrom('kg', 'pcs', 'ltr', 'box')),
        productName: fc.option(fc.string({ minLength: 1, maxLength: 50 }))
      }),
      (promptType, context) => {
        const supportedLanguages = VoicePromptGenerator.getSupportedLanguages();
        const prompts: Record<string, string> = {};

        // Generate prompts for all supported languages
        for (const language of supportedLanguages) {
          const prompt = VoicePromptGenerator.generatePrompt(promptType, language, context);
          prompts[language] = prompt;

          // Each prompt should be non-empty
          expect(prompt).toBeDefined();
          expect(prompt.length).toBeGreaterThan(0);
          expect(typeof prompt).toBe('string');
        }

        // All prompts should be different (except for fallbacks)
        const uniquePrompts = new Set(Object.values(prompts));
        
        // Should have multiple unique prompts (allowing for some fallbacks to English)
        expect(uniquePrompts.size).toBeGreaterThan(1);

        // English prompt should always exist
        expect(prompts.en).toBeDefined();
        expect(prompts.en.length).toBeGreaterThan(0);
      }
    ), { numRuns: 50 });
  });

  it('should properly replace template variables in all languages', async () => {
    await fc.assert(fc.property(
      fc.constantFrom(...VoicePromptGenerator.getSupportedLanguages()),
      fc.integer({ min: 1, max: 1000 }), // quantity
      fc.float({ min: 0.01, max: 10000, noNaN: true }), // price
      fc.constantFrom('kg', 'pcs', 'ltr', 'box'), // unit
      fc.string({ minLength: 1, maxLength: 50 }), // productName
      (language, quantity, price, unit, productName) => {
        const context: VoicePromptContext = {
          quantity,
          price,
          unit,
          productName,
          currency: '₹'
        };

        // Test quantity confirmation
        const quantityPrompt = VoicePromptGenerator.generatePrompt(
          'quantity_confirmation',
          language,
          context
        );

        // Test price confirmation
        const pricePrompt = VoicePromptGenerator.generatePrompt(
          'price_confirmation',
          language,
          context
        );

        // Verify template variables are replaced
        expect(quantityPrompt).toContain(quantity.toString());
        expect(quantityPrompt).toContain(unit);
        expect(quantityPrompt).not.toContain('{{quantity}}');
        expect(quantityPrompt).not.toContain('{{unit}}');

        expect(pricePrompt).toContain(price.toString());
        expect(pricePrompt).toContain(unit);
        expect(pricePrompt).not.toContain('{{price}}');
        expect(pricePrompt).not.toContain('{{unit}}');
      }
    ), { numRuns: 50 });
  });

  it('should handle contextual prompts with attempt counts', async () => {
    await fc.assert(fc.property(
      fc.constantFrom(...VoicePromptGenerator.getSupportedLanguages()),
      fc.constantFrom('quantity_request', 'price_request', 'photo_captured'),
      fc.integer({ min: 1, max: 5 }), // attempt count
      fc.record({
        quantity: fc.option(fc.integer({ min: 1, max: 100 })),
        price: fc.option(fc.float({ min: 1, max: 1000, noNaN: true })),
        unit: fc.option(fc.constantFrom('kg', 'pcs', 'ltr', 'box'))
      }),
      (language, promptType, attemptCount, context) => {
        const contextualPrompt = VoicePromptGenerator.generateContextualPrompt(
          promptType,
          language,
          context,
          attemptCount
        );

        expect(contextualPrompt).toBeDefined();
        expect(contextualPrompt.length).toBeGreaterThan(0);

        // For retry attempts (> 1), should include retry context
        if (attemptCount > 1) {
          const hasRetryContext = contextualPrompt.includes('again') ||
                                 contextualPrompt.includes('try') ||
                                 contextualPrompt.includes('फिर') ||
                                 contextualPrompt.includes('আবার') ||
                                 contextualPrompt.includes('पुन्हा') ||
                                 contextualPrompt.includes('ಮತ್ತೆ') ||
                                 contextualPrompt.includes('വീണ്ടും') ||
                                 contextualPrompt.includes('ફરી') ||
                                 contextualPrompt.includes('ਦੁਬਾਰਾ') ||
                                 contextualPrompt.includes('மீண்டும்') ||
                                 contextualPrompt.includes('మళ్లీ') ||
                                 contextualPrompt.includes('ପୁଣି') ||
                                 contextualPrompt.includes('আকৌ');

          expect(hasRetryContext).toBe(true);
        }
      }
    ), { numRuns: 30 });
  });

  it('should maintain language consistency across prompt types', async () => {
    await fc.assert(fc.property(
      fc.constantFrom(...VoicePromptGenerator.getSupportedLanguages()),
      fc.record({
        quantity: fc.integer({ min: 1, max: 100 }),
        price: fc.float({ min: 1, max: 1000, noNaN: true }),
        unit: fc.constantFrom('kg', 'pcs', 'ltr', 'box')
      }),
      (language, context) => {
        const promptTypes = [
          'photo_captured',
          'quantity_request',
          'quantity_confirmation',
          'price_request',
          'price_confirmation',
          'completion_success'
        ];

        const prompts = promptTypes.map(type => 
          VoicePromptGenerator.generatePrompt(type, language, context)
        );

        // All prompts should be generated successfully
        prompts.forEach(prompt => {
          expect(prompt).toBeDefined();
          expect(prompt.length).toBeGreaterThan(0);
          expect(typeof prompt).toBe('string');
        });

        // For non-English languages, prompts should contain language-specific characters
        if (language !== 'en') {
          const hasNonLatinChars = prompts.some(prompt => 
            /[^\x00-\x7F]/.test(prompt) // Contains non-ASCII characters
          );
          expect(hasNonLatinChars).toBe(true);
        }
      }
    ), { numRuns: 40 });
  });
});

describe('VoicePromptGenerator Unit Tests', () => {
  it('should return supported languages', () => {
    const languages = VoicePromptGenerator.getSupportedLanguages();
    expect(languages).toContain('en');
    expect(languages).toContain('hi');
    expect(languages).toContain('bn');
    expect(languages).toHaveLength(12);
  });

  it('should return available prompt types', () => {
    const promptTypes = VoicePromptGenerator.getAvailablePromptTypes();
    expect(promptTypes).toContain('photo_captured');
    expect(promptTypes).toContain('quantity_request');
    expect(promptTypes).toContain('price_request');
    expect(promptTypes.length).toBeGreaterThan(5);
  });

  it('should check language support correctly', () => {
    expect(VoicePromptGenerator.isLanguageSupported('en')).toBe(true);
    expect(VoicePromptGenerator.isLanguageSupported('hi')).toBe(true);
    expect(VoicePromptGenerator.isLanguageSupported('fr')).toBe(false);
    expect(VoicePromptGenerator.isLanguageSupported('xyz')).toBe(false);
  });

  it('should return rupee symbol for all languages', () => {
    const languages = VoicePromptGenerator.getSupportedLanguages();
    languages.forEach(lang => {
      expect(VoicePromptGenerator.getCurrencySymbol(lang)).toBe('₹');
    });
  });

  it('should translate units correctly', () => {
    expect(VoicePromptGenerator.getUnitTranslation('kg', 'hi')).toBe('किलो');
    expect(VoicePromptGenerator.getUnitTranslation('pcs', 'bn')).toBe('পিস');
    expect(VoicePromptGenerator.getUnitTranslation('ltr', 'en')).toBe('liters');
    expect(VoicePromptGenerator.getUnitTranslation('unknown', 'en')).toBe('unknown');
  });

  it('should generate basic prompts without context', () => {
    const prompt = VoicePromptGenerator.generatePrompt('photo_captured', 'en');
    expect(prompt).toBe("Photo captured! Is this the product you want to add?");
  });

  it('should generate prompts with context', () => {
    const context: VoicePromptContext = {
      quantity: 50,
      unit: 'kg',
      price: 25.99
    };

    const quantityPrompt = VoicePromptGenerator.generatePrompt(
      'quantity_confirmation',
      'en',
      context
    );
    expect(quantityPrompt).toContain('50');
    expect(quantityPrompt).toContain('kg');

    const pricePrompt = VoicePromptGenerator.generatePrompt(
      'price_confirmation',
      'en',
      context
    );
    expect(pricePrompt).toContain('₹25.99');
    expect(pricePrompt).toContain('kg');
  });

  it('should fallback to English for unknown languages', () => {
    const prompt = VoicePromptGenerator.generatePrompt('photo_captured', 'unknown');
    expect(prompt).toBe("Photo captured! Is this the product you want to add?");
  });

  it('should fallback to error prompt for unknown prompt types', () => {
    const prompt = VoicePromptGenerator.generatePrompt('unknown_type', 'en');
    expect(prompt).toBe("I didn't understand that. Please try again.");
  });

  it('should generate Hindi prompts correctly', () => {
    const context: VoicePromptContext = {
      quantity: 10,
      unit: 'kg',
      price: 100
    };

    const quantityPrompt = VoicePromptGenerator.generatePrompt(
      'quantity_confirmation',
      'hi',
      context
    );
    expect(quantityPrompt).toContain('10');
    expect(quantityPrompt).toContain('किलो');
    expect(quantityPrompt).toContain('सही');

    const pricePrompt = VoicePromptGenerator.generatePrompt(
      'price_confirmation',
      'hi',
      context
    );
    expect(pricePrompt).toContain('₹100');
    expect(pricePrompt).toContain('किलो');
  });

  it('should handle contextual prompts with multiple attempts', () => {
    const context: VoicePromptContext = { quantity: 5, unit: 'pcs' };

    const firstAttempt = VoicePromptGenerator.generateContextualPrompt(
      'quantity_request',
      'en',
      context,
      1
    );

    const secondAttempt = VoicePromptGenerator.generateContextualPrompt(
      'quantity_request',
      'en',
      context,
      2
    );

    expect(firstAttempt).not.toContain('try again');
    expect(secondAttempt).toContain('try again');
    expect(secondAttempt.length).toBeGreaterThan(firstAttempt.length);
  });
});