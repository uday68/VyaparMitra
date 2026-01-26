# Internationalization (i18n) Support Feature Specification

## 🎯 Overview

The i18n Support feature provides comprehensive multilingual capabilities for VyaparMitra, enabling seamless user experiences across 12 Indian languages with context-aware translations, cultural adaptations, and voice-enabled multilingual interactions.

## 🌍 Language Support Matrix

### Supported Languages
**Location**: `client/src/i18n/locales/`

| Language | Code | Script | Speakers | Market Priority |
|----------|------|--------|----------|-----------------|
| English | `en` | Latin | 125M | Primary |
| Hindi | `hi` | Devanagari | 600M | Primary |
| Bengali | `bn` | Bengali | 300M | High |
| Tamil | `ta` | Tamil | 75M | High |
| Telugu | `te` | Telugu | 95M | High |
| Marathi | `mr` | Devanagari | 95M | Medium |
| Gujarati | `gu` | Gujarati | 60M | Medium |
| Kannada | `kn` | Kannada | 50M | Medium |
| Malayalam | `ml` | Malayalam | 35M | Medium |
| Punjabi | `pa` | Gurmukhi | 35M | Medium |
| Odia | `or` | Odia | 45M | Low |
| Assamese | `as` | Assamese | 15M | Low |

### Language Detection Strategy
1. **User Preference**: Stored user language selection
2. **Browser Language**: Accept-Language header detection
3. **Geographic Location**: IP-based language suggestion
4. **Voice Detection**: Automatic language detection from voice input
5. **Fallback Chain**: English → Hindi → Browser default

## 🏗️ i18n Architecture

### React i18next Configuration
**Location**: `client/src/i18n/index.ts`

#### Core Configuration
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    resources: {
      // Dynamic import of translation files
    }
  });
