import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  X,
  Zap,
  MessageCircle,
  Globe
} from 'lucide-react';

interface VoiceAssistantProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  className?: string;
}

interface VoiceCommand {
  command: string;
  response: string;
  action?: () => void;
}

export function VoiceAssistant({ isActive, onToggle, className = '' }: VoiceAssistantProps) {
  const { t, language, supportedLanguages } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState(language);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  // Get language-specific recognition language code
  const getRecognitionLanguage = (langCode: string): string => {
    const recognitionLanguages = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'bn': 'bn-IN',
      'mr': 'mr-IN',
      'gu': 'gu-IN',
      'pa': 'pa-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'or': 'or-IN',
      'as': 'as-IN'
    };
    return recognitionLanguages[langCode as keyof typeof recognitionLanguages] || 'en-US';
  };

  // Get TTS language code
  const getTTSLanguage = (langCode: string): string => {
    const ttsLanguages = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'bn': 'bn-IN',
      'mr': 'mr-IN',
      'gu': 'gu-IN',
      'pa': 'pa-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'or': 'or-IN',
      'as': 'as-IN'
    };
    return ttsLanguages[langCode as keyof typeof ttsLanguages] || 'en-US';
  };

  // Voice commands mapping with multilingual support
  const getVoiceCommands = (currentLanguage: string): VoiceCommand[] => {
    const commandMappings = {
      'en': [
        {
          command: 'show me apples',
          response: 'Showing apples in your area',
          action: () => window.location.href = '/customer/shop?search=apples'
        },
        {
          command: 'find deals near me',
          response: 'Finding the best deals near you',
          action: () => window.location.href = '/customer/shop?filter=deals'
        },
        {
          command: 'scan qr code',
          response: 'Opening QR code scanner',
          action: () => window.location.href = '/customer/shop?action=scan'
        },
        {
          command: 'show my orders',
          response: 'Displaying your order history',
          action: () => window.location.href = '/order-history'
        },
        {
          command: 'help',
          response: 'Here are the available voice commands',
          action: () => setIsExpanded(true)
        }
      ],
      'hi': [
        {
          command: 'मुझे सेब दिखाओ',
          response: 'आपके क्षेत्र में सेब दिखा रहा हूं',
          action: () => window.location.href = '/customer/shop?search=apples'
        },
        {
          command: 'मेरे पास के डील्स खोजो',
          response: 'आपके पास के बेहतरीन डील्स खोज रहा हूं',
          action: () => window.location.href = '/customer/shop?filter=deals'
        },
        {
          command: 'क्यूआर कोड स्कैन करो',
          response: 'क्यूआर कोड स्कैनर खोल रहा हूं',
          action: () => window.location.href = '/customer/shop?action=scan'
        },
        {
          command: 'मेरे ऑर्डर दिखाओ',
          response: 'आपका ऑर्डर हिस्ट्री दिखा रहा हूं',
          action: () => window.location.href = '/order-history'
        },
        {
          command: 'मदद',
          response: 'यहां उपलब्ध वॉइस कमांड्स हैं',
          action: () => setIsExpanded(true)
        }
      ],
      'bn': [
        {
          command: 'আমাকে আপেল দেখান',
          response: 'আপনার এলাকায় আপেল দেখাচ্ছি',
          action: () => window.location.href = '/customer/shop?search=apples'
        },
        {
          command: 'আমার কাছের ডিল খুঁজুন',
          response: 'আপনার কাছের সেরা ডিল খুঁজছি',
          action: () => window.location.href = '/customer/shop?filter=deals'
        },
        {
          command: 'কিউআর কোড স্ক্যান করুন',
          response: 'কিউআর কোড স্ক্যানার খুলছি',
          action: () => window.location.href = '/customer/shop?action=scan'
        },
        {
          command: 'আমার অর্ডার দেখান',
          response: 'আপনার অর্ডার ইতিহাস দেখাচ্ছি',
          action: () => window.location.href = '/order-history'
        },
        {
          command: 'সাহায্য',
          response: 'এখানে উপলব্ধ ভয়েস কমান্ড রয়েছে',
          action: () => setIsExpanded(true)
        }
      ]
    };

    return commandMappings[currentLanguage as keyof typeof commandMappings] || commandMappings.en;
  };

  // Initialize speech recognition with language detection
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = getRecognitionLanguage(language);
        
        recognitionRef.current.onstart = () => {
          setIsListening(true);
          startAudioVisualization();
        };
        
        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
              setConfidence(confidence);
            } else {
              interimTranscript += transcript;
            }
          }
          
          setTranscript(finalTranscript || interimTranscript);
          
          if (finalTranscript) {
            processVoiceCommand(finalTranscript.toLowerCase().trim());
          }
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          stopAudioVisualization();
          
          // Handle language-specific errors
          if (event.error === 'language-not-supported') {
            speak(t('voice.errors.languageNotSupported'), 'en');
          }
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
          stopAudioVisualization();
          
          // Restart if still active
          if (isActive && recognitionRef.current) {
            setTimeout(() => {
              recognitionRef.current?.start();
            }, 1000);
          }
        };
      }
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioVisualization();
    };
  }, []);

  // Update recognition language when user language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = getRecognitionLanguage(language);
      setDetectedLanguage(language);
    }
  }, [language]);

  // Start/stop recognition based on isActive
  useEffect(() => {
    if (isActive && recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    } else if (!isActive && recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isActive, isListening]);

  // Audio visualization
  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
          
          if (isListening) {
            animationRef.current = requestAnimationFrame(updateAudioLevel);
          }
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudioVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  };

  // Process voice commands with language detection
  const processVoiceCommand = async (command: string) => {
    setLastCommand(command);
    setIsProcessing(true);
    
    try {
      // Detect language from the command
      const detectedLang = detectLanguageFromText(command);
      setDetectedLanguage(detectedLang);
      
      // Get commands for detected language
      const voiceCommands = getVoiceCommands(detectedLang);
      
      const matchedCommand = voiceCommands.find(cmd => 
        command.includes(cmd.command.toLowerCase()) ||
        cmd.command.toLowerCase().includes(command) ||
        calculateSimilarity(command, cmd.command.toLowerCase()) > 0.6
      );
      
      if (matchedCommand) {
        await speak(matchedCommand.response, detectedLang);
        if (matchedCommand.action) {
          setTimeout(matchedCommand.action, 1000);
        }
      } else {
        // Try to process with backend voice intent service
        try {
          const response = await fetch('/api/voice/intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: command,
              language: detectedLang,
              userId: 'current-user-id', // Get from auth context
              userType: 'customer' // Get from user context
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.audioResponse) {
              // Play the audio response from backend
              const audio = new Audio(result.audioResponse);
              audio.play();
            } else {
              await speak(result.response || t('voice.responses.processed'), detectedLang);
            }
          } else {
            await speak(t('voice.responses.notUnderstood'), detectedLang);
          }
        } catch (error) {
          console.error('Backend voice processing failed:', error);
          await speak(t('voice.responses.notUnderstood'), detectedLang);
        }
      }
    } catch (error) {
      console.error('Voice command processing failed:', error);
      await speak(t('voice.responses.error'), language);
    } finally {
      setIsProcessing(false);
    }
  };

  // Simple language detection based on text patterns
  const detectLanguageFromText = (text: string): string => {
    const languagePatterns = {
      'hi': /[\u0900-\u097F]/,  // Devanagari
      'bn': /[\u0980-\u09FF]/,  // Bengali
      'gu': /[\u0A80-\u0AFF]/,  // Gujarati
      'pa': /[\u0A00-\u0A7F]/,  // Gurmukhi
      'or': /[\u0B00-\u0B7F]/,  // Oriya
      'ta': /[\u0B80-\u0BFF]/,  // Tamil
      'te': /[\u0C00-\u0C7F]/,  // Telugu
      'kn': /[\u0C80-\u0CFF]/,  // Kannada
      'ml': /[\u0D00-\u0D7F]/,  // Malayalam
      'mr': /[\u0900-\u097F]/,  // Marathi (shares Devanagari)
      'as': /[\u0980-\u09FF]/   // Assamese (shares Bengali)
    };

    for (const [lang, regex] of Object.entries(languagePatterns)) {
      if (regex.test(text)) {
        return lang;
      }
    }

    return language; // Default to current user language
  };

  // Calculate text similarity
  const calculateSimilarity = (text1: string, text2: string): number => {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matches++;
          break;
        }
      }
    }

    return matches / Math.max(words1.length, words2.length);
  };

  // Text-to-speech with language support
  const speak = async (text: string, lang: string = language): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (synthRef.current) {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getTTSLanguage(lang);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        utterance.onerror = (error) => {
          setIsSpeaking(false);
          reject(error);
        };
        
        synthRef.current.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  // Toggle voice assistant
  const handleToggle = () => {
    onToggle(!isActive);
    if (isActive) {
      setTranscript('');
      setLastCommand('');
      setDetectedLanguage(language);
    }
  };

  // Waveform animation component
  const Waveform = () => (
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-blue-500 rounded-full"
          animate={{
            height: isListening ? [4, 16 + audioLevel * 20, 4] : 4,
            opacity: isListening ? [0.4, 1, 0.4] : 0.4
          }}
          transition={{
            duration: 0.5,
            repeat: isListening ? Infinity : 0,
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  );

  if (!isActive && !isExpanded) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`fixed bottom-24 right-4 z-50 ${className}`}
      >
        <Button
          onClick={handleToggle}
          size="lg"
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <Mic className="h-6 w-6" />
        </Button>
      </motion.div>
    );
  }

  const currentLanguageInfo = supportedLanguages[detectedLanguage as keyof typeof supportedLanguages];
  const voiceCommands = getVoiceCommands(detectedLanguage);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}
      >
        <Card className="bg-white/95 backdrop-blur-sm border-blue-200 shadow-xl">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="font-medium text-gray-900">
                  {t('voice.assistant.title')}
                </span>
                {isListening && (
                  <Badge variant="secondary" className="text-xs">
                    {t('voice.assistant.listening')}
                  </Badge>
                )}
                {isSpeaking && (
                  <Badge variant="secondary" className="text-xs">
                    {t('voice.assistant.speaking')}
                  </Badge>
                )}
                {isProcessing && (
                  <Badge variant="secondary" className="text-xs">
                    {t('voice.assistant.processing')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Language indicator */}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Globe className="h-3 w-3" />
                  <span>{currentLanguageInfo?.flag}</span>
                  <span>{detectedLanguage.toUpperCase()}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onToggle(false);
                    setIsExpanded(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Voice Visualization */}
            <div className="flex items-center justify-center mb-3">
              <Waveform />
            </div>

            {/* Current Transcript */}
            {transcript && (
              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <MessageCircle className="h-4 w-4 inline mr-1" />
                  {transcript}
                </p>
                {confidence > 0 && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {t('voice.assistant.confidence')}:
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all"
                        style={{ width: `${confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant={isActive ? "default" : "outline"}
                onClick={handleToggle}
                className="flex-1"
                disabled={isProcessing}
              >
                {isActive ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
                {isActive ? t('voice.assistant.stop') : t('voice.assistant.start')}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => synthRef.current?.cancel()}
                disabled={!isSpeaking}
              >
                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>

            {/* Expanded Commands */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  {t('voice.assistant.commands')} ({detectedLanguage.toUpperCase()})
                </h4>
                <div className="space-y-2">
                  {voiceCommands.map((cmd, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-blue-600">
                        "{cmd.command}"
                      </span>
                      <p className="text-gray-600 text-xs mt-1">
                        {cmd.response}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Last Command */}
            {lastCommand && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {t('voice.assistant.lastCommand')}: "{lastCommand}"
                </p>
                {detectedLanguage !== language && (
                  <p className="text-xs text-blue-500 mt-1">
                    {t('voice.assistant.detectedLanguage')}: {currentLanguageInfo?.nativeName}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}