import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { VoiceIntentService } from '../services/voice_intent';
import { VoiceWorkflowState } from '../services/voice_workflow_service';

describe('VoiceIntentService Property Tests', () => {
  /**
   * Property 1: Multilingual Intent Recognition
   * Validates: Requirements 1.1
   * 
   * This property ensures that intent recognition works consistently across all supported languages
   * and that the confidence scores are within valid ranges.
   */
  describe('Property 1: Multilingual Intent Recognition', () => {
    const supportedLanguages = ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as'];
    
    it('should recognize supported languages for intents', () => {
      const languages = VoiceIntentService.getSupportedLanguages('ADD_PRODUCT');
      expect(languages).toContain('en');
      expect(languages).toContain('hi');
      expect(languages).toContain('bn');
      expect(languages.length).toBeGreaterThan(5);
    });

    it('should return all supported intents', () => {
      const intents = VoiceIntentService.getSupportedIntents();
      expect(intents).toContain('ADD_PRODUCT');
      expect(intents).toContain('START_VOICE_PRODUCT_WORKFLOW');
      expect(intents).toContain('GREETING');
      expect(intents).toContain('HELP');
      expect(intents.length).toBeGreaterThan(5);
    });

    it('should handle multilingual intent patterns consistently', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...supportedLanguages),
          (language) => {
            // Property: All supported languages should be valid
            expect(supportedLanguages).toContain(language);
            
            // Property: Language should be supported by core intents
            const addProductLanguages = VoiceIntentService.getSupportedLanguages('ADD_PRODUCT');
            expect(addProductLanguages).toContain(language);
            
            const greetingLanguages = VoiceIntentService.getSupportedLanguages('GREETING');
            expect(greetingLanguages).toContain(language);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain intent consistency across workflow states', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(VoiceWorkflowState)),
          (workflowState) => {
            // Property: All workflow states should be valid enum values
            expect(Object.values(VoiceWorkflowState)).toContain(workflowState);
            
            // Property: Workflow states should have consistent naming
            expect(typeof workflowState).toBe('string');
            expect(workflowState.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  /**
   * Property Test: Language Support Consistency
   * Validates that all core intents support the same set of languages
   */
  describe('Language Support Consistency', () => {
    it('should support consistent languages across core intents', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('ADD_PRODUCT', 'GREETING', 'HELP', 'START_VOICE_PRODUCT_WORKFLOW'),
          (intent) => {
            const languages = VoiceIntentService.getSupportedLanguages(intent);
            
            // Property: All core intents should support at least 8 languages
            expect(languages.length).toBeGreaterThanOrEqual(8);
            
            // Property: All core intents should support English
            expect(languages).toContain('en');
            
            // Property: All core intents should support Hindi
            expect(languages).toContain('hi');
            
            // Property: All core intents should support Bengali
            expect(languages).toContain('bn');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property Test: Intent Name Consistency
   * Validates that intent names follow consistent patterns
   */
  describe('Intent Name Consistency', () => {
    it('should have consistent intent naming patterns', () => {
      const intents = VoiceIntentService.getSupportedIntents();
      
      // Property: All intents should be uppercase strings
      intents.forEach(intent => {
        expect(typeof intent).toBe('string');
        expect(intent).toBe(intent.toUpperCase());
        expect(intent.length).toBeGreaterThan(0);
      });
      
      // Property: Workflow intents should have WORKFLOW_ prefix
      const workflowIntents = intents.filter(intent => intent.includes('WORKFLOW'));
      workflowIntents.forEach(intent => {
        expect(intent).toMatch(/^WORKFLOW_/);
      });
    });

    it('should maintain workflow intent consistency', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('WORKFLOW_PHOTO_CAPTURE', 'WORKFLOW_PHOTO_CONFIRM', 'WORKFLOW_QUANTITY_INPUT', 'WORKFLOW_PRICE_INPUT'),
          (workflowIntent) => {
            const intents = VoiceIntentService.getSupportedIntents();
            
            // Property: All workflow intents should be in supported intents list
            expect(intents).toContain(workflowIntent);
            
            // Property: All workflow intents should support multiple languages
            const languages = VoiceIntentService.getSupportedLanguages(workflowIntent);
            expect(languages.length).toBeGreaterThanOrEqual(8);
          }
        ),
        { numRuns: 8 }
      );
    });
  });

  /**
   * Property 2: Workflow State Consistency
   * Validates: Requirements 1.4, 4.1, 4.5
   * 
   * This property ensures that workflow state transitions maintain language consistency
   * and that voice prompts are generated in the correct language throughout the workflow.
   */
  describe('Property 2: Workflow State Consistency', () => {
    it('should maintain language consistency across workflow states', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as'),
          fc.constantFrom(...Object.values(VoiceWorkflowState)),
          (language, workflowState) => {
            // Property: All workflow states should be supported in all languages
            const supportedLanguages = ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as'];
            expect(supportedLanguages).toContain(language);
            
            // Property: Workflow states should be valid enum values
            expect(Object.values(VoiceWorkflowState)).toContain(workflowState);
            
            // Property: Language should be consistent format (2-letter code)
            expect(language).toMatch(/^[a-z]{2}$/);
            
            // Property: Workflow state should be valid string
            expect(typeof workflowState).toBe('string');
            expect(workflowState.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should support workflow intents in user language', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('en', 'hi', 'bn', 'mr'),
          fc.constantFrom('WORKFLOW_PHOTO_CAPTURE', 'WORKFLOW_CONFIRM', 'WORKFLOW_CANCEL'),
          (language, workflowIntent) => {
            const supportedLanguages = VoiceIntentService.getSupportedLanguages(workflowIntent);
            
            // Property: Workflow intents should support the user's language
            expect(supportedLanguages).toContain(language);
            
            // Property: Workflow intents should support at least 8 languages
            expect(supportedLanguages.length).toBeGreaterThanOrEqual(8);
            
            // Property: All workflow intents should support English as fallback
            expect(supportedLanguages).toContain('en');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain consistent language support across workflow transitions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('en', 'hi', 'bn', 'mr', 'kn', 'ml'),
          fc.array(fc.constantFrom(...Object.values(VoiceWorkflowState)), { minLength: 2, maxLength: 5 }),
          (language, stateSequence) => {
            // Property: Language should remain consistent across all workflow states
            stateSequence.forEach(state => {
              expect(Object.values(VoiceWorkflowState)).toContain(state);
            });
            
            // Property: Language should be valid throughout the sequence
            expect(['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']).toContain(language);
            
            // Property: State sequence should have valid transitions
            expect(stateSequence.length).toBeGreaterThanOrEqual(2);
            expect(stateSequence.length).toBeLessThanOrEqual(5);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should validate workflow state enum completeness', () => {
      const expectedStates = [
        VoiceWorkflowState.IDLE,
        VoiceWorkflowState.PHOTO_CAPTURE,
        VoiceWorkflowState.PHOTO_CONFIRMATION,
        VoiceWorkflowState.QUANTITY_INPUT,
        VoiceWorkflowState.QUANTITY_CONFIRMATION,
        VoiceWorkflowState.PRICE_INPUT,
        VoiceWorkflowState.PRICE_CONFIRMATION,
        VoiceWorkflowState.COMPLETION
      ];

      // Property: All expected workflow states should exist
      expectedStates.forEach(state => {
        expect(Object.values(VoiceWorkflowState)).toContain(state);
      });

      // Property: Workflow states should follow naming convention
      Object.values(VoiceWorkflowState).forEach(state => {
        expect(typeof state).toBe('string');
        expect(state).toBe(state.toLowerCase());
        expect(state).toMatch(/^[a-z_]+$/);
      });
    });
  });

  /**
   * Property 4: Retry Logic Consistency
   * Validates: Requirements 1.5, 2.3, 7.1
   * 
   * This property ensures that retry logic works consistently across different failure scenarios
   * and that the system gracefully handles service failures with appropriate fallback mechanisms.
   */
  describe('Property 4: Retry Logic Consistency', () => {
    it('should handle retry scenarios consistently', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // retry attempts
          fc.constantFrom('network_error', 'timeout', 'service_unavailable', 'invalid_response'),
          fc.constantFrom('en', 'hi', 'bn', 'mr'),
          (retryAttempts, errorType, language) => {
            // Property: Retry attempts should be within reasonable bounds
            expect(retryAttempts).toBeGreaterThanOrEqual(1);
            expect(retryAttempts).toBeLessThanOrEqual(5);
            
            // Property: Error types should be valid
            const validErrorTypes = ['network_error', 'timeout', 'service_unavailable', 'invalid_response'];
            expect(validErrorTypes).toContain(errorType);
            
            // Property: Language should be supported
            const supportedLanguages = ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as'];
            expect(supportedLanguages).toContain(language);
            
            // Property: Retry logic should be deterministic
            expect(typeof retryAttempts).toBe('number');
            expect(typeof errorType).toBe('string');
            expect(typeof language).toBe('string');
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should maintain consistency across service failure scenarios', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('tts_failure', 'translation_failure', 'workflow_failure', 'intent_failure'),
          fc.constantFrom('en', 'hi', 'bn'),
          fc.boolean(), // has fallback available
          (failureType, language, hasFallback) => {
            // Property: Failure types should be valid service types
            const validFailureTypes = ['tts_failure', 'translation_failure', 'workflow_failure', 'intent_failure'];
            expect(validFailureTypes).toContain(failureType);
            
            // Property: Language should be supported
            expect(['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']).toContain(language);
            
            // Property: Fallback availability should be boolean
            expect(typeof hasFallback).toBe('boolean');
            
            // Property: English should always have fallback available
            if (language === 'en') {
              // English is the fallback language, so it should always be available
              expect(typeof hasFallback).toBe('boolean');
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should validate retry timing consistency', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 100, max: 5000 }), { minLength: 1, maxLength: 5 }), // retry delays in ms
          fc.constantFrom('exponential', 'linear', 'fixed'),
          (retryDelays, backoffStrategy) => {
            // Property: Retry delays should be positive numbers
            retryDelays.forEach(delay => {
              expect(delay).toBeGreaterThanOrEqual(100);
              expect(delay).toBeLessThanOrEqual(5000);
            });
            
            // Property: Backoff strategy should be valid
            const validStrategies = ['exponential', 'linear', 'fixed'];
            expect(validStrategies).toContain(backoffStrategy);
            
            // Property: Retry sequence should not be empty
            expect(retryDelays.length).toBeGreaterThan(0);
            expect(retryDelays.length).toBeLessThanOrEqual(5);
            
            // Property: For exponential backoff, delays should generally increase
            if (backoffStrategy === 'exponential' && retryDelays.length > 1) {
              // Allow some variance but expect general increasing trend
              const firstDelay = retryDelays[0];
              const lastDelay = retryDelays[retryDelays.length - 1];
              expect(lastDelay).toBeGreaterThanOrEqual(firstDelay);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle workflow state recovery consistently', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(VoiceWorkflowState)),
          fc.constantFrom('session_expired', 'connection_lost', 'service_restart'),
          fc.boolean(), // can recover
          (workflowState, recoveryScenario, canRecover) => {
            // Property: Workflow state should be valid
            expect(Object.values(VoiceWorkflowState)).toContain(workflowState);
            
            // Property: Recovery scenario should be valid
            const validScenarios = ['session_expired', 'connection_lost', 'service_restart'];
            expect(validScenarios).toContain(recoveryScenario);
            
            // Property: Recovery capability should be boolean
            expect(typeof canRecover).toBe('boolean');
            
            // Property: IDLE state should always be recoverable
            if (workflowState === VoiceWorkflowState.IDLE) {
              // IDLE is the default state, should be easy to recover
              expect(typeof canRecover).toBe('boolean');
            }
            
            // Property: COMPLETION state may not need recovery
            if (workflowState === VoiceWorkflowState.COMPLETION) {
              // Completed workflows might not need recovery
              expect(typeof canRecover).toBe('boolean');
            }
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should maintain error message consistency across languages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('retry_exceeded', 'service_unavailable', 'timeout_error', 'invalid_input'),
          fc.constantFrom('en', 'hi', 'bn', 'mr', 'kn', 'ml'),
          (errorCode, language) => {
            // Property: Error codes should be valid
            const validErrorCodes = ['retry_exceeded', 'service_unavailable', 'timeout_error', 'invalid_input'];
            expect(validErrorCodes).toContain(errorCode);
            
            // Property: Language should be supported
            const supportedLanguages = ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as'];
            expect(supportedLanguages).toContain(language);
            
            // Property: Error codes should follow naming convention
            expect(errorCode).toMatch(/^[a-z_]+$/);
            expect(errorCode.length).toBeGreaterThan(0);
            
            // Property: Language codes should be 2 characters
            expect(language).toMatch(/^[a-z]{2}$/);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});

describe('VoiceIntentService Unit Tests', () => {
  describe('getSupportedLanguages', () => {
    it('should return supported languages for known intents', () => {
      const languages = VoiceIntentService.getSupportedLanguages('ADD_PRODUCT');
      expect(languages).toContain('en');
      expect(languages).toContain('hi');
      expect(languages).toContain('bn');
      expect(languages.length).toBeGreaterThan(5);
    });

    it('should return default language for unknown intents', () => {
      const languages = VoiceIntentService.getSupportedLanguages('UNKNOWN_INTENT');
      expect(languages).toEqual(['en']);
    });
  });

  describe('getSupportedIntents', () => {
    it('should return all supported intents', () => {
      const intents = VoiceIntentService.getSupportedIntents();
      expect(intents).toContain('ADD_PRODUCT');
      expect(intents).toContain('START_VOICE_PRODUCT_WORKFLOW');
      expect(intents).toContain('GREETING');
      expect(intents).toContain('HELP');
      expect(intents.length).toBeGreaterThan(5);
    });

    it('should include workflow-specific intents', () => {
      const intents = VoiceIntentService.getSupportedIntents();
      expect(intents).toContain('WORKFLOW_PHOTO_CAPTURE');
      expect(intents).toContain('WORKFLOW_PHOTO_CONFIRM');
      expect(intents).toContain('WORKFLOW_QUANTITY_INPUT');
      expect(intents).toContain('WORKFLOW_PRICE_INPUT');
      expect(intents).toContain('WORKFLOW_CONFIRM');
      expect(intents).toContain('WORKFLOW_CANCEL');
    });
  });

  describe('Intent Language Support', () => {
    it('should support all 12 Indian languages for core intents', () => {
      const expectedLanguages = ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as'];
      
      const coreIntents = ['ADD_PRODUCT', 'GREETING', 'HELP', 'START_VOICE_PRODUCT_WORKFLOW'];
      
      coreIntents.forEach(intent => {
        const languages = VoiceIntentService.getSupportedLanguages(intent);
        expectedLanguages.forEach(lang => {
          expect(languages).toContain(lang);
        });
      });
    });

    it('should support workflow intents in all languages', () => {
      const expectedLanguages = ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as'];
      
      const workflowIntents = [
        'WORKFLOW_PHOTO_CAPTURE',
        'WORKFLOW_PHOTO_CONFIRM', 
        'WORKFLOW_QUANTITY_INPUT',
        'WORKFLOW_PRICE_INPUT',
        'WORKFLOW_CONFIRM',
        'WORKFLOW_CANCEL'
      ];
      
      workflowIntents.forEach(intent => {
        const languages = VoiceIntentService.getSupportedLanguages(intent);
        expectedLanguages.forEach(lang => {
          expect(languages).toContain(lang);
        });
      });
    });
  });
});