import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Toggle,
  Select,
  RadioGroup,
  PageLayout,
  Container,
  Section,
  VoiceStatusIndicator
} from "../design-system/components";
import { useTheme } from "../design-system/themes/ThemeProvider";

export default function VoiceCustomization() {
  const [, setLocation] = useLocation();
  const { colorScheme } = useTheme();
  const [assistantProfile, setAssistantProfile] = useState("natural");
  const [language, setLanguage] = useState("hindi");
  const [speakingSpeed, setSpeakingSpeed] = useState(1.0);
  const [autoReadBids, setAutoReadBids] = useState(true);
  const [voiceConfirmation, setVoiceConfirmation] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const handleTestVoice = () => {
    setIsTestingVoice(true);
    // Simulate voice test
    setTimeout(() => {
      setIsTestingVoice(false);
    }, 3000);
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
              onClick={() => setLocation("/vendor")}
            >
              <span className="material-symbols-outlined">arrow_back_ios</span>
            </Button>
            <h2 className="text-lg font-bold text-foreground">
              Voice Settings
            </h2>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </Container>
      </header>

      <Container className="pb-32 space-y-6">
        {/* Assistant Profile Section */}
        <Section>
          <Card>
            <CardHeader>
              <CardTitle>Assistant Profile</CardTitle>
              <CardDescription>
                Choose how your assistant responds to trade queries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={assistantProfile}
                onValueChange={setAssistantProfile}
                options={[
                  { value: "natural", label: "Natural" },
                  { value: "brief", label: "Brief" }
                ]}
                orientation="horizontal"
              />
            </CardContent>
          </Card>
        </Section>

        {/* Voice Options Section */}
        <Section>
          <Card>
            <CardHeader>
              <CardTitle>Voice Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language Selection */}
              <div>
                <label className="block text-base font-medium text-foreground mb-2">
                  Language
                </label>
                <Select
                  value={language}
                  onValueChange={setLanguage}
                >
                  <option value="english">English (Global)</option>
                  <option value="hindi">Hindi (हिन्दी)</option>
                  <option value="spanish">Spanish (Español)</option>
                  <option value="french">French (Français)</option>
                </Select>
              </div>

              {/* Speaking Speed Slider */}
              <div>
                <label className="block text-base font-medium text-foreground mb-4">
                  Speaking Speed
                </label>
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-muted">slow_motion_video</span>
                  <input 
                    className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    max="2.0" 
                    min="0.5" 
                    step="0.1" 
                    type="range" 
                    value={speakingSpeed}
                    onChange={(e) => setSpeakingSpeed(parseFloat(e.target.value))}
                  />
                  <span className="material-symbols-outlined text-muted">speed</span>
                </div>
                <div className="flex justify-between mt-2 px-1">
                  <span className="text-xs text-muted">Slow</span>
                  <span className="text-xs text-muted">Normal</span>
                  <span className="text-xs text-muted">Fast</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Automation Section */}
        <Section>
          <Card>
            <CardHeader>
              <CardTitle>Automation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Toggle
                checked={autoReadBids}
                onCheckedChange={setAutoReadBids}
                label="Auto-Read New Bids"
                description="Narrate incoming bids instantly"
                colorScheme="blue"
              />

              <Toggle
                checked={voiceConfirmation}
                onCheckedChange={setVoiceConfirmation}
                label="Voice Confirmation for Deals"
                description="Ask for 'Yes' to confirm a sale"
                colorScheme="blue"
              />
            </CardContent>
          </Card>
        </Section>
      </Container>

      {/* Floating Voice Test Button */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex flex-col items-center gap-4 p-6 bg-background/95 backdrop-blur-sm rounded-2xl border border-border shadow-lg">
          <Button
            variant="voice"
            size="icon"
            className="size-16 rounded-full"
            onClick={handleTestVoice}
            disabled={isTestingVoice}
          >
            <span className="material-symbols-outlined text-3xl">
              {isTestingVoice ? "stop" : "mic"}
            </span>
          </Button>
          <p className="text-sm font-semibold text-primary-purple">
            {isTestingVoice ? "Testing Voice..." : "Tap to Test Voice Commands"}
          </p>
          {isTestingVoice && (
            <VoiceStatusIndicator 
              status="processing" 
              size="sm" 
              showLabel={false}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}