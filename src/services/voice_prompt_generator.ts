import { logger } from '../utils/logger';

export interface VoicePromptContext {
  productName?: string;
  quantity?: number;
  price?: number;
  unit?: string;
  currency?: string;
  userName?: string;
}

export class VoicePromptGenerator {
  private static readonly prompts = {
    photo_captured: {
      en: "Photo captured! Is this the product you want to add?",
      hi: "फोटो खींची गई! क्या यह वह प्रोडक्ट है जिसे आप जोड़ना चाहते हैं?",
      bn: "ছবি তোলা হয়েছে! এটি কি সেই পণ্য যা আপনি যোগ করতে চান?",
      mr: "फोटो काढला गेला! हे ते उत्पादन आहे जे तुम्ही जोडू इच्छिता?",
      kn: "ಫೋಟೋ ತೆಗೆಯಲಾಗಿದೆ! ಇದು ನೀವು ಸೇರಿಸಲು ಬಯಸುವ ಉತ್ಪನ್ನವೇ?",
      ml: "ഫോട്ടോ എടുത്തു! ഇതാണോ നിങ്ങൾ ചേർക്കാൻ ആഗ്രഹിക്കുന്ന ഉൽപ്പാദനം?",
      gu: "ફોટો લેવાયો! શું આ તે ઉત્પાદન છે જે તમે ઉમેરવા માંગો છો?",
      pa: "ਫੋਟੋ ਖਿੱਚੀ ਗਈ! ਕੀ ਇਹ ਉਹ ਉਤਪਾਦ ਹੈ ਜੋ ਤੁਸੀਂ ਜੋੜਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
      ta: "புகைப்படம் எடுக்கப்பட்டது! இதுதான் நீங்கள் சேர்க்க விரும்பும் தயாரிப்பா?",
      te: "ఫోటో తీయబడింది! ఇది మీరు జోడించాలనుకుంటున్న ఉత్పత్తేనా?",
      or: "ଫଟୋ ନିଆଗଲା! ଏହା ସେହି ଉତ୍ପାଦ ଯାହା ଆପଣ ଯୋଗ କରିବାକୁ ଚାହୁଁଛନ୍ତି?",
      as: "ফটো তোলা হ'ল! এইটো সেই সামগ্ৰী নেকি যি আপুনি যোগ কৰিব বিচাৰে?"
    },
    photo_retake: {
      en: "Let me take another photo. Please hold the product clearly in view.",
      hi: "मैं एक और फोटो लेता हूं। कृपया प्रोडक्ट को साफ दिखाई देने वाली जगह पर रखें।",
      bn: "আমি আরেকটি ছবি তুলি। অনুগ্রহ করে পণ্যটি স্পষ্টভাবে দেখা যায় এমনভাবে ধরুন।",
      mr: "मी आणखी एक फोटो काढतो. कृपया उत्पादन स्पष्टपणे दिसेल अशा ठिकाणी ठेवा.",
      kn: "ನಾನು ಇನ್ನೊಂದು ಫೋಟೋ ತೆಗೆಯುತ್ತೇನೆ. ದಯವಿಟ್ಟು ಉತ್ಪನ್ನವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುವಂತೆ ಹಿಡಿಯಿರಿ.",
      ml: "ഞാൻ മറ്റൊരു ഫോട്ടോ എടുക്കുന്നു. ദയവായി ഉൽപ്പാദനം വ്യക്തമായി കാണാവുന്ന രീതിയിൽ പിടിക്കുക.",
      gu: "હું બીજો ફોટો લઉં છું. કૃપા કરીને ઉત્પાદનને સ્પષ્ટ રીતે દેખાય તેવી રીતે પકડો.",
      pa: "ਮੈਂ ਇੱਕ ਹੋਰ ਫੋਟੋ ਲੈਂਦਾ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਉਤਪਾਦ ਨੂੰ ਸਪੱਸ਼ਟ ਰੂਪ ਵਿੱਚ ਦਿਖਾਈ ਦੇਣ ਵਾਲੀ ਜਗ੍ਹਾ ਤੇ ਰੱਖੋ।",
      ta: "நான் மற்றொரு புகைப்படம் எடுக்கிறேன். தயவுசெய்து தயாரிப்பை தெளிவாக காணும்படி பிடிக்கவும்.",
      te: "నేను మరొక ఫోటో తీస్తాను. దయచేసి ఉత్పత్తిని స్పష్టంగా కనిపించేలా పట్టుకోండి.",
      or: "ମୁଁ ଆଉ ଏକ ଫଟୋ ନେଉଛି। ଦୟାକରି ଉତ୍ପାଦକୁ ସ୍ପଷ୍ଟ ଭାବରେ ଦେଖାଯିବା ପାଇଁ ଧରନ୍ତୁ।",
      as: "মই আৰু এখন ফটো লওঁ। অনুগ্ৰহ কৰি সামগ্ৰীটো স্পষ্টভাৱে দেখা পোৱাকৈ ধৰক।"
    },
    quantity_request: {
      en: "Please tell me the quantity of this product.",
      hi: "कृपया मुझे इस प्रोडक्ट की मात्रा बताएं।",
      bn: "অনুগ্রহ করে আমাকে এই পণ্যের পরিমাণ বলুন।",
      mr: "कृपया मला या उत्पादनाचे प्रमाण सांगा.",
      kn: "ದಯವಿಟ್ಟು ಈ ಉತ್ಪನ್ನದ ಪ್ರಮಾಣವನ್ನು ಹೇಳಿ.",
      ml: "ദയവായി ഈ ഉൽപ്പാദനത്തിന്റെ അളവ് പറയുക.",
      gu: "કૃપા કરીને મને આ ઉત્પાદનનો જથ્થો કહો.",
      pa: "ਕਿਰਪਾ ਕਰਕੇ ਮੈਨੂੰ ਇਸ ਉਤਪਾਦ ਦੀ ਮਾਤਰਾ ਦੱਸੋ।",
      ta: "தயவுசெய்து இந்த தயாரிப்பின் அளவை சொல்லுங்கள்.",
      te: "దయచేసి ఈ ఉత్పత్తి పరిమాణాన్ని చెప్పండి.",
      or: "ଦୟାକରି ମୋତେ ଏହି ଉତ୍ପାଦର ପରିମାଣ କୁହନ୍ତୁ।",
      as: "অনুগ্ৰহ কৰি মোক এই সামগ্ৰীৰ পৰিমাণ কওক।"
    },
    quantity_confirmation: {
      en: "You said {{quantity}} {{unit}}. Is this correct?",
      hi: "आपने {{quantity}} {{unit}} कहा। क्या यह सही है?",
      bn: "আপনি {{quantity}} {{unit}} বলেছেন। এটি কি সঠিক?",
      mr: "तुम्ही {{quantity}} {{unit}} म्हणालात. हे बरोबर आहे का?",
      kn: "ನೀವು {{quantity}} {{unit}} ಎಂದು ಹೇಳಿದ್ದೀರಿ. ಇದು ಸರಿಯೇ?",
      ml: "നിങ്ങൾ {{quantity}} {{unit}} എന്ന് പറഞ്ഞു. ഇത് ശരിയാണോ?",
      gu: "તમે {{quantity}} {{unit}} કહ્યું. શું આ સાચું છે?",
      pa: "ਤੁਸੀਂ {{quantity}} {{unit}} ਕਿਹਾ। ਕੀ ਇਹ ਸਹੀ ਹੈ?",
      ta: "நீங்கள் {{quantity}} {{unit}} என்று சொன்னீர்கள். இது சரியா?",
      te: "మీరు {{quantity}} {{unit}} అన్నారు. ఇది సరైనదేనా?",
      or: "ଆପଣ {{quantity}} {{unit}} କହିଲେ। ଏହା ଠିକ୍ ଅଛି କି?",
      as: "আপুনি {{quantity}} {{unit}} ক'লে। এইটো শুদ্ধ নেকি?"
    },
    price_request: {
      en: "What is the price per {{unit}} for this product in rupees?",
      hi: "इस प्रोडक्ट की प्रति {{unit}} कीमत रुपए में क्या है?",
      bn: "এই পণ্যের প্রতি {{unit}} দাম টাকায় কত?",
      mr: "या उत्पादनाची प्रति {{unit}} किंमत रुपयांमध्ये काय आहे?",
      kn: "ಈ ಉತ್ಪನ್ನದ ಪ್ರತಿ {{unit}} ಬೆಲೆ ರೂಪಾಯಿಗಳಲ್ಲಿ ಎಷ್ಟು?",
      ml: "ഈ ഉൽപ്പാദനത്തിന്റെ ഓരോ {{unit}} ന്റെ വില രൂപയിൽ എത്രയാണ്?",
      gu: "આ ઉત્પાદનની પ્રતિ {{unit}} કિંમત રૂપિયામાં કેટલી છે?",
      pa: "ਇਸ ਉਤਪਾਦ ਦੀ ਪ੍ਰਤੀ {{unit}} ਕੀਮਤ ਰੁਪਿਆਂ ਵਿੱਚ ਕੀ ਹੈ?",
      ta: "இந்த தயாரிப்பின் ஒரு {{unit}} க்கு ரூபாயில் விலை என்ன?",
      te: "ఈ ఉత్పత్తి ప్రతి {{unit}} కు రూపాయలలో ధర ఎంత?",
      or: "ଏହି ଉତ୍ପାଦର ପ୍ରତି {{unit}} ମୂଲ୍ୟ ଟଙ୍କାରେ କେତେ?",
      as: "এই সামগ্ৰীৰ প্ৰতি {{unit}} মূল্য টকাত কিমান?"
    },
    price_confirmation: {
      en: "You said ₹{{price}} per {{unit}}. Is this correct?",
      hi: "आपने ₹{{price}} प्रति {{unit}} कहा। क्या यह सही है?",
      bn: "আপনি ₹{{price}} প্রতি {{unit}} বলেছেন। এটি কি সঠিক?",
      mr: "तुम्ही ₹{{price}} प्रति {{unit}} म्हणालात. हे बरोबर आहे का?",
      kn: "ನೀವು ₹{{price}} ಪ್ರತಿ {{unit}} ಎಂದು ಹೇಳಿದ್ದೀರಿ. ಇದು ಸರಿಯೇ?",
      ml: "നിങ്ങൾ ₹{{price}} ഓരോ {{unit}} എന്ന് പറഞ്ഞു. ഇത് ശരിയാണോ?",
      gu: "તમે ₹{{price}} પ્રતિ {{unit}} કહ્યું. શું આ સાચું છે?",
      pa: "ਤੁਸੀਂ ₹{{price}} ਪ੍ਰਤੀ {{unit}} ਕਿਹਾ। ਕੀ ਇਹ ਸਹੀ ਹੈ?",
      ta: "நீங்கள் ₹{{price}} ஒரு {{unit}} க்கு என்று சொன்னீர்கள். இது சரியா?",
      te: "మీరు ₹{{price}} ప్రతి {{unit}} అన్నారు. ఇది సరైనదేనా?",
      or: "ଆପଣ ₹{{price}} ପ୍ରତି {{unit}} କହିଲେ। ଏହା ଠିକ୍ ଅଛି କି?",
      as: "আপুনি ₹{{price}} প্ৰতি {{unit}} ক'লে। এইটো শুদ্ধ নেকি?"
    },
    completion_success: {
      en: "Perfect! Your product has been added successfully. You can find it in your inventory.",
      hi: "बहुत बढ़िया! आपका प्रोडक्ট सफलतापूर्वक जोड़ दिया गया है। आप इसे अपनी इन्वेंटरी में देख सकते हैं।",
      bn: "নিখুঁত! আপনার পণ্য সফলভাবে যোগ করা হয়েছে। আপনি এটি আপনার ইনভেন্টরিতে খুঁজে পেতে পারেন।",
      mr: "उत्तम! तुमचे उत्पादन यशस्वीरित्या जोडले गेले आहे. तुम्ही ते तुमच्या इन्व्हेंटरीमध्ये पाहू शकता.",
      kn: "ಪರಿಪೂರ್ಣ! ನಿಮ್ಮ ಉತ್ಪನ್ನವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ. ನೀವು ಅದನ್ನು ನಿಮ್ಮ ದಾಸ್ತಾನುಗಳಲ್ಲಿ ಕಾಣಬಹುದು.",
      ml: "മികച്ചത്! നിങ്ങളുടെ ഉൽപ്പാദനം വിജയകരമായി ചേർത്തു. നിങ്ങൾക്ക് അത് നിങ്ങളുടെ ഇൻവെന്ററിയിൽ കാണാം.",
      gu: "સંપૂર્ણ! તમારું ઉત્પાદન સફળતાપૂર્વક ઉમેરાયું છે. તમે તેને તમારી ઇન્વેન્ટરીમાં શોધી શકો છો.",
      pa: "ਸੰਪੂਰਨ! ਤੁਹਾਡਾ ਉਤਪਾਦ ਸਫਲਤਾਪੂਰਵਕ ਜੋੜਿਆ ਗਿਆ ਹੈ। ਤੁਸੀਂ ਇਸਨੂੰ ਆਪਣੀ ਇਨਵੈਂਟਰੀ ਵਿੱਚ ਦੇਖ ਸਕਦੇ ਹੋ।",
      ta: "சரியானது! உங்கள் தயாரிப்பு வெற்றிகரமாக சேர்க்கப்பட்டது. நீங்கள் அதை உங்கள் சரக்குகளில் காணலாம்.",
      te: "పరిపూర్ణం! మీ ఉత్పత్తి విజయవంతంగా జోడించబడింది. మీరు దానిని మీ ఇన్వెంటరీలో కనుగొనవచ్చు.",
      or: "ସମ୍ପୂର୍ଣ୍ଣ! ଆପଣଙ୍କର ଉତ୍ପାଦ ସଫଳତାର ସହିତ ଯୋଗ କରାଯାଇଛି। ଆପଣ ଏହାକୁ ଆପଣଙ୍କର ଇନଭେଣ୍ଟରୀରେ ପାଇପାରିବେ।",
      as: "নিখুঁত! আপোনাৰ সামগ্ৰী সফলতাৰে যোগ কৰা হৈছে। আপুনি ইয়াক আপোনাৰ তালিকাত বিচাৰি পাব পাৰে।"
    },
    error_retry: {
      en: "I didn't understand that. Please try again.",
      hi: "मुझे समझ नहीं आया। कृपया फिर से कोशिश करें।",
      bn: "আমি বুঝতে পারিনি। অনুগ্রহ করে আবার চেষ্টা করুন।",
      mr: "मला समजले नाही. कृपया पुन्हा प्रयत्न करा.",
      kn: "ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      ml: "എനിക്ക് മനസ്സിലായില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
      gu: "મને સમજાયું નહીં. કૃપા કરીને ફરી પ્રયાસ કરો.",
      pa: "ਮੈਨੂੰ ਸਮਝ ਨਹੀਂ ਆਇਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
      ta: "எனக்கு புரியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
      te: "నాకు అర్థం కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
      or: "ମୁଁ ବୁଝିପାରିଲି ନାହିଁ। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
      as: "মই বুজি নাপালোঁ। অনুগ্ৰহ কৰি আকৌ চেষ্টা কৰক।"
    },
    fallback_manual: {
      en: "Let's switch to manual input. You can type the information instead.",
      hi: "चलिए मैनुअल इनपुट पर स्विच करते हैं। आप जानकारी टाइप कर सकते हैं।",
      bn: "চলুন ম্যানুয়াল ইনপুটে স্যুইচ করি। আপনি তথ্য টাইপ করতে পারেন।",
      mr: "चला मॅन्युअल इनपुटवर स्विच करूया. तुम्ही माहिती टाइप करू शकता.",
      kn: "ಮ್ಯಾನುಯಲ್ ಇನ್‌ಪುಟ್‌ಗೆ ಬದಲಾಯಿಸೋಣ. ನೀವು ಮಾಹಿತಿಯನ್ನು ಟೈಪ್ ಮಾಡಬಹುದು.",
      ml: "മാനുവൽ ഇൻപുട്ടിലേക്ക് മാറാം. നിങ്ങൾക്ക് വിവരങ്ങൾ ടൈപ്പ് ചെയ്യാം.",
      gu: "ચાલો મેન્યુઅલ ઇનપુટ પર સ્વિચ કરીએ. તમે માહિતી ટાઇપ કરી શકો છો.",
      pa: "ਚਲੋ ਮੈਨੁਅਲ ਇਨਪੁਟ 'ਤੇ ਸਵਿੱਚ ਕਰਦੇ ਹਾਂ। ਤੁਸੀਂ ਜਾਣਕਾਰੀ ਟਾਈਪ ਕਰ ਸਕਦੇ ਹੋ।",
      ta: "கைமுறை உள்ளீட்டிற்கு மாறுவோம். நீங்கள் தகவலை தட்டச்சு செய்யலாம்.",
      te: "మాన్యువల్ ఇన్‌పుట్‌కు మారుదాం. మీరు సమాచారాన్ని టైప్ చేయవచ్చు.",
      or: "ଚାଲ ମାନୁଆଲ ଇନପୁଟକୁ ସୁଇଚ କରିବା। ଆପଣ ସୂଚନା ଟାଇପ କରିପାରିବେ।",
      as: "চলক মেনুৱেল ইনপুটলৈ সলনি কৰোঁ। আপুনি তথ্য টাইপ কৰিব পাৰে।"
    }
  };

