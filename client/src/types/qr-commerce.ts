// Client-side types for Cross-Language QR Commerce

export type SupportedLanguage = 
  | 'en' | 'hi' | 'bn' | 'te' | 'ta' | 'ml' 
  | 'kn' | 'gu' | 'mr' | 'pa' | 'or' | 'as';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as'
];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  bn: 'বাংলা (Bengali)',
  te: 'తెలుగు (Telugu)',
  ta: 'தமிழ் (Tamil)',
  ml: 'മലയാളം (Malayalam)',
  kn: 'ಕನ್ನಡ (Kannada)',
  gu: 'ગુજરાતી (Gujarati)',
  mr: 'मराठी (Marathi)',
  pa: 'ਪੰਜਾਬੀ (Punjabi)',
  or: 'ଓଡ଼ିଆ (Odia)',
  as: 'অসমীয়া (Assamese)'
};

export interface QRSessionData {
  sessionId: string;
  vendorId: string;
  productId: string;
  vendorLanguage: SupportedLanguage;
  customerLanguage?: SupportedLanguage;
  isValid: boolean;
  expiresAt: string;
  status: 'ACTIVE' | 'JOINED' | 'COMPLETED' | 'EXPIRED';
}

export interface NegotiationMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: 'VENDOR' | 'CUSTOMER';
  content: string;
  originalContent: string;
  language: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  type: 'TEXT' | 'VOICE';
  translationStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  audioUrl?: string;
  timestamp: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface NegotiationRoom {
  id: string;
  sessionId: string;
  vendorId: string;
  customerId?: string;
  vendorLanguage: SupportedLanguage;
  customerLanguage?: SupportedLanguage;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  messages: NegotiationMessage[];
  lastMessageAt?: string;
  agreementReached: boolean;
  agreementDetails?: {
    productId: string;
    agreedPrice: number;
    quantity: number;
    deliveryDate?: string;
    specialTerms?: string;
    agreedAt: string;
  };
}

export interface TranslationResult {
  translatedText: string;
  confidence: number;
  originalText: string;
  fromLanguage: SupportedLanguage;
  toLanguage: SupportedLanguage;
  translationProvider: 'BHASHINI' | 'FALLBACK' | 'CACHED';
}

export interface VoiceProcessingResult {
  text: string;
  confidence: number;
  language: SupportedLanguage;
  processingTime: number;
}

export interface MessageInput {
  content: string;
  type: 'TEXT' | 'VOICE';
  language: SupportedLanguage;
  audioData?: Blob;
}

export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  timestamp: string;
}