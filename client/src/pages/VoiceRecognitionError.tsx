import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function VoiceRecognitionError() {
  const navigate = useNavigate();
  const [errorType, setErrorType] = useState<'network' | 'microphone' | 'noise' | 'language'>('microphone');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const errorMessages = {
    network: {
      title: 'Connection Issue',
      description: 'Unable to connect to voice services',
      icon: 'wifi_off',
      color: 'red'
    },
    microphone: {
      title: 'Microphone Access Needed',
      description: 'Please allow microphone access to use voice features',
      icon: 'mic_off',
      color: 'orange'
    },
    noise: {
      title: 'Too Much Background Noise',
      description: 'Please find a quieter environment or speak louder',
      icon: 'volume_off',
      color: 'yellow'
    },
    language: {
      title: 'Language Not Recognized',
      description: 'Please speak in your selected language or change language settings',
      icon: 'translate',
      color: 'blue'
    }
  };

  const currentError = errorMessages[errorType];

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Simulate retry attempt
    setTimeout(() => {
      setIsRetrying(false);
      if (retryCount < 2) {
        // Simulate different error types
        const errors: (keyof typeof errorMessages)[] = ['microphone', 'noise', 'network', 'language'];
        setErrorType(errors[Math.floor(Math.random() * errors.length)]);
      } else {
        // Success after retries
        navigate(-1);
      }
    }, 2000);
  };

  const handleSkipVoice = () => {
    navigate(-1);
  };

  const handleSettings = () => {
    navigate('/voice-settings');
  };

  const handlePermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      navigate(-1);
    } catch (error) {
      console.error('Microphone permission denied:', error);
    }
  };

  const getSolutionSteps = () => {
    switch (errorType) {
      case 'microphone':
        return [
          'Click "Allow" when prompted for microphone access',
          'Check if microphone is connected properly',
          'Try refreshing the page',
          'Check browser microphone settings'
        ];
      case 'network':
        return [
          'Check your internet connection',
          'Try switching to mobile data or WiFi',
          'Restart your router if needed',
          'Contact support if issue persists'
        ];
      case 'noise':
        return [
          'Move to a quieter location',
          'Speak closer to the microphone',
          'Reduce background noise',
          'Adjust microphone sensitivity in settings'
        ];
      case 'language':
        return [
          'Speak clearly in your selected language',
          'Check language settings',
          'Try switching to English temporarily',
          'Ensure proper pronunciation'
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="max-w-md mx-auto w-full bg-white dark:bg-gray-800 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-gray-900 dark:text-white">close</span>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Voice Recognition</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Troubleshooting</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Illustration */}
          <div className="text-center">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              currentError.color === 'red' ? 'bg-red-100 dark:bg-red-900/20' :
              currentError.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20' :
              currentError.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
              'bg-blue-100 dark:bg-blue-900/20'
            }`}>
              <span className={`material-symbols-outlined text-3xl ${
                currentError.color === 'red' ? 'text-red-600' :
                currentError.color === 'orange' ? 'text-orange-600' :
                currentError.color === 'yellow' ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                {currentError.icon}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {currentError.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {currentError.description}
            </p>
          </div>

          {/* Solution Steps */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">lightbulb</span>
              How to Fix This
            </h3>
            <ol className="space-y-2">
              {getSolutionSteps().map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            {errorType === 'microphone' && (
              <button
                onClick={handlePermissions}
                className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">mic</span>
                Enable Microphone
              </button>
            )}
            
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">refresh</span>
                  Try Again
                </>
              )}
            </button>

            <button
              onClick={handleSettings}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">settings</span>
              Voice Settings
            </button>

            <button
              onClick={handleSkipVoice}
              className="w-full bg-transparent text-gray-600 dark:text-gray-400 font-medium py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Continue Without Voice
            </button>
          </div>

          {/* Error Type Selector (for demo) */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Demo: Try Different Errors</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(errorMessages).map(([key, error]) => (
                <button
                  key={key}
                  onClick={() => setErrorType(key as keyof typeof errorMessages)}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                    errorType === key
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/60'
                  }`}
                >
                  {error.title}
                </button>
              ))}
            </div>
          </div>

          {/* Retry Counter */}
          {retryCount > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Retry attempts: {retryCount}/3
              </p>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-lg">help</span>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-1">Need More Help?</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  If you continue to experience issues, try these alternatives:
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <li>• Use text input instead of voice</li>
                  <li>• Check our troubleshooting guide</li>
                  <li>• Contact customer support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}