  /**
   * Generate a voice prompt for the given type and language
   */
  static generatePrompt(
    promptType: string,
    language: string,
    context?: VoicePromptContext
  ): string {
    const promptTemplates = this.prompts[promptType as keyof typeof this.prompts];
    
    if (!promptTemplates) {
      logger.warn('Unknown prompt type requested', { promptType, language });
      return this.prompts.error_retry[language as keyof typeof this.prompts.error_retry] || 
             this.prompts.error_retry.en;
    }

    let template = promptTemplates[language as keyof typeof promptTemplates] || 
                   promptTemplates.en;

    // Replace template variables with context values
    if (context) {
      template = this.replaceTemplateVariables(template, context);
    }

    logger.debug('Generated voice prompt', { promptType, language, template });
    return template;
  }

  /**
   * Replace template variables in the prompt with actual values
   */
  private static replaceTemplateVariables(
    template: string,
    context: VoicePromptContext
  ): string {
    let result = template;

    // Replace common variables
    if (context.quantity !== undefined) {
      result = result.replace(/\{\{quantity\}\}/g, context.quantity.toString());
    }
    
    if (context.price !== undefined) {
      result = result.replace(/\{\{price\}\}/g, context.price.toString());
    }
    
    if (context.unit) {
      result = result.replace(/\{\{unit\}\}/g, context.unit);
    }
    
    if (context.currency) {
      result = result.replace(/\{\{currency\}\}/g, context.currency);
    }
    
    if (context.productName) {
      result = result.replace(/\{\{productName\}\}/g, context.productName);
    }
    
    if (context.userName) {
      result = result.replace(/\{\{userName\}\}/g, context.userName);
    }

    return result;
  }

