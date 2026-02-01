// Cross-Language QR Commerce Type Definitions

export interface QRSession {
  id: string;
  sessionToken: string;
  vendorId: string;
  productId: string;
  vendorLanguage: string;
  customerLanguage?: string;
  status: 'ACTIVE' | 'JOINED' | 'COMPLETED' | 'EXPIRED';
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  qrCodeUrl: string;
}

export interface NegotiationRoom {
  id: string;
  sessionId: string;
  vendorId: string;
  customerId?: string;
  vendorLanguage: string;
  customerLanguage?: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  messages: Message[];
  createdAt: Date;
  lastMessageAt?: Date;
  agreementReached: boolean;
  agreementDetails?: AgreementDetails;
}

export interface Message {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: 'VENDOR' | 'CUSTOMER';
  content: string;
  originalContent: string;
  language: string;
  targetLanguage: string;
  type: 'TEXT' | 'VOICE';
  translationStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'NOT_REQUIRED';
  audioUrl?: string;
  audioData?: Buffer;
  timestamp: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

// Alias for compatibility with negotiation service
export interface NegotiationMessage extends Message {}

export interface TranslationCache {
  id: string;
  sourceText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  provider: string;
  confidence: number;
  createdAt: Date;
  usageCount: number;
  lastUsedAt: Date;
}

export interface AgreementDetails {
  productId: string;
  agreedPrice: number;
  quantity: number;
  deliveryDate?: Date;
  specialTerms?: string;
  agreedAt: Date;
}

// Service Interfaces
export interface QRCodeData {
  qrCodeUrl: string;
  sessionToken: string;
  expiresAt: Date;
  sessionId: string;
}

export interface SessionValidation {
  isValid: boolean;
  sessionId: string;
  vendorId: string;
  productId: string;
  vendorLanguage: string;
  expiresAt: Date;
}

export interface TranslationResult {
  translatedText: string;
  confidence: number;
  originalText: string;
  fromLanguage: string;
  toLanguage: string;
  translationProvider: 'BHASHINI' | 'FALLBACK' | 'CACHED';
  cached?: boolean;
}

export interface ConversationContext {
  sessionId: string;
  previousMessages: Message[];
  negotiationTopic: string;
  productCategory: string;
}

export interface STTResult {
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
}

export interface TTSResult {
  audioData: Buffer;
  duration: number;
  language: string;
  voiceProfile: string;
  audioUrl?: string;
}

export interface MessageInput {
  content: string;
  type: 'TEXT' | 'VOICE';
  language: SupportedLanguage;
  audioData?: Blob | string; // Support both Blob (frontend) and string (base64)
}

export interface TypingIndicator {
  sessionId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface LanguageDetection {
  language: string;
  confidence: number;
}

export interface AudioQualityCheck {
  isValid: boolean;
  quality: 'HIGH' | 'MEDIUM' | 'LOW';
  issues: string[];
}

export const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as'
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Language display names
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  'en': 'English',
  'hi': 'हिंदी (Hindi)',
  'bn': 'বাংলা (Bengali)',
  'te': 'తెలుగు (Telugu)',
  'ta': 'தமிழ் (Tamil)',
  'ml': 'മലയാളം (Malayalam)',
  'kn': 'ಕನ್ನಡ (Kannada)',
  'gu': 'ગુજરાતી (Gujarati)',
  'mr': 'मराठी (Marathi)',
  'pa': 'ਪੰਜਾਬੀ (Punjabi)',
  'or': 'ଓଡ଼ିଆ (Odia)',
  'as': 'অসমীয়া (Assamese)'
};