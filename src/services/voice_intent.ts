import { TranslationService } from './translation_service';
import { TTSService } from '../voice/tts_service';
import { VoiceWorkflowService, VoiceWorkflowState, VoiceProductWorkflow } from './voice_workflow_service';
import { logger } from '../utils/logger';

export interface VoiceIntentRequest {
  audioData: Buffer;
  userLanguage?: string;
  userId?: string;
  userType?: 'vendor' | 'customer';
  sessionId?: string; // For workflow context
}

export interface VoiceIntentResponse {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  originalText: string;
  translatedText?: string;
  detectedLanguage: string;
  audioResponse?: string;
  workflowState?: VoiceWorkflowState; // Current workflow state
  sessionId?: string; // Workflow session ID
}

export interface IntentMapping {
  patterns: string[];
  intent: string;
  requiredEntities?: string[];
  supportedLanguages: string[];
}

export class VoiceIntentService {
  private static readonly intentMappings: IntentMapping[] = [
    {
      patterns: [
        'add product', 'नया प्रोडक्ट जोड़ें', 'নতুন পণ্য যোগ করুন', 'नवीन उत्पादन जोडा',
        'ಹೊಸ ಉತ್ಪಾದನೆ ಸೇರಿಸಿ', 'പുതിയ ഉൽപ്പാദനം ചേർക്കുക', 'নতুন পণ্য যোগ করুন',
        'નવું ઉત્પાદન ઉમેરો', 'ਨਵਾਂ ਉਤਪਾਦ ਜੋੜੋ', 'புதிய தயாரிப்பு சேர்க்கவும்',
        'కొత్త ఉత్పత్తిని జోడించండి', 'নতুন পণ্য যোগ করুন'
      ],
      intent: 'ADD_PRODUCT',
      requiredEntities: ['product_name', 'price'],
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    // Workflow-specific intents for product addition
    {
      patterns: [
        'start voice product', 'voice add product', 'आवाज़ से प्रोडक्ट जोड़ें', 'কণ্ঠস্বর দিয়ে পণ্য যোগ করুন',
        'आवाजाने उत्पादन जोडा', 'ಧ್ವನಿಯಿಂದ ಉತ್ಪಾದನೆ ಸೇರಿಸಿ', 'ശബ്ദത്തിലൂടെ ഉൽപ്പാദനം ചേർക്കുക',
        'અવાજથી ઉત્પાદન ઉમેરો', 'ਆਵਾਜ਼ ਨਾਲ ਉਤਪਾਦ ਜੋੜੋ', 'குரல் மூலம் தயாரிப்பு சேர்க்கவும்',
        'వాయిస్‌తో ఉత్పత్తిని జోడించండి', 'কণ্ঠস্বর দিয়ে পণ্য যোগ করুন'
      ],
      intent: 'START_VOICE_PRODUCT_WORKFLOW',
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'take photo', 'capture image', 'फोटो लें', 'ছবি তুলুন', 'फोटो घ्या',
        'ಫೋಟೋ ತೆಗೆಯಿರಿ', 'ഫോട്ടോ എടുക്കുക', 'ছবি তুলুন',
        'ફોટો લો', 'ਫੋਟੋ ਲਓ', 'புகைப்படம் எடுக்கவும்',
        'ఫోటో తీయండి', 'ছবি তুলুন'
      ],
      intent: 'WORKFLOW_PHOTO_CAPTURE',
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'confirm photo', 'photo ok', 'फोटो ठीक है', 'ছবি ঠিক আছে', 'फोटो बरोबर आहे',
        'ಫೋಟೋ ಸರಿ ಇದೆ', 'ഫോട്ടോ ശരിയാണ്', 'ছবি ঠিক আছে',
        'ફોટો બરાબર છે', 'ਫੋਟੋ ਠੀਕ ਹੈ', 'புகைப்படம் சரி',
        'ఫోటో సరైనది', 'ছবি ঠিক আছে'
      ],
      intent: 'WORKFLOW_PHOTO_CONFIRM',
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'retake photo', 'photo again', 'फोटो दोबारा लें', 'আবার ছবি তুলুন', 'फोटो पुन्हा घ्या',
        'ಮತ್ತೆ ಫೋಟೋ ತೆಗೆಯಿರಿ', 'വീണ്ടും ഫോട്ടോ എടുക്കുക', 'আবার ছবি তুলুন',
        'ફરીથી ફોટો લો', 'ਫਿਰ ਫੋਟੋ ਲਓ', 'மீண்டும் புகைப்படம் எடுக்கவும்',
        'మళ్లీ ఫోటో తీయండి', 'আবার ছবি তুলুন'
      ],
      intent: 'WORKFLOW_PHOTO_RETAKE',
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'quantity', 'मात्रा', 'পরিমাণ', 'प्रमाण',
        'ಪ್ರಮಾಣ', 'അളവ്', 'পরিমাণ',
        'માત્રા', 'ਮਾਤਰਾ', 'அளவு',
        'పరిమాణం', 'পরিমাণ'
      ],
      intent: 'WORKFLOW_QUANTITY_INPUT',
      requiredEntities: ['quantity', 'unit'],
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'price', 'cost', 'कीमत', 'দাম', 'किंमत',
        'ಬೆಲೆ', 'വില', 'দাম',
        'કિંમત', 'ਕੀਮਤ', 'விலை',
        'ధర', 'দাম'
      ],
      intent: 'WORKFLOW_PRICE_INPUT',
      requiredEntities: ['price'],
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'confirm', 'yes', 'ok', 'हाँ', 'ठीक है', 'হ্যাঁ', 'ঠিক আছে', 'होय', 'बरोबर',
        'ಹೌದು', 'ಸರಿ', 'അതെ', 'ശരി', 'હા', 'બરાબર',
        'ਹਾਂ', 'ਠੀਕ', 'ஆம்', 'சரி', 'అవును', 'సరే',
        'হ্যাঁ', 'ঠিক'
      ],
      intent: 'WORKFLOW_CONFIRM',
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'cancel', 'stop', 'exit', 'रद्द करें', 'बंद करें', 'বাতিল করুন', 'বন্ধ করুন', 'रद्द करा', 'बंद करा',
        'ರದ್ದುಮಾಡಿ', 'ನಿಲ್ಲಿಸಿ', 'റദ്ദാക്കുക', 'നിർത്തുക', 'રદ કરો', 'બંધ કરો',
        'ਰੱਦ ਕਰੋ', 'ਬੰਦ ਕਰੋ', 'ரத்து செய்யவும்', 'நிறுத்தவும்', 'రద్దు చేయండి', 'ఆపండి',
        'বাতিল করুন', 'বন্ধ করুন'
      ],
      intent: 'WORKFLOW_CANCEL',
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'start negotiation', 'बातचीत शुरू करें', 'আলোচনা শুরু করুন', 'वाटाघाटी सुरू करा',
        'ಮಾತುಕತೆ ಪ್ರಾರಂಭಿಸಿ', 'ചർച്ച ആരംഭിക്കുക', 'আলোচনা শুরু করুন',
        'વાટાઘાટ શરૂ કરો', 'ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰੋ', 'பேச்சுவார்த்தை தொடங்கவும்',
        'చర్చను ప్రారంభించండి', 'আলোচনা শুরু করুন'
      ],
      intent: 'START_NEGOTIATION',
      requiredEntities: ['product_id'],
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'accept bid', 'बोली स्वीकार करें', 'বিড গ্রহণ করুন', 'बिड स्वीकारा',
        'ಬಿಡ್ ಸ್ವೀಕರಿಸಿ', 'ബിഡ് സ്വീകരിക്കുക', 'বিড গ্রহণ করুন',
        'બિડ સ્વીકારો', 'ਬਿਡ ਸਵੀਕਾਰ ਕਰੋ', 'ஏலத்தை ஏற்கவும்',
        'బిడ్‌ను అంగీకరించండి', 'বিড গ্রহণ করুন'
      ],
      intent: 'ACCEPT_BID',
      requiredEntities: ['bid_id'],
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'reject bid', 'बोली अस्वीकार करें', 'বিড প্রত্যাখ্যান করুন', 'बिड नाकारा',
        'ಬಿಡ್ ತಿರಸ್ಕರಿಸಿ', 'ബിഡ് നിരസിക്കുക', 'বিড প্রত্যাখ্যান করুন',
        'બિડ નકારો', 'ਬਿਡ ਰੱਦ ਕਰੋ', 'ஏலத்தை நிராகரிக்கவும்',
        'బిడ్‌ను తిరస్కరించండి', 'বিড প্রত্যাখ্যান করুন'
      ],
      intent: 'REJECT_BID',
      requiredEntities: ['bid_id'],
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'counter bid', 'काउंटर बोली', 'পাল্টা বিড', 'काउंटर बिड',
        'ಕೌಂಟರ್ ಬಿಡ್', 'കൗണ്ടർ ബിഡ്', 'পাল্টা বিড',
        'કાઉન્ટર બિડ', 'ਕਾਊਂਟਰ ਬਿਡ', 'எதிர் ஏலம்',
        'కౌంటర్ బిడ్', 'পাল্টা বিড'
      ],
      intent: 'COUNTER_BID',
      requiredEntities: ['bid_id', 'new_price'],
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'check stock', 'स्टॉक चेक करें', 'স্টক চেক করুন', 'स्टॉक तपासा',
        'ಸ್ಟಾಕ್ ಪರಿಶೀಲಿಸಿ', 'സ്റ്റോക്ക് പരിശോധിക്കുക', 'স্টক চেক করুন',
        'સ્ટોક તપાસો', 'ਸਟਾਕ ਚੈੱਕ ਕਰੋ', 'பங்கு சரிபார்க்கவும்',
        'స్టాక్ తనిఖీ చేయండి', 'স্টক চেক করুন'
      ],
      intent: 'CHECK_STOCK',
      requiredEntities: ['product_name'],
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'help', 'मदद', 'সাহায্য', 'मदत',
        'ಸಹಾಯ', 'സഹായം', 'সাহায্য',
        'મદદ', 'ਮਦਦ', 'உதவி',
        'సహాయం', 'সাহায্য'
      ],
      intent: 'HELP',
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    },
    {
      patterns: [
        'greeting', 'hello', 'hi', 'नमस्ते', 'হ্যালো', 'नमस्कार',
        'ನಮಸ್ಕಾರ', 'നമസ്കാരം', 'হ্যালো',
        'નમસ્તે', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'வணக்கம்',
        'నమస్కారం', 'নমস্কার'
      ],
      intent: 'GREETING',
      supportedLanguages: ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as']
    }
  ];

  // Language detection patterns
  private static readonly languagePatterns = {
    'hi': ['है', 'में', 'का', 'की', 'को', 'से', 'पर', 'और', 'या', 'नहीं'],
    'bn': ['আছে', 'এর', 'তে', 'কে', 'থেকে', 'এবং', 'বা', 'না', 'হয়', 'করে'],
    'mr': ['आहे', 'मध्ये', 'चा', 'ची', 'ला', 'पासून', 'आणि', 'किंवा', 'नाही', 'करते'],
    'kn': ['ಇದೆ', 'ನಲ್ಲಿ', 'ದ', 'ಗೆ', 'ಇಂದ', 'ಮತ್ತು', 'ಅಥವಾ', 'ಇಲ್ಲ', 'ಮಾಡುತ್ತದೆ'],
    'ml': ['ഉണ്ട്', 'ൽ', 'ന്റെ', 'ക്ക്', 'ൽ നിന്ന്', 'ഉം', 'അല്ലെങ്കിൽ', 'ഇല്ല', 'ചെയ്യുന്നു'],
    'gu': ['છે', 'માં', 'નું', 'ને', 'થી', 'અને', 'અથવા', 'નથી', 'કરે છે'],
    'pa': ['ਹੈ', 'ਵਿੱਚ', 'ਦਾ', 'ਨੂੰ', 'ਤੋਂ', 'ਅਤੇ', 'ਜਾਂ', 'ਨਹੀਂ', 'ਕਰਦਾ'],
    'ta': ['உள்ளது', 'இல்', 'ன்', 'க்கு', 'இருந்து', 'மற்றும்', 'அல்லது', 'இல்லை', 'செய்கிறது'],
    'te': ['ఉంది', 'లో', 'యొక్క', 'కు', 'నుండి', 'మరియు', 'లేదా', 'లేదు', 'చేస్తుంది'],
    'or': ['ଅଛି', 'ରେ', 'ର', 'କୁ', 'ରୁ', 'ଏବଂ', 'କିମ୍ବା', 'ନାହିଁ', 'କରେ'],
    'as': ['আছে', 'ত', 'ৰ', 'ক', 'ৰ পৰা', 'আৰু', 'বা', 'নাই', 'কৰে']
  };

  static async processVoiceIntent(request: VoiceIntentRequest): Promise<VoiceIntentResponse> {
    try {
      // Step 1: Get workflow context if session exists
      let workflowContext: VoiceProductWorkflow | null = null;
      if (request.sessionId) {
        workflowContext = await VoiceWorkflowService.getWorkflowSession(request.sessionId);
      }

      // Step 2: Convert audio to text (Speech-to-Text)
      const speechToTextResult = await this.speechToText(request.audioData, request.userLanguage);
      
      // Step 3: Detect language if not provided
      const detectedLanguage = request.userLanguage || workflowContext?.language || this.detectLanguage(speechToTextResult.text);
      
      // Step 4: Translate to English for intent processing if needed
      let processableText = speechToTextResult.text;
      let translatedText: string | undefined;
      
      if (detectedLanguage !== 'en') {
        translatedText = await TranslationService.translateText(
          speechToTextResult.text,
          detectedLanguage,
          'en'
        );
        processableText = translatedText;
      }

      // Step 5: Extract intent and entities with workflow context
      const intentResult = this.extractIntent(processableText, detectedLanguage, workflowContext);
      
      // Step 6: Process workflow state transitions
      const workflowResult = await this.processWorkflowTransition(
        intentResult,
        workflowContext,
        request.userId,
        detectedLanguage
      );

      // Step 7: Generate audio response in user's language
      const responseText = this.generateResponse(
        intentResult.intent,
        detectedLanguage,
        workflowResult.workflowState
      );
      const audioResponse = await TTSService.speakMultilingual(
        responseText,
        detectedLanguage,
        request.userId,
        request.userType
      );

      logger.info('Voice intent processed successfully', {
        originalText: speechToTextResult.text,
        detectedLanguage,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        workflowState: workflowResult.workflowState,
        sessionId: workflowResult.sessionId,
        userId: request.userId
      });

      return {
        intent: intentResult.intent,
        entities: intentResult.entities,
        confidence: intentResult.confidence,
        originalText: speechToTextResult.text,
        translatedText,
        detectedLanguage,
        audioResponse: audioResponse.audioUrl,
        workflowState: workflowResult.workflowState,
        sessionId: workflowResult.sessionId
      };

    } catch (error) {
      logger.error('Voice intent processing failed', { error, userId: request.userId });
      throw error;
    }
  }

  private static async speechToText(audioData: Buffer, preferredLanguage?: string): Promise<{ text: string; confidence: number }> {
    // This would integrate with actual STT service (Google Speech-to-Text, Azure, etc.)
    // For now, returning mock data
    
    // In production, you would:
    // 1. Send audioData to STT service with language hint
    // 2. Get transcription with confidence score
    // 3. Return the result
    
    return {
      text: "मुझे सेब दिखाओ", // Mock Hindi text
      confidence: 0.95
    };
  }

  private static detectLanguage(text: string): string {
    let maxScore = 0;
    let detectedLanguage = 'en';

    // Check for language-specific patterns
    for (const [lang, patterns] of Object.entries(this.languagePatterns)) {
      let score = 0;
      for (const pattern of patterns) {
        if (text.includes(pattern)) {
          score++;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = lang;
      }
    }

    // If no patterns match, check Unicode ranges
    if (maxScore === 0) {
      detectedLanguage = this.detectLanguageByUnicode(text);
    }

    logger.debug('Language detected', { text, detectedLanguage, score: maxScore });
    return detectedLanguage;
  }

  private static detectLanguageByUnicode(text: string): string {
    const unicodeRanges = {
      'hi': /[\u0900-\u097F]/,  // Devanagari
      'bn': /[\u0980-\u09FF]/,  // Bengali
      'gu': /[\u0A80-\u0AFF]/,  // Gujarati
      'pa': /[\u0A00-\u0A7F]/,  // Gurmukhi
      'or': /[\u0B00-\u0B7F]/,  // Oriya
      'ta': /[\u0B80-\u0BFF]/,  // Tamil
      'te': /[\u0C00-\u0C7F]/,  // Telugu
      'kn': /[\u0C80-\u0CFF]/,  // Kannada
      'ml': /[\u0D00-\u0D7F]/,  // Malayalam
      'as': /[\u0980-\u09FF]/,  // Assamese (shares Bengali range)
      'mr': /[\u0900-\u097F]/   // Marathi (shares Devanagari range)
    };

    for (const [lang, regex] of Object.entries(unicodeRanges)) {
      if (regex.test(text)) {
        return lang;
      }
    }

    return 'en'; // Default to English
  }

  private static extractIntent(text: string, language: string, workflowContext?: VoiceProductWorkflow | null): { intent: string; entities: Record<string, any>; confidence: number } {
    const normalizedText = text.toLowerCase().trim();
    let bestMatch = { intent: 'UNKNOWN', confidence: 0, entities: {} };

    // If we're in a workflow, prioritize workflow-specific intents
    if (workflowContext) {
      const workflowIntents = this.getWorkflowSpecificIntents(workflowContext.state);
      for (const intent of workflowIntents) {
        const mapping = this.intentMappings.find(m => m.intent === intent);
        if (mapping && mapping.supportedLanguages.includes(language)) {
          for (const pattern of mapping.patterns) {
            const similarity = this.calculateSimilarity(normalizedText, pattern.toLowerCase());
            if (similarity > bestMatch.confidence) {
              bestMatch = {
                intent: mapping.intent,
                confidence: similarity,
                entities: this.extractEntities(normalizedText, mapping.requiredEntities || [])
              };
            }
          }
        }
      }
    }

    // If no workflow-specific match found, check all intents
    if (bestMatch.confidence < 0.5) {
      for (const mapping of this.intentMappings) {
        if (!mapping.supportedLanguages.includes(language)) {
          continue;
        }

        for (const pattern of mapping.patterns) {
          const similarity = this.calculateSimilarity(normalizedText, pattern.toLowerCase());
          
          if (similarity > bestMatch.confidence) {
            bestMatch = {
              intent: mapping.intent,
              confidence: similarity,
              entities: this.extractEntities(normalizedText, mapping.requiredEntities || [])
            };
          }
        }
      }
    }

    return bestMatch;
  }

  private static calculateSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation - in production, use more sophisticated NLP
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matches++;
          break;
        }
      }
    }

    return matches / Math.max(words1.length, words2.length);
  }

  private static extractEntities(text: string, requiredEntities: string[]): Record<string, any> {
    const entities: Record<string, any> = {};

    // Simple entity extraction - in production, use NER models
    for (const entityType of requiredEntities) {
      switch (entityType) {
        case 'product_name':
          // Extract product names (fruits, vegetables, etc.)
          const productPatterns = ['apple', 'banana', 'mango', 'सेब', 'केला', 'आम'];
          for (const pattern of productPatterns) {
            if (text.includes(pattern)) {
              entities.product_name = pattern;
              break;
            }
          }
          break;
          
        case 'price':
          // Extract price mentions
          const priceMatch = text.match(/(\d+)\s*(रुपए|rupees|rs|₹)/i);
          if (priceMatch) {
            entities.price = parseInt(priceMatch[1]);
          }
          break;

        case 'quantity':
          // Extract quantity mentions
          const quantityMatch = text.match(/(\d+)\s*(kg|किलो|kilo|gram|ग्राम|piece|टुकड़े)/i);
          if (quantityMatch) {
            entities.quantity = parseInt(quantityMatch[1]);
          }
          break;

        case 'unit':
          // Extract unit mentions
          const unitMatch = text.match(/(kg|किलो|kilo|gram|ग्राम|piece|टुकड़े|liter|लीटर)/i);
          if (unitMatch) {
            entities.unit = unitMatch[1];
          }
          break;
          
        case 'bid_id':
          // Extract bid IDs
          const bidMatch = text.match(/bid\s*(\w+)/i);
          if (bidMatch) {
            entities.bid_id = bidMatch[1];
          }
          break;
          
        case 'product_id':
          // Extract product IDs
          const productMatch = text.match(/product\s*(\w+)/i);
          if (productMatch) {
            entities.product_id = productMatch[1];
          }
          break;
      }
    }

    return entities;
  }

  /**
   * Get workflow-specific intents based on current state
   */
  private static getWorkflowSpecificIntents(state: VoiceWorkflowState): string[] {
    switch (state) {
      case VoiceWorkflowState.PHOTO_CAPTURE:
        return ['WORKFLOW_PHOTO_CAPTURE', 'WORKFLOW_CANCEL'];
      case VoiceWorkflowState.PHOTO_CONFIRMATION:
        return ['WORKFLOW_PHOTO_CONFIRM', 'WORKFLOW_PHOTO_RETAKE', 'WORKFLOW_CANCEL'];
      case VoiceWorkflowState.QUANTITY_INPUT:
        return ['WORKFLOW_QUANTITY_INPUT', 'WORKFLOW_CANCEL'];
      case VoiceWorkflowState.QUANTITY_CONFIRMATION:
        return ['WORKFLOW_CONFIRM', 'WORKFLOW_QUANTITY_INPUT', 'WORKFLOW_CANCEL'];
      case VoiceWorkflowState.PRICE_INPUT:
        return ['WORKFLOW_PRICE_INPUT', 'WORKFLOW_CANCEL'];
      case VoiceWorkflowState.PRICE_CONFIRMATION:
        return ['WORKFLOW_CONFIRM', 'WORKFLOW_PRICE_INPUT', 'WORKFLOW_CANCEL'];
      default:
        return ['START_VOICE_PRODUCT_WORKFLOW', 'ADD_PRODUCT'];
    }
  }

  /**
   * Process workflow state transitions based on intent
   */
  private static async processWorkflowTransition(
    intentResult: { intent: string; entities: Record<string, any>; confidence: number },
    workflowContext: VoiceProductWorkflow | null,
    userId?: string,
    language?: string
  ): Promise<{ workflowState?: VoiceWorkflowState; sessionId?: string }> {
    
    // Handle workflow start
    if (intentResult.intent === 'START_VOICE_PRODUCT_WORKFLOW' && !workflowContext && userId && language) {
      const newWorkflow = await VoiceWorkflowService.createWorkflowSession(userId, language);
      return {
        workflowState: newWorkflow.state,
        sessionId: newWorkflow.sessionId
      };
    }

    // Handle workflow cancellation
    if (intentResult.intent === 'WORKFLOW_CANCEL' && workflowContext) {
      await VoiceWorkflowService.completeWorkflow(workflowContext.sessionId);
      return { workflowState: VoiceWorkflowState.IDLE };
    }

    // Handle workflow state transitions
    if (workflowContext) {
      let newState = workflowContext.state;
      let updateData: Partial<VoiceProductWorkflow['data']> = {};

      switch (workflowContext.state) {
        case VoiceWorkflowState.PHOTO_CAPTURE:
          if (intentResult.intent === 'WORKFLOW_PHOTO_CAPTURE') {
            newState = VoiceWorkflowState.PHOTO_CONFIRMATION;
          }
          break;

        case VoiceWorkflowState.PHOTO_CONFIRMATION:
          if (intentResult.intent === 'WORKFLOW_PHOTO_CONFIRM') {
            newState = VoiceWorkflowState.QUANTITY_INPUT;
          } else if (intentResult.intent === 'WORKFLOW_PHOTO_RETAKE') {
            newState = VoiceWorkflowState.PHOTO_CAPTURE;
          }
          break;

        case VoiceWorkflowState.QUANTITY_INPUT:
          if (intentResult.intent === 'WORKFLOW_QUANTITY_INPUT' && intentResult.entities.quantity) {
            updateData.quantity = intentResult.entities.quantity;
            updateData.unit = intentResult.entities.unit || 'piece';
            newState = VoiceWorkflowState.QUANTITY_CONFIRMATION;
          }
          break;

        case VoiceWorkflowState.QUANTITY_CONFIRMATION:
          if (intentResult.intent === 'WORKFLOW_CONFIRM') {
            newState = VoiceWorkflowState.PRICE_INPUT;
          } else if (intentResult.intent === 'WORKFLOW_QUANTITY_INPUT') {
            updateData.quantity = intentResult.entities.quantity;
            updateData.unit = intentResult.entities.unit || workflowContext.data.unit;
          }
          break;

        case VoiceWorkflowState.PRICE_INPUT:
          if (intentResult.intent === 'WORKFLOW_PRICE_INPUT' && intentResult.entities.price) {
            updateData.price = intentResult.entities.price;
            newState = VoiceWorkflowState.PRICE_CONFIRMATION;
          }
          break;

        case VoiceWorkflowState.PRICE_CONFIRMATION:
          if (intentResult.intent === 'WORKFLOW_CONFIRM') {
            newState = VoiceWorkflowState.COMPLETION;
          } else if (intentResult.intent === 'WORKFLOW_PRICE_INPUT') {
            updateData.price = intentResult.entities.price;
          }
          break;
      }

      // Update workflow state if changed
      if (newState !== workflowContext.state || Object.keys(updateData).length > 0) {
        const updatedWorkflow = await VoiceWorkflowService.updateWorkflowState(
          workflowContext.sessionId,
          newState,
          updateData
        );
        return {
          workflowState: updatedWorkflow.state,
          sessionId: updatedWorkflow.sessionId
        };
      }

      return {
        workflowState: workflowContext.state,
        sessionId: workflowContext.sessionId
      };
    }

    return {};
  }

  private static generateResponse(intent: string, language: string, workflowState?: VoiceWorkflowState): string {
    // Handle workflow-specific responses
    if (workflowState) {
      const workflowResponses = this.getWorkflowResponses(workflowState, language);
      if (workflowResponses) {
        return workflowResponses;
      }
    }

    const responses = {
      'ADD_PRODUCT': {
        'en': 'I\'ll help you add a new product to your inventory.',
        'hi': 'मैं आपको अपनी इन्वेंटरी में नया प्रोडक्ट जोड़ने में मदद करूंगा।',
        'bn': 'আমি আপনাকে আপনার ইনভেন্টরিতে নতুন পণ্য যোগ করতে সাহায্য করব।',
        'mr': 'मी तुम्हाला तुमच्या इन्व्हेंटरीमध्ये नवीन उत्पादन जोडण्यात मदत करेन।'
      },
      'START_VOICE_PRODUCT_WORKFLOW': {
        'en': 'Starting voice-guided product addition. Let\'s begin by taking a photo of your product.',
        'hi': 'आवाज़-निर्देशित प्रोडक्ट जोड़ना शुरू कर रहे हैं। आइए अपने प्रोडक्ट की फोटो लेकर शुरुआत करते हैं।',
        'bn': 'ভয়েস-গাইডেড পণ্য সংযোজন শুরু করছি। আপনার পণ্যের ছবি তুলে শুরু করা যাক।',
        'mr': 'आवाज-मार्गदर्शित उत्पादन जोडणे सुरू करत आहे. आपल्या उत्पादनाचा फोटो घेऊन सुरुवात करूया.'
      },
      'START_NEGOTIATION': {
        'en': 'Starting price negotiation for the selected product.',
        'hi': 'चुने गए प्रोडक्ट के लिए मूल्य बातचीत शुरू कर रहा हूं।',
        'bn': 'নির্বাচিত পণ্যের জন্য দাম আলোচনা শুরু করছি।',
        'mr': 'निवडलेल्या उत्पादनासाठी किंमत वाटाघाटी सुरू करत आहे।'
      },
      'ACCEPT_BID': {
        'en': 'Bid accepted successfully. Proceeding with the transaction.',
        'hi': 'बोली सफलतापूर्वक स्वीकार की गई। लेनदेन के साथ आगे बढ़ रहे हैं।',
        'bn': 'বিড সফলভাবে গৃহীত হয়েছে। লেনদেনের সাথে এগিয়ে চলেছি।',
        'mr': 'बिड यशस्वीरित्या स्वीकारली गेली. व्यवहारासह पुढे जात आहे।'
      },
      'REJECT_BID': {
        'en': 'Bid rejected. You can make a counter offer.',
        'hi': 'बोली अस्वीकार की गई। आप काউंटर ऑफर कर सकते हैं।',
        'bn': 'বিড প্রত্যাখ্যান করা হয়েছে। আপনি একটি পাল্টা অফার করতে পারেন।',
        'mr': 'बिड नाकारली गेली. तुम्ही काउंटर ऑफर करू शकता.'
      },
      'HELP': {
        'en': 'I can help you with product management, negotiations, and inventory. What would you like to do?',
        'hi': 'मैं प्रोडक्ट मैनेजमेंट, बातचीत और इन्वेंटरी में आपकी मदद कर सकता हूं। आप क्या करना चाहते हैं?',
        'bn': 'আমি পণ্য ব্যবস্থাপনা, আলোচনা এবং ইনভেন্টরিতে আপনাকে সাহায্য করতে পারি। আপনি কী করতে চান?',
        'mr': 'मी उत्पादन व्यवस्थापन, वाटाघाटी आणि इन्व्हेंटरीमध्ये तुमची मदत करू शकतो. तुम्हाला काय करायचे आहे?'
      },
      'GREETING': {
        'en': 'Hello! Welcome to VyaparMitra. How can I assist you today?',
        'hi': 'नमस्ते! व्यापारमित्र में आपका स्वागत है। आज मैं आपकी कैसे सहायता कर सकता हूं?',
        'bn': 'হ্যালো! ব্যাপারমিত্রে স্वাগতম। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
        'mr': 'नमस्कार! व्यापारमित्रामध्ये तुमचे स्वागत आहे. आज मी तुमची कशी मदत करू शकतो?'
      },
      'UNKNOWN': {
        'en': 'I didn\'t understand that. Could you please repeat or try a different command?',
        'hi': 'मुझे समझ नहीं आया। कृपया दोहराएं या कोई अलग कमांड आज़माएं?',
        'bn': 'আমি বুঝতে পারিনি। অনুগ্রহ করে পুনরাবৃত্তি করুন বা একটি ভিন্ন কমান্ড চেষ্টা করুন?',
        'mr': 'मला समजले नाही. कृपया पुन्हा सांगा किंवा वेगळी कमांड वापरून पहा?'
      }
    };

    const intentResponses = responses[intent as keyof typeof responses] || responses.UNKNOWN;
    return intentResponses[language as keyof typeof intentResponses] || intentResponses.en;
  }

  /**
   * Get workflow-specific responses based on state
   */
  private static getWorkflowResponses(state: VoiceWorkflowState, language: string): string | null {
    const workflowResponses: Record<VoiceWorkflowState, Record<string, string>> = {
      [VoiceWorkflowState.IDLE]: {
        'en': 'Ready to help you add products. Say "start voice product" to begin.',
        'hi': 'प्रोडक्ट जोड़ने में आपकी मदद करने के लिए तैयार हूं। शुरू करने के लिए "आवाज़ से प्रोडक्ट शुरू करें" कहें।',
        'bn': 'পণ্য যোগ করতে আপনাকে সাহায্য করার জন্য প্রস্তুত। শুরু করতে "ভয়েস প্রোডাক্ট শুরু করুন" বলুন।',
        'mr': 'उत्पादने जोडण्यात तुमची मदत करण्यासाठी तयार आहे. सुरुवात करण्यासाठी "आवाज उत्पादन सुरू करा" म्हणा.'
      },
      [VoiceWorkflowState.PHOTO_CAPTURE]: {
        'en': 'Please take a photo of your product. Say "take photo" when ready.',
        'hi': 'कृपया अपने प्रोडक्ट की फोटो लें। तैयार होने पर "फोटो लें" कहें।',
        'bn': 'অনুগ্রহ করে আপনার পণ্যের ছবি তুলুন। প্রস্তুত হলে "ছবি তুলুন" বলুন।',
        'mr': 'कृपया आपल्या उत्पादनाचा फोटो घ्या. तयार झाल्यावर "फोटो घ्या" म्हणा.'
      },
      [VoiceWorkflowState.PHOTO_CONFIRMATION]: {
        'en': 'Photo captured! Please confirm if the photo looks good or say "retake photo" to try again.',
        'hi': 'फोटो ली गई! कृपया पुष्टि करें कि फोटो अच्छी लग रही है या दोबारा कोशिश करने के लिए "फोटो दोबारा लें" कहें।',
        'bn': 'ছবি তোলা হয়েছে! অনুগ্রহ করে নিশ্চিত করুন যে ছবিটি ভাল লাগছে বা আবার চেষ্টা করতে "আবার ছবি তুলুন" বলুন।',
        'mr': 'फोटो घेतला गेला! कृपया पुष्टी करा की फोटो चांगला दिसत आहे किंवा पुन्हा प्रयत्न करण्यासाठी "फोटो पुन्हा घ्या" म्हणा.'
      },
      [VoiceWorkflowState.QUANTITY_INPUT]: {
        'en': 'Great! Now please tell me the quantity and unit. For example, "5 kilograms" or "10 pieces".',
        'hi': 'बहुत बढ़िया! अब कृपया मुझे मात्रा और इकाई बताएं। उदाहरण के लिए, "5 किलोग्राम" या "10 टुकड़े"।',
        'bn': 'দুর্দান্ত! এখন অনুগ্রহ করে আমাকে পরিমাণ এবং একক বলুন। উদাহরণস্বরূপ, "৫ কিলোগ্রাম" বা "১০ টুকরা"।',
        'mr': 'छान! आता कृपया मला प्रमाण आणि एकक सांगा. उदाहरणार्थ, "५ किलोग्राम" किंवा "१० तुकडे".'
      },
      [VoiceWorkflowState.QUANTITY_CONFIRMATION]: {
        'en': 'I heard the quantity. Please confirm if this is correct or provide the quantity again.',
        'hi': 'मैंने मात्रा सुनी। कृपया पुष्टि करें कि यह सही है या मात्रा फिर से बताएं।',
        'bn': 'আমি পরিমাণ শুনেছি। অনুগ্রহ করে নিশ্চিত করুন যে এটি সঠিক বা আবার পরিমাণ প্রদান করুন।',
        'mr': 'मी प्रमाण ऐकले. कृपया पुष्टी करा की हे बरोबर आहे किंवा प्रमाण पुन्हा द्या.'
      },
      [VoiceWorkflowState.PRICE_INPUT]: {
        'en': 'Perfect! Now please tell me the price per unit. For example, "50 rupees per kilogram".',
        'hi': 'बिल्कुल सही! अब कृपया मुझे प्रति इकाई कीमत बताएं। उदाहरण के लिए, "50 रुपए प्रति किलोग्राम"।',
        'bn': 'নিখুঁত! এখন অনুগ্রহ করে আমাকে প্রতি ইউনিট দাম বলুন। উদাহরণস্বরূপ, "প্রতি কিলোগ্রাম ৫০ টাকা"।',
        'mr': 'परफेक्ट! आता कृपया मला प्रति युनिट किंमत सांगा. उदाहरणार्थ, "प्रति किलोग्राम ५० रुपये".'
      },
      [VoiceWorkflowState.PRICE_CONFIRMATION]: {
        'en': 'I heard the price. Please confirm if this is correct or provide the price again.',
        'hi': 'मैंने कीमत सुनी। कृपया पुष्टि करें कि यह सही है या कीमत फिर से बताएं।',
        'bn': 'আমি দাম শুনেছি। অনুগ্রহ করে নিশ্চিত করুন যে এটি সঠিক বা আবার দাম প্রদান করুন।',
        'mr': 'मी किंमत ऐकली. कृपया पुष्टी करा की ही बरोबर आहे किंवा किंमत पुन्हा द्या.'
      },
      [VoiceWorkflowState.COMPLETION]: {
        'en': 'Excellent! Your product has been added successfully. You can now add another product or return to the main menu.',
        'hi': 'बहुत बढ़िया! आपका प्रोडक्ट सफलतापूर्वक जोड़ दिया गया है। अब आप दूसरा प्रोडक्ट जोड़ सकते हैं या मुख्य मेनू पर वापस जा सकते हैं।',
        'bn': 'চমৎকার! আপনার পণ্য সফলভাবে যোগ করা হয়েছে। আপনি এখন আরেকটি পণ্য যোগ করতে পারেন বা মূল মেনুতে ফিরে যেতে পারেন।',
        'mr': 'उत्कृष्ट! तुमचे उत्पादन यशस्वीरित्या जोडले गेले आहे. तुम्ही आता दुसरे उत्पादन जोडू शकता किंवा मुख्य मेनूवर परत जाऊ शकता.'
      }
    };

    const stateResponses = workflowResponses[state];
    if (stateResponses) {
      return stateResponses[language] || stateResponses.en;
    }

    return null;
  }

  // Get supported languages for a specific intent
  static getSupportedLanguages(intent: string): string[] {
    const mapping = this.intentMappings.find(m => m.intent === intent);
    return mapping?.supportedLanguages || ['en'];
  }

  // Get all supported intents
  static getSupportedIntents(): string[] {
    return this.intentMappings.map(m => m.intent);
  }

  // Workflow session management methods
  
  /**
   * Start a new voice workflow session
   */
  static async startWorkflowSession(userId: string, language: string): Promise<VoiceProductWorkflow> {
    return await VoiceWorkflowService.createWorkflowSession(userId, language);
  }

  /**
   * Get active workflow session for user
   */
  static async getWorkflowSession(sessionId: string): Promise<VoiceProductWorkflow | null> {
    return await VoiceWorkflowService.getWorkflowSession(sessionId);
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserActiveSessions(userId: string): Promise<VoiceProductWorkflow[]> {
    return await VoiceWorkflowService.getUserActiveSessions(userId);
  }

  /**
   * Complete workflow session
   */
  static async completeWorkflowSession(sessionId: string): Promise<boolean> {
    return await VoiceWorkflowService.completeWorkflow(sessionId);
  }

  /**
   * Update workflow state manually (for external triggers like photo capture)
   */
  static async updateWorkflowState(
    sessionId: string,
    newState: VoiceWorkflowState,
    data?: Partial<VoiceProductWorkflow['data']>
  ): Promise<VoiceProductWorkflow> {
    return await VoiceWorkflowService.updateWorkflowState(sessionId, newState, data);
  }

  // Health check
  static async isHealthy(): Promise<boolean> {
    try {
      // Test basic functionality
      const testResult = this.extractIntent('hello', 'en');
      const workflowHealthy = await VoiceWorkflowService.isHealthy();
      return testResult.intent === 'GREETING' && workflowHealthy;
    } catch (error) {
      logger.error('Voice intent service health check failed', { error });
      return false;
    }
  }
}