  /**
   * Get all available prompt types
   */
  static getAvailablePromptTypes(): string[] {
    return Object.keys(this.prompts);
  }

  /**
   * Get supported languages for prompts
   */
  static getSupportedLanguages(): string[] {
    return ['en', 'hi', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa', 'ta', 'te', 'or', 'as'];
  }

  /**
   * Check if a language is supported
   */
  static isLanguageSupported(language: string): boolean {
    return this.getSupportedLanguages().includes(language);
  }

  /**
   * Get currency symbol for Indian context
   */
  static getCurrencySymbol(language: string): string {
    // All Indian languages use the rupee symbol
    return '₹';
  }

  /**
   * Get appropriate unit translations
   */
  static getUnitTranslation(unit: string, language: string): string {
    const unitTranslations: Record<string, Record<string, string>> = {
      kg: {
        en: 'kg', hi: 'किलो', bn: 'কেজি', mr: 'किलो', kn: 'ಕೆಜಿ',
        ml: 'കിലോ', gu: 'કિલો', pa: 'ਕਿਲੋ', ta: 'கிலோ', te: 'కిలో',
        or: 'କିଲୋ', as: 'কিলো'
      },
      pcs: {
        en: 'pieces', hi: 'पीस', bn: 'পিস', mr: 'पीस', kn: 'ಪೀಸ್',
        ml: 'പീസ്', gu: 'પીસ', pa: 'ਪੀਸ', ta: 'பீஸ்', te: 'పీస్',
        or: 'ପିସ', as: 'পিচ'
      },
      ltr: {
        en: 'liters', hi: 'लीटर', bn: 'লিটার', mr: 'लिटर', kn: 'ಲೀಟರ್',
        ml: 'ലിറ്റർ', gu: 'લિટર', pa: 'ਲਿਟਰ', ta: 'லிட்டர்', te: 'లీటర్',
        or: 'ଲିଟର', as: 'লিটাৰ'
      },
      box: {
        en: 'boxes', hi: 'बॉक्स', bn: 'বক্স', mr: 'बॉक्स', kn: 'ಬಾಕ್ಸ್',
        ml: 'ബോക്സ്', gu: 'બોક્સ', pa: 'ਬਾਕਸ', ta: 'பாக்ஸ்', te: 'బాక్స్',
        or: 'ବକ୍ସ', as: 'বক্স'
      }
    };

    return unitTranslations[unit]?.[language] || unit;
  }

  /**
   * Generate context-aware prompts based on workflow state
   */
  static generateContextualPrompt(
    promptType: string,
    language: string,
    context: VoicePromptContext,
    attemptCount: number = 1
  ): string {
    let basePrompt = this.generatePrompt(promptType, language, context);

    // Add attempt-specific context for retries
    if (attemptCount > 1) {
      const retryPrompts = {
        en: "Let me try again. ",
        hi: "मैं फिर से कोशिश करता हूं। ",
        bn: "আমি আবার চেষ্টা করি। ",
        mr: "मी पुन्हा प्रयत्न करतो. ",
        kn: "ನಾನು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸುತ್ತೇನೆ. ",
        ml: "ഞാൻ വീണ്ടും ശ്രമിക്കുന്നു. ",
        gu: "હું ફરી પ્રયાસ કરું છું. ",
        pa: "ਮੈਂ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰਦਾ ਹਾਂ। ",
        ta: "நான் மீண்டும் முயற்சிக்கிறேன். ",
        te: "నేను మళ్లీ ప్రయత్నిస్తాను. ",
        or: "ମୁଁ ପୁଣି ଚେଷ୍ଟା କରୁଛି। ",
        as: "মই আকৌ চেষ্টা কৰোঁ। "
      };

      const retryPrefix = retryPrompts[language as keyof typeof retryPrompts] || retryPrompts.en;
      basePrompt = retryPrefix + basePrompt;
    }

    return basePrompt;
  }
}