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
  RadioGroup,
  PageLayout,
  Container,
  Section
} from "../design-system/components";
import { useTheme } from "../design-system/themes/ThemeProvider";

export default function HandsFreeSettings() {
  const [, setLocation] = useLocation();
  const { colorScheme } = useTheme();
  const [wakeWord, setWakeWord] = useState("hey-assistant");
  const [volume, setVolume] = useState(75);
  const [voiceLog, setVoiceLog] = useState([
    {
      id: 1,
      command: "Check my inventory",
      recognized: "Inventory Check",
      status: "success",
      time: "2m ago"
    },
    {
      id: 2,
      command: "Add $10 to customer credit",
      recognized: "Update Balance",
      status: "success",
      time: "15m ago"
    },
    {
      id: 3,
      command: "Hey... order more...",
      recognized: "Partially Recognized",
      status: "partial",
      time: "1h ago"
    }
  ]);

  const handleEnableMode = () => {
    console.log("Enabling hands-free mode...");
  };

  const handleClearLog = () => {
    setVoiceLog([]);
  };

  const wakeWordOptions = [
    {
      value: "hey-assistant",
      label: "Hey Assistant",
      description: "Default activation phrase",
      icon: <span className="material-symbols-outlined">record_voice_over</span>
    },
    {
      value: "ok-shop",
      label: "Ok Shop", 
      description: "Shop-specific activation",
      icon: <span className="material-symbols-outlined">storefront</span>
    }
  ];

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
              Hands-Free Mode
            </h2>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </Container>
      </header>

      <Container className="pb-10 space-y-6">
        {/* Safety Disclaimer Card */}
        <Section>
          <Card variant="elevated">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <span className="material-symbols-outlined text-primary-purple text-6xl">
                  record_voice_over
                </span>
              </div>
              <CardTitle className="text-primary-purple">Always-On Voice Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-semantic-warning text-sm">warning</span>
                <p className="text-muted text-sm font-semibold uppercase tracking-wider">
                  Safety Disclaimer
                </p>
              </div>
              <CardTitle className="mb-2">Always-On Voice Listening</CardTitle>
              <CardDescription className="mb-2">
                Turning this on allows the app to listen for commands even when the screen is off.
              </CardDescription>
              <CardDescription className="text-sm italic mb-4">
                Note: This may impact battery life.
              </CardDescription>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-sm font-medium text-foreground">Active Mode</span>
                <Button 
                  onClick={handleEnableMode}
                  colorScheme="purple"
                  size="sm"
                >
                  Enable Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Wake Word Selection */}
        <Section>
          <Card>
            <CardHeader>
              <CardTitle>Wake Word Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={wakeWord}
                onValueChange={setWakeWord}
                options={wakeWordOptions}
                orientation="vertical"
              />
            </CardContent>
          </Card>
        </Section>

        {/* Audio Settings */}
        <Section>
          <Card>
            <CardHeader>
              <CardTitle>Audio Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-foreground">AI Response Volume</p>
                <span className="text-xs font-bold text-primary-purple px-2 py-1 bg-primary-purple/10 rounded">
                  {volume}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-muted text-lg">volume_mute</span>
                <div className="relative flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                  <div 
                    className="absolute h-full bg-primary-purple rounded-full transition-all" 
                    style={{ width: `${volume}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="material-symbols-outlined text-muted text-lg">volume_up</span>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Recent Voice Log */}
        <Section>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Voice Log</CardTitle>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleClearLog}
                  colorScheme="purple"
                >
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {voiceLog.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-background-light dark:bg-background-muted rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">"{entry.command}"</p>
                    <p className="text-xs text-muted">Recognized: {entry.recognized}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{entry.time}</span>
                    <span className={`material-symbols-outlined text-sm ${
                      entry.status === 'success' 
                        ? 'text-semantic-success' 
                        : 'text-semantic-warning'
                    }`}>
                      {entry.status === 'success' ? 'check_circle' : 'warning'}
                    </span>
                  </div>
                </motion.div>
              ))}
              {voiceLog.length === 0 && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-muted text-4xl mb-2 block">
                    mic_off
                  </span>
                  <p className="text-muted">No voice commands recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </Section>
      </Container>
    </PageLayout>
  );
}