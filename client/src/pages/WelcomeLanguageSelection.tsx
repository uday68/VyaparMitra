import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function WelcomeLanguageSelection() {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  const languages = [
    { id: 'english', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { id: 'hindi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
    { id: 'marathi', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
    { id: 'gujarati', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
    { id: 'tamil', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
    { id: 'bengali', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' }
  ];

  const handleContinue = () => {
    // Store language preference
    localStorage.setItem('selectedLanguage', selectedLanguage);
    localStorage.setItem('voiceEnabled', isVoiceEnabled.toString());
    
    // Navigate to main app
    navigate('/customer/shop');
  };

  const handleVoiceToggle = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl">translate</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Local Trade
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            Choose your preferred language for voice-enabled shopping and negotiation
          </p>
        </div>

        {/* Language Selection */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Language
          </h2>
          <div className="space-y-3 mb-8">
            {languages.map((language) => (
              <label
                key={language.id}
                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedLanguage === language.id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="language"
                  value={language.id}
                  checked={selectedLanguage === language.id}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="sr-only"
                />
                <span className="text-2xl mr-3">{language.flag}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {language.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language.nativeName}
                  </p>
                </div>
                {selectedLanguage === language.id && (
                  <span className="material-symbols-outlined text-blue-600">check_circle</span>
                )}
              </label>
            ))}
          </div>

          {/* Voice Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 text-lg">mic</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Voice Assistant</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Enable voice commands and responses
                  </p>
                </div>
              </div>
              <button
                onClick={handleVoiceToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isVoiceEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isVoiceEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Continue Shopping</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            You can change language and voice settings anytime in the app settings
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-16 h-16 bg-indigo-200 dark:bg-indigo-800 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
    </div>
  );
}