```

#### Translation Loading Strategy
```typescript
// Lazy loading of translation files
const loadTranslations = async (language: string) => {
  try {
    const translations = await import(`./locales/${language}.json`);
    i18n.addResourceBundle(language, 'translation', translations.default);
  } catch (error) {
    console.warn(`Failed to load translations for ${language}`, error);
    // Fallback to English
    if (language !== 'en') {
      await loadTranslations('en');
    }
  }
};
```

### Translation File Structure
**Location**: `client/src/i18n/locales/*.json`

#### Hierarchical Translation Keys
```json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "submit": "Submit",
      "back": "Back"
    },
    "messages": {
      "loading": "Loading...",
      "error": "An error occurred",
      "success": "Operation successful"
    }
  },
  "navigation": {
    "home": "Home",
    "shop": "Shop",
    "negotiations": "Negotiations",
    "profile": "Profile"
  },
  "negotiation": {
    "title": "Price Negotiation",
    "bid": {
      "create": "Make Bid",
      "accept": "Accept Bid",
      "reject": "Reject Bid",
      "counter": "Counter Offer"
    },
    "status": {
      "pending": "Negotiation Pending",
      "accepted": "Bid Accepted",
      "rejected": "Bid Rejected",
      "completed": "Negotiation Completed"
    }
  },
  "voice": {
    "commands": {
      "start_shopping": "Start shopping",
      "add_to_cart": "Add to cart",
      "make_bid": "Make bid for {{amount}}",
      "accept_bid": "Accept bid",
      "help": "Help"
    },
    "feedback": {
      "listening": "Listening...",
      "processing": "Processing your request...",
      "command_recognized": "Command recognized: {{command}}",
      "command_executed": "Command executed successfully"
    }
  },
  "payment": {
    "title": "Payment",
    "methods": {
      "upi": "UPI",
      "card": "Credit/Debit Card",
      "netbanking": "Net Banking",
      "wallet": "Digital Wallet"
    },
    "status": {
      "pending": "Payment Pending",
      "processing": "Processing Payment",
      "completed": "Payment Completed",
      "failed": "Payment Failed"
    }
  }
}
```

## 🎣 Translation Hooks

### Custom Translation Hooks
**Location**: `client/src/hooks/useTranslation.ts`

#### Core Translation Hook
```typescript
export const useTranslation = () => {
  const { t, i18n } = useReactI18next();
  
  const translate = useCallback((key: string, options?: any) => {
    return t(key, options);
  }, [t]);
  
  const changeLanguage = useCallback(async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      localStorage.setItem('preferred-language', language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [i18n]);
  
  return {
    t: translate,
    currentLanguage: i18n.language,
    changeLanguage,
    isRTL: RTL_LANGUAGES.includes(i18n.language)
  };
};
```

#### Specialized Translation Hooks
```typescript
// Error message translations
export const useErrorTranslation = () => {
  const { t } = useTranslation();
  
  const translateError = useCallback((error: Error | string) => {
    const errorKey = typeof error === 'string' ? error : error.message;
    return t(`errors.${errorKey}`, { defaultValue: errorKey });
  }, [t]);
  
  return { translateError };
};

// Voice command translations
export const useVoiceTranslation = () => {
  const { t, currentLanguage } = useTranslation();
  
  const getVoiceCommands = useCallback(() => {
    return {
      startShopping: t('voice.commands.start_shopping'),
      addToCart: t('voice.commands.add_to_cart'),
      makeBid: t('voice.commands.make_bid'),
      acceptBid: t('voice.commands.accept_bid'),
      help: t('voice.commands.help')
    };
  }, [t]);
  
  return { getVoiceCommands, currentLanguage };
};

// Currency and number formatting
export const useLocaleFormatting = () => {
  const { currentLanguage } = useTranslation();
  
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }, [currentLanguage]);
  
  const formatNumber = useCallback((number: number) => {
    return new Intl.NumberFormat(currentLanguage).format(number);
  }, [currentLanguage]);
  
  return { formatCurrency, formatNumber };
};
```

## 🎛️ Language Selector Component

### Language Selector Variants
**Location**: `client/src/components/LanguageSelector.tsx`

#### Component Variants
1. **Default Dropdown**: Full language names with flags
2. **Compact Dropdown**: Language codes with icons
3. **Icon Only**: Minimal space usage
4. **Grid Layout**: Visual language selection
5. **Voice Enabled**: Voice-controlled language switching

#### Implementation
```typescript
interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'icon-only' | 'grid';
  showFlags?: boolean;
  voiceEnabled?: boolean;
  onLanguageChange?: (language: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'default',
  showFlags = true,
  voiceEnabled = false,
  onLanguageChange
}) => {
  const { currentLanguage, changeLanguage } = useTranslation();
  const { speak } = useAudioPlayback();
  
  const handleLanguageChange = async (language: string) => {
    await changeLanguage(language);
    onLanguageChange?.(language);
    
    if (voiceEnabled) {
      const welcomeMessage = t('common.messages.language_changed', { language });
      await speak(welcomeMessage, language);
    }
  };
  
  // Component implementation based on variant
};
```

## 🔄 Backend Translation Integration

### Translation Service
**Location**: `src/services/translation_service.ts`

#### BHASHINI Integration
```typescript
export class TranslationService {
  private static cache = new Map<string, { translation: string; timestamp: number }>();
  private static readonly CACHE_TTL = 3600000; // 1 hour
  
  static async translateText(
    text: string,
    sourceLang: string,
    targetLang: string,
    context?: string
  ): Promise<string> {
    // Check cache first
    const cacheKey = `${text}:${sourceLang}:${targetLang}:${context}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.translation;
    }
    
    try {
      // Primary: BHASHINI API
      const translation = await this.translateWithBhashini(text, sourceLang, targetLang, context);
      
      // Cache the result
      this.cache.set(cacheKey, { translation, timestamp: Date.now() });
      
      return translation;
    } catch (error) {
      // Fallback: Google Translate or Azure
      return await this.translateWithFallback(text, sourceLang, targetLang);
    }
  }
  
  private static async translateWithBhashini(
    text: string,
    sourceLang: string,
    targetLang: string,
    context?: string
  ): Promise<string> {
    const response = await fetch(config.translation.bhashini.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.translation.bhashini.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        source_language: sourceLang,
        target_language: targetLang,
        context: context || 'general',
        domain: 'commerce'
      })
    });
    
    const result = await response.json();
    return result.translated_text;
  }
}
```

#### Context-Aware Translation
```typescript
// Translation contexts for better accuracy
export enum TranslationContext {
  NEGOTIATION = 'negotiation',
  PAYMENT = 'payment',
  PRODUCT = 'product',
  GREETING = 'greeting',
  ERROR = 'error',
  VOICE_COMMAND = 'voice_command'
}

// Context-specific translation
const translateWithContext = async (
  text: string,
  context: TranslationContext,
  targetLanguage: string
) => {
  const contextualPrompts = {
    [TranslationContext.NEGOTIATION]: 'This is about price negotiation in a marketplace',
    [TranslationContext.PAYMENT]: 'This is about payment processing and transactions',
    [TranslationContext.PRODUCT]: 'This is about product descriptions and specifications',
    [TranslationContext.VOICE_COMMAND]: 'This is a voice command for e-commerce actions'
  };
  
  return await TranslationService.translateText(
    text,
    'en',
    targetLanguage,
    contextualPrompts[context]
  );
};
```

## 🎤 Voice-i18n Integration

### Multilingual Voice Commands
**Location**: `src/services/voice_intent.ts`

#### Language-Specific Intent Recognition
```typescript
export class VoiceIntentService {
  private static readonly intentMappings: Record<string, IntentMapping[]> = {
    'hi': [
      {
        patterns: ['खरीदारी शुरू करें', 'शॉपिंग शुरू करें'],
        intent: 'START_SHOPPING',
        confidence: 0.9
      },
      {
        patterns: ['कार्ट में जोड़ें', 'कार्ट में डालें'],
        intent: 'ADD_TO_CART',
        confidence: 0.85
      }
    ],
    'bn': [
      {
        patterns: ['কেনাকাটা শুরু করুন', 'শপিং শুরু করুন'],
        intent: 'START_SHOPPING',
        confidence: 0.9
      }
    ],
    'ta': [
      {
        patterns: ['வாங்குதலை தொடங்கவும்', 'ஷாப்பிங் தொடங்கவும்'],
        intent: 'START_SHOPPING',
        confidence: 0.9
      }
    ]
    // ... other languages
  };
  
  static async recognizeIntent(
    text: string,
    language: string
  ): Promise<IntentResult> {
    const mappings = this.intentMappings[language] || this.intentMappings['en'];
    
    for (const mapping of mappings) {
      for (const pattern of mapping.patterns) {
        if (this.matchesPattern(text, pattern)) {
          return {
            intent: mapping.intent,
            confidence: mapping.confidence,
            language,
            originalText: text
          };
        }
      }
    }
    
    // Fallback to English if no match in target language
    if (language !== 'en') {
      const translatedText = await TranslationService.translateText(text, language, 'en');
      return await this.recognizeIntent(translatedText, 'en');
    }
    
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      language,
      originalText: text
    };
  }
}
```

### Multilingual TTS Integration
```typescript
// Language-specific TTS configuration
const getTTSConfig = (language: string) => {
  const configs = {
    'hi': { voice: 'hi-IN-Wavenet-A', speed: 1.0, pitch: 0 },
    'bn': { voice: 'bn-IN-Wavenet-A', speed: 1.0, pitch: 0 },
    'ta': { voice: 'ta-IN-Wavenet-A', speed: 1.0, pitch: 0 },
    'te': { voice: 'te-IN-Standard-A', speed: 1.0, pitch: 0 },
    'en': { voice: 'en-IN-Wavenet-A', speed: 1.0, pitch: 0 }
  };
  
  return configs[language] || configs['en'];
};
```

## 🎨 UI/UX Localization

### RTL Language Support
```typescript
// Right-to-left language detection
const RTL_LANGUAGES = ['ar', 'he', 'fa']; // Future expansion

// CSS-in-JS RTL support
const getDirectionStyles = (language: string) => ({
  direction: RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr',
  textAlign: RTL_LANGUAGES.includes(language) ? 'right' : 'left'
});
```

### Cultural Adaptations
```typescript
// Date and time formatting
const formatDateTime = (date: Date, language: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  // Cultural calendar preferences
  const calendar = language === 'hi' ? 'indian' : 'gregory';
  
  return new Intl.DateTimeFormat(language, { ...options, calendar }).format(date);
};

// Number system preferences
const formatNumber = (number: number, language: string) => {
  // Use Indian numbering system for Indian languages
  const useIndianNumbering = ['hi', 'bn', 'ta', 'te', 'mr', 'gu'].includes(language);
  
  if (useIndianNumbering && number >= 100000) {
    // Format as lakhs and crores
    return formatIndianNumber(number);
  }
  
  return new Intl.NumberFormat(language).format(number);
};
```

## 📊 i18n Performance Optimization

### Translation Caching Strategy
```typescript
// Client-side translation caching
class TranslationCache {
  private cache = new Map<string, any>();
  private readonly maxSize = 1000;
  
  set(key: string, value: any) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  get(key: string) {
    return this.cache.get(key);
  }
}

// Preload critical translations
const preloadCriticalTranslations = async (language: string) => {
  const criticalKeys = [
    'common.buttons',
    'navigation',
    'voice.commands',
    'payment.methods'
  ];
  
  for (const key of criticalKeys) {
    await i18n.loadNamespaces(key);
  }
};
```

### Bundle Optimization
```typescript
// Dynamic import of translation files
const loadLanguageBundle = async (language: string) => {
  try {
    const bundle = await import(
      /* webpackChunkName: "locale-[request]" */
      `../i18n/locales/${language}.json`
    );
    return bundle.default;
  } catch (error) {
    console.warn(`Failed to load language bundle for ${language}`);
    return null;
  }
};
```

## 🧪 i18n Testing Strategy

### Translation Testing
```typescript
// Translation completeness testing
describe('Translation Completeness', () => {
  const languages = ['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as'];
  const englishKeys = getAllTranslationKeys('en');
  
  languages.forEach(language => {
    it(`should have all translations for ${language}`, () => {
      const languageKeys = getAllTranslationKeys(language);
      expect(languageKeys).toEqual(expect.arrayContaining(englishKeys));
    });
  });
});

