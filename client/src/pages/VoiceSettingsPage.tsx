import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function VoiceSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    autoListen: true,
    voiceSpeed: 'normal',
    voiceGender: 'female',
    language: 'english',
    handsFreeModeEnabled: false,
    voiceConfirmation: true,
    backgroundNoise: 'low'
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem('voiceSettings', JSON.stringify(settings));
    navigate(-1);
  };

  const handleTestVoice = () => {
    // Test voice synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Hello! This is how your voice assistant will sound.');
      speechSynthesis.speak(utterance);
    }
  };

  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-gray-900 dark:text-white">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Voice Settings</h1>
            <button
              onClick={handleSave}
              className="text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Voice Assistant Toggle */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg">mic</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Voice Assistant</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enable voice commands</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.voiceEnabled}
                onToggle={() => handleSettingChange('voiceEnabled', !settings.voiceEnabled)}
              />
            </div>
            {settings.voiceEnabled && (
              <button
                onClick={handleTestVoice}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Test Voice
              </button>
            )}
          </div>

          {/* Voice Settings */}
          {settings.voiceEnabled && (
            <>
              {/* Language Selection */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Language</h3>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="marathi">Marathi</option>
                  <option value="gujarati">Gujarati</option>
                  <option value="tamil">Tamil</option>
                  <option value="bengali">Bengali</option>
                </select>
              </div>

              {/* Voice Speed */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Voice Speed</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['slow', 'normal', 'fast'].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSettingChange('voiceSpeed', speed)}
                      className={`p-3 rounded-lg border-2 font-medium capitalize transition-colors ${
                        settings.voiceSpeed === speed
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Gender */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Voice Gender</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['female', 'male'].map((gender) => (
                    <button
                      key={gender}
                      onClick={() => handleSettingChange('voiceGender', gender)}
                      className={`p-3 rounded-lg border-2 font-medium capitalize transition-colors ${
                        settings.voiceGender === gender
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Advanced Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Auto Listen</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Automatically start listening after responses</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings.autoListen}
                      onToggle={() => handleSettingChange('autoListen', !settings.autoListen)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Hands-Free Mode</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Continuous voice interaction</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings.handsFreeModeEnabled}
                      onToggle={() => handleSettingChange('handsFreeModeEnabled', !settings.handsFreeModeEnabled)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Voice Confirmation</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Confirm actions with voice</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings.voiceConfirmation}
                      onToggle={() => handleSettingChange('voiceConfirmation', !settings.voiceConfirmation)}
                    />
                  </div>
                </div>
              </div>

              {/* Background Noise Filtering */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Background Noise Filtering</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleSettingChange('backgroundNoise', level)}
                      className={`p-3 rounded-lg border-2 font-medium capitalize transition-colors ${
                        settings.backgroundNoise === level
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Help Section */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Voice Commands</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• "Place bid for [amount]" - Start negotiation</p>
              <p>• "Accept offer" - Accept current price</p>
              <p>• "Counter with [amount]" - Make counter offer</p>
              <p>• "Show products" - Browse available items</p>
              <p>• "Help" - Get assistance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}