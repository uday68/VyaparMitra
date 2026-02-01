import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '../hooks/useTranslation';
import { 
  Container, 
  Section, 
  Stack,
  TouchTargetButton,
  VoiceAssistantBanner 
} from '../design-system/components';
import { RadioGroup } from '../design-system/components/RadioGroup';
import { cn } from '../design-system/utils/cn';

export function WelcomeLanguageSelection() {
  const [, setLocation] = useLocation();
  const { t, language, changeLanguage, supportedLanguages } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  const handleLanguageSelect = async (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    try {
      await changeLanguage(newLanguage);
      localStorage.setItem('vyapar-mitra-language', newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const handleContinue = () => {
    // Navigate to main app
    setLocation('/customer/shop');
  };

  const handleVoiceToggle = () => {
    setIsVoiceListening(!isVoiceListening);
  };

  // Convert supported languages to radio options
  const languageOptions = Object.entries(supportedLanguages).map(([code, info]) => ({
    value: code,
    label: info.nativeName,
    description: info.name
  }));

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      {/* Phone Container for Mobile-First Design */}
      <Container maxWidth="mobile" className="flex-1 flex flex-col min-h-screen">
        
        {/* Top Illustration Section */}
        <div className="w-full aspect-[4/3] bg-center bg-no-repeat bg-cover rounded-b-xl overflow-hidden"
             style={{
               backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBiuZVc5fhFR05SJOynYfqYguILJchK2EELf3b2WobHxkrhcMwMhjFwpszBWo3nd1j9eos1HluZmUrDUNy-iCTT8cSKgcDl09ja5o1quXJWOEWhfQukAqt5X4-ADWqv1czMv5gXwm1Enm1jky7x3HlJBubt9APNmB3jONafHpT6YJ_mNVSZueQqgy6s8q44U1u8sVZIag7qMMRFpV6lvljY78EQLFQDm5lEZc6ha2Z5CtsgGzhzUBcFzoDLfisncjfxdqQyk4YP")`
             }}>
        </div>

        {/* Content Section */}
        <Section spacing="component" className="flex-1 flex flex-col">
          <Stack spacing="component">
            
            {/* Headline */}
            <div className="text-center sm:text-left">
              <h1 className="text-foreground dark:text-white tracking-tight text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-2">
                {t('welcome.title')}
              </h1>
              <p className="text-foreground-muted dark:text-primary/70 text-base font-normal leading-normal">
                {t('welcome.description')}
              </p>
            </div>

            {/* Voice Assistant Banner */}
            <VoiceAssistantBanner
              status={isVoiceListening ? 'listening' : 'idle'}
              message={isVoiceListening ? 'Listening...' : t('voice.assistant.languagePrompt')}
              onToggle={handleVoiceToggle}
              colorScheme="green"
              className="border border-border dark:border-primary/20 bg-card dark:bg-background-dark/50"
            />

            {/* Language Selection */}
            <div className="flex-1">
              <RadioGroup
                value={selectedLanguage}
                onValueChange={handleLanguageSelect}
                options={languageOptions}
                className="space-y-3"
                itemClassName={cn(
                  "flex items-center gap-4 rounded-xl border border-solid border-border dark:border-primary/10",
                  "p-4 flex-row-reverse bg-card dark:bg-background-dark/40",
                  "cursor-pointer hover:border-primary-green transition-colors",
                  "touch-target-minimum"
                )}
                radioClassName={cn(
                  "h-6 w-6 border-2 border-border bg-transparent text-transparent",
                  "checked:border-primary-green checked:bg-primary-green",
                  "focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-offset-2",
                  "checked:focus:border-primary-green"
                )}
                labelClassName="text-foreground dark:text-white text-base font-medium leading-normal"
              />
            </div>

          </Stack>
        </Section>

        {/* Sticky Footer with Continue Button */}
        <div className="sticky bottom-0 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark pt-8 pb-10">
          <TouchTargetButton
            onClick={handleContinue}
            size="large"
            className={cn(
              "w-full h-14 rounded-xl text-lg font-bold leading-normal tracking-wide",
              "bg-primary-green text-foreground shadow-lg shadow-primary-green/30",
              "hover:bg-primary-green/90 active:scale-[0.98] transition-all"
            )}
            aria-label={t('welcome.getStarted')}
          >
            {t('welcome.getStarted')}
          </TouchTargetButton>
        </div>

      </Container>
    </div>
  );
}