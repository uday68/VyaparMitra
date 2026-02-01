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
  VoiceAssistantBanner,
  Waveform,
  VoiceStatusIndicator,
  PageLayout,
  Container,
  Section
} from "../design-system/components";
import { useTheme } from "../design-system/themes/ThemeProvider";

export default function VoiceSettings() {
  const [, setLocation] = useLocation();
  const { colorScheme } = useTheme();
  const [selectedVoice, setSelectedVoice] = useState("male");
  const [highContrastWaveform, setHighContrastWaveform] = useState(true);
  const [voiceShortcuts, setVoiceShortcuts] = useState([
    { id: 1, phrase: "Check current stock", recorded: true },
    { id: 2, phrase: "Open my shop", recorded: false },
    { id: 3, phrase: "Customer support", recorded: true }
  ]);

  const handleSave = () => {
    // Save voice settings logic
    console.log("Saving voice settings...");
    setLocation("/vendor");
  };

  const handleAddShortcut = () => {
    const newShortcut = {
      id: voiceShortcuts.length + 1,
      phrase: "New voice command",
      recorded: false
    };
    setVoiceShortcuts([...voiceShortcuts, newShortcut]);
  };

  return (
    <PageLayout>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/vendor")}
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </Button>
              <h1 className="text-xl font-bold text-foreground">
                Voice Settings
              </h1>
            </div>
            <Button 
              variant="ghost"
              onClick={handleSave}
              colorScheme="purple"
            >
              Reset
            </Button>
          </div>
        </Container>
      </header>

      <Container className="pb-24">
        {/* Assistant Voice Section */}
        <Section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Assistant Voice
          </h2>
          <div className="space-y-3">
            {/* Voice Options */}
            {[
              { key: "male", label: "Male", icon: "person" },
              { key: "female", label: "Female", icon: "person_2" },
              { key: "neutral", label: "Neutral", icon: "face" }
            ].map((voice) => (
              <Card 
                key={voice.key}
                variant={selectedVoice === voice.key ? "outlined" : "default"}
                className={`cursor-pointer transition-all ${
                  selectedVoice === voice.key 
                    ? "border-primary-purple border-2" 
                    : "hover:border-primary-purple/50"
                }`}
                onClick={() => setSelectedVoice(voice.key)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${
                      selectedVoice === voice.key ? "text-primary-purple" : "text-muted"
                    }`}>
                      {voice.icon}
                    </span>
                    <span className="text-foreground font-bold text-lg">{voice.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon">
                      <span className="material-symbols-outlined text-muted">
                        play_circle
                      </span>
                    </Button>
                    <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center ${
                      selectedVoice === voice.key 
                        ? "border-primary-purple bg-primary-purple" 
                        : "border-border"
                    }`}>
                      {selectedVoice === voice.key && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* Visual Feedback Section */}
        <Section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Visual Feedback
          </h2>
          <Card>
            <CardContent className="p-5">
              <Toggle
                checked={highContrastWaveform}
                onCheckedChange={setHighContrastWaveform}
                label="High-Contrast Waveform"
                description="Show movement when AI talks"
                colorScheme="purple"
              />

              {/* Live Waveform Preview */}
              <div className="mt-4 w-full h-24 bg-background-light dark:bg-background-muted rounded-lg flex items-center justify-center overflow-hidden">
                <Waveform
                  isActive={true}
                  amplitude={highContrastWaveform ? 1 : 0.6}
                  colorScheme="purple"
                  size="lg"
                />
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Voice Command Shortcuts */}
        <Section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              Voice Shortcuts
            </h2>
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleAddShortcut}
              colorScheme="purple"
              leftIcon={<span className="material-symbols-outlined text-sm">add</span>}
            >
              Add New
            </Button>
          </div>
          <div className="space-y-2">
            {voiceShortcuts.map((shortcut) => (
              <motion.div
                key={shortcut.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex flex-col">
                      <span className="text-foreground font-bold">"{shortcut.phrase}"</span>
                      <span className={`text-xs flex items-center gap-1 ${
                        shortcut.recorded ? "text-muted" : "text-primary-purple"
                      }`}>
                        <span className="material-symbols-outlined text-xs">
                          {shortcut.recorded ? "mic" : "warning"}
                        </span>
                        {shortcut.recorded ? "Recorded" : "No tag recorded"}
                      </span>
                    </div>
                    <Button 
                      variant={shortcut.recorded ? "secondary" : "primary"}
                      size="sm"
                      colorScheme="purple"
                    >
                      {shortcut.recorded ? "Update" : "Record"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Save Button */}
        <Section>
          <Button 
            onClick={handleSave}
            className="w-full"
            size="lg"
            colorScheme="purple"
          >
            Save Voice Settings
          </Button>
        </Section>
      </Container>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-2">
        <Container>
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center gap-1 text-muted">
              <span className="material-symbols-outlined">home</span>
              <span className="text-xs font-medium">Home</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-primary-purple">
              <span className="material-symbols-outlined">settings_voice</span>
              <span className="text-xs font-bold">Voice</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-muted">
              <span className="material-symbols-outlined">bar_chart</span>
              <span className="text-xs font-medium">Analytics</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-muted">
              <span className="material-symbols-outlined">account_circle</span>
              <span className="text-xs font-medium">Profile</span>
            </div>
          </div>
        </Container>
      </nav>
    </PageLayout>
  );
}