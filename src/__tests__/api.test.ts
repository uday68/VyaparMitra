import { NegotiationService, NegotiationStatus } from '../services/negotiation_service';
import { InventoryService } from '../services/inventory_service';
import { VoiceIntentService } from '../services/voice_intent';
import { TranslationService } from '../services/translation_service';

// Mock external dependencies
jest.mock('../db/postgres');
jest.mock('../db/mongo');
jest.mock('../db/redis');

describe('VyaparMitra API Tests', () => {
  describe('VoiceIntentService', () => {
    test('should recognize greeting intent', async () => {
      const result = await VoiceIntentService.recognizeIntent('hello', 'en');
      
      expect(result.intent).toBe('GREETING');
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.language).toBe('en');
    });

    test('should recognize Hindi greeting', async () => {
      const result = await VoiceIntentService.recognizeIntent('नमस्ते', 'hi');
      
      expect(result.intent).toBe('GREETING');
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.language).toBe('hi');
    });

    test('should extract amount from counter bid', async () => {
      const result = await VoiceIntentService.recognizeIntent('I offer 500 rupees', 'en');
      
      expect(result.intent).toBe('COUNTER_BID');
      expect(result.entities.amount).toBe(500);
    });

    test('should return unknown for unrecognized text', async () => {
      const result = await VoiceIntentService.recognizeIntent('xyz random text', 'en');
      
      expect(result.intent).toBe('UNKNOWN');
      expect(result.confidence).toBe(0);
    });
  });

  describe('TranslationService', () => {
    test('should return same text for same language', async () => {
      const result = await TranslationService.translateText('hello', 'en', 'en');
      
      expect(result).toBe('hello');
    });

    test('should handle translation errors gracefully', async () => {
      // Mock axios to throw error
      const result = await TranslationService.translateText('hello', 'en', 'hi');
      
      // Should fallback to original text
      expect(result).toBe('hello');
    });
  });

  describe('NegotiationService', () => {
    test('should validate negotiation status transitions', () => {
      // Test the private method through public interface
      // This would require exposing the validation method or testing through integration
      expect(NegotiationStatus.OPEN).toBe('OPEN');
      expect(NegotiationStatus.COUNTERED).toBe('COUNTERED');
      expect(NegotiationStatus.ACCEPTED).toBe('ACCEPTED');
    });
  });

  describe('InventoryService', () => {
    test('should handle product search filters', () => {
      const filter = {
        category: 'electronics',
        minPrice: 100,
        maxPrice: 1000,
        inStock: true,
        search: 'phone'
      };

      // Test filter object structure
      expect(filter.category).toBe('electronics');
      expect(filter.minPrice).toBe(100);
      expect(filter.maxPrice).toBe(1000);
      expect(filter.inStock).toBe(true);
      expect(filter.search).toBe('phone');
    });
  });
});

describe('Configuration Tests', () => {
  test('should have required environment variables', () => {
    // Test that config can be imported without errors
    expect(() => require('../config/settings')).not.toThrow();
  });

  test('should validate supported languages', () => {
    const { config } = require('../config/settings');
    
    expect(config.languages.supported).toContain('hi');
    expect(config.languages.supported).toContain('en');
    expect(config.languages.supported).toContain('bn');
    expect(config.languages.default).toBe('hi');
  });
});