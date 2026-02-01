import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '../hooks/useTranslation';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Toggle,
  Select,
  PageLayout,
  Container,
  Section
} from '../design-system/components';
import { useTheme } from '../design-system/themes/ThemeProvider';

export function VoiceSettingsPage() {
  const [, setLocation] = useLocation();
  const { colorScheme } = useTheme();
  const { t, supportedLanguages, language, changeLanguage } = useTranslation();
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    autoListen: true,
    voiceSpeed: 'normal',
    voiceGender: 'female',
    language: language,
    handsFreeModeEnabled: false,
    voiceConfirmation: true,
    backgroundNoise: 'low'
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // If language is changed, update i18n
    if (key === 'language') {
      changeLanguage(value);
    }
  };

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem('voiceSettings', JSON.stringify(settings));
    setLocation('/voice-settings');
  };

  const handleTestVoice = () => {
    // Test voice synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(t('voice.settings.testVoice'));
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <PageLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <Container>
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/voice-settings')}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Button>
            <h1 className="text-lg font-bold text-foreground">{t('voice.settings.title')}</h1>
            <Button
              variant="ghost"
              onClick={handleSave}
              colorScheme="blue"
            >
              {t('common.save')}
            </Button>
          </div>
        </Container>
      </header>

      <Container className="space-y-6">
        {/* Voice Assistant Toggle */}
        <Section>
          <Card variant="elevated" className="bg-primary-blue/5 border-primary-blue/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-blue rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-lg">mic</span>
                  </div>
                  <div>
                    <CardTitle className="text-base">{t('voice.settings.title')}</CardTitle>
                    <CardDescription>{t('permissions.microphone.description')}</CardDescription>
                  </div>
                </div>
                <Toggle
                  checked={settings.voiceEnabled}
                  onCheckedChange={(checked) => handleSettingChange('voiceEnabled', checked)}
                  colorScheme="blue"
                />
              </div>
              {settings.voiceEnabled && (
                <Button
                  onClick={handleTestVoice}
                  className="w-full"
                  colorScheme="blue"
                >
                  {t('voice.settings.testVoice')}
                </Button>
              )}
            </CardContent>
          </Card>
        </Section>

        {/* Voice Settings */}
        {settings.voiceEnabled && (
          <>
            {/* Language Selection */}
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>{t('voice.settings.language')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => handleSettingChange('language', value)}
                  >
                    {Object.entries(supportedLanguages).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.nativeName} ({info.name})
                      </option>
                    ))}
                  </Select>
                </CardContent>
              </Card>
            </Section>

            {/* Voice Speed */}
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>{t('voice.settings.speed')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {['slow', 'normal', 'fast'].map((speed) => (
                      <Button
                        key={speed}
                        variant={settings.voiceSpeed === speed ? "primary" : "secondary"}
                        onClick={() => handleSettingChange('voiceSpeed', speed)}
                        className="capitalize"
                        colorScheme="blue"
                      >
                        {speed}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Section>

            {/* Voice Gender */}
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>{t('voice.settings.voiceType')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'female', label: t('voice.settings.female') },
                      { key: 'male', label: t('voice.settings.male') }
                    ].map((gender) => (
                      <Button
                        key={gender.key}
                        variant={settings.voiceGender === gender.key ? "primary" : "secondary"}
                        onClick={() => handleSettingChange('voiceGender', gender.key)}
                        colorScheme="blue"
                      >
                        {gender.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Section>

            {/* Advanced Settings */}
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Toggle
                    checked={settings.autoListen}
                    onCheckedChange={(checked) => handleSettingChange('autoListen', checked)}
                    label={t('settings.handsFree.continuousListening')}
                    description={t('settings.handsFree.continuousListening')}
                    colorScheme="blue"
                  />

                  <Toggle
                    checked={settings.handsFreeModeEnabled}
                    onCheckedChange={(checked) => handleSettingChange('handsFreeModeEnabled', checked)}
                    label={t('settings.handsFree.title')}
                    description={t('settings.handsFree.enabled')}
                    colorScheme="blue"
                  />

                  <Toggle
                    checked={settings.voiceConfirmation}
                    onCheckedChange={(checked) => handleSettingChange('voiceConfirmation', checked)}
                    label={t('settings.handsFree.voiceConfirmation')}
                    description={t('settings.handsFree.voiceConfirmation')}
                    colorScheme="blue"
                  />
                </CardContent>
              </Card>
            </Section>

            {/* Background Noise Filtering */}
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>{t('voice.settings.calibrateMic')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map((level) => (
                      <Button
                        key={level}
                        variant={settings.backgroundNoise === level ? "primary" : "secondary"}
                        onClick={() => handleSettingChange('backgroundNoise', level)}
                        className="capitalize"
                        colorScheme="blue"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Section>
          </>
        )}

        {/* Help Section */}
        <Section>
          <Card className="bg-background-light dark:bg-background-muted">
            <CardHeader>
              <CardTitle>{t('voice.commands.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted">
              <p>• "{t('voice.commands.negotiation.makeOffer')}" - {t('negotiation.title')}</p>
              <p>• "{t('voice.commands.negotiation.acceptDeal')}" - {t('negotiation.acceptOffer')}</p>
              <p>• "{t('voice.commands.shopping.negotiate')}" - {t('negotiation.counterOffer')}</p>
              <p>• "{t('voice.commands.shopping.showCategory')}" - {t('shop.categories.all')}</p>
              <p>• "{t('navigation.help')}" - {t('navigation.help')}</p>
            </CardContent>
          </Card>
        </Section>
      </Container>
    </PageLayout>
  );
}