import { useTranslation as useI18nTranslation } from 'react-i18next';
import { supportedLanguages, changeLanguage, getCurrentLanguage, formatCurrency, formatNumber, formatDate } from '../i18n';

export interface UseTranslationReturn {
  t: (key: string, options?: any) => string;
  i18n: any;
  language: string;
  changeLanguage: (language: string) => Promise<void>;
  supportedLanguages: typeof supportedLanguages;
  formatCurrency: (amount: number, language?: string) => string;
  formatNumber: (number: number, language?: string) => string;
  formatDate: (date: Date, language?: string) => string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
}

export function useTranslation(namespace?: string): UseTranslationReturn {
  const { t, i18n } = useI18nTranslation(namespace);
  const currentLanguage = getCurrentLanguage();
  
  // Check if current language is RTL (none of our supported languages are RTL currently)
  const isRTL = false;
  const direction = isRTL ? 'rtl' : 'ltr';

  return {
    t,
    i18n,
    language: currentLanguage,
    changeLanguage,
    supportedLanguages,
    formatCurrency,
    formatNumber,
    formatDate,
    isRTL,
    direction,
  };
}

// Utility hook for language-specific formatting
export function useLocalization() {
  const currentLanguage = getCurrentLanguage();
  
  return {
    language: currentLanguage,
    formatCurrency: (amount: number) => formatCurrency(amount, currentLanguage),
    formatNumber: (number: number) => formatNumber(number, currentLanguage),
    formatDate: (date: Date) => formatDate(date, currentLanguage),
    isRTL: false,
    direction: 'ltr' as const,
  };
}

// Hook for voice commands in different languages
export function useVoiceCommands() {
  const { t } = useTranslation();
  
  return {
    getVoiceCommand: (command: string) => t(`voice.commands.${command}`),
    getNavigationCommand: (action: string) => t(`voice.commands.navigation.${action}`),
    getShoppingCommand: (action: string) => t(`voice.commands.shopping.${action}`),
    getNegotiationCommand: (action: string) => t(`voice.commands.negotiation.${action}`),
  };
}

// Hook for error messages in different languages
export function useErrorMessages() {
  const { t } = useTranslation();
  
  return {
    getErrorMessage: (errorCode: string) => {
      // Try specific error first, fallback to generic
      const specificError = t(`errors.${errorCode}`, { defaultValue: null });
      return specificError || t('errors.generic');
    },
    getAuthError: (errorCode: string) => t(`auth.errors.${errorCode}`, { defaultValue: t('errors.generic') }),
    getVoiceError: (errorCode: string) => t(`voice.errors.${errorCode}`, { defaultValue: t('errors.generic') }),
  };
}

// Hook for success messages
export function useSuccessMessages() {
  const { t } = useTranslation();
  
  return {
    getSuccessMessage: (action: string) => t(`success.${action}`, { defaultValue: t('success.saved') }),
  };
}