// Voice command testing
describe('Multilingual Voice Commands', () => {
  it('should recognize voice commands in all languages', async () => {
    const testCases = [
      { text: 'खरीदारी शुरू करें', language: 'hi', expectedIntent: 'START_SHOPPING' },
      { text: 'কেনাকাটা শুরু করুন', language: 'bn', expectedIntent: 'START_SHOPPING' },
      { text: 'வாங்குதலை தொடங்கவும்', language: 'ta', expectedIntent: 'START_SHOPPING' }
    ];
    
    for (const testCase of testCases) {
      const result = await VoiceIntentService.recognizeIntent(testCase.text, testCase.language);
      expect(result.intent).toBe(testCase.expectedIntent);
      expect(result.confidence).toBeGreaterThan(0.8);
    }
  });
});
```

## 📈 i18n Analytics

### Language Usage Tracking
```typescript
// Track language usage patterns
const trackLanguageUsage = (language: string, feature: string) => {
  logger.info('Language usage tracked', {
    event: 'language_usage',
    language,
    feature,
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId()
  });
};

// Translation performance monitoring
const trackTranslationPerformance = (
  sourceLang: string,
  targetLang: string,
  duration: number,
  success: boolean
) => {
  logger.info('Translation performance', {
    event: 'translation_performance',
    sourceLang,
    targetLang,
    duration,
    success,
    timestamp: new Date().toISOString()
  });
};
```

## 🚀 Future i18n Enhancements

### Phase 1 (Next Release)
- **Regional Dialects**: Support for regional variations
- **Voice Accent Training**: Accent-specific voice recognition
- **Cultural Calendar**: Festival and holiday awareness
- **Local Currency**: Regional currency preferences

### Phase 2 (Future Releases)
- **AI Translation**: Context-aware AI translation
- **Real-time Translation**: Live conversation translation
- **Image Text Translation**: OCR with translation
- **Offline Translation**: Local translation capabilities

This specification ensures comprehensive multilingual support for VyaparMitra, enabling seamless user experiences across India's diverse linguistic landscape while maintaining cultural sensitivity and technical performance.