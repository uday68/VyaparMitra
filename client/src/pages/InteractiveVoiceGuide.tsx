import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Mic, 
  Volume2, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  CheckCircle,
  Circle,
  Headphones,
  MessageCircle,
  ShoppingBag,
  Settings
} from 'lucide-react';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  voiceInstruction: string;
  audioUrl?: string;
  category: 'basics' | 'shopping' | 'negotiation' | 'settings';
  duration: number;
  completed: boolean;
}

export function InteractiveVoiceGuide() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Mock guide steps data
  const [guideSteps] = useState<GuideStep[]>([
    {
      id: 'basics_001',
      title: 'Voice Assistant Activation',
      description: 'Learn how to activate and use the voice assistant',
      voiceInstruction: 'Say "Hey VyaparMitra" to activate the voice assistant',
      audioUrl: '/audio/guide/activation.mp3',
      category: 'basics',
      duration: 30,
      completed: false
    },
    {
      id: 'basics_002',
      title: 'Basic Voice Commands',
      description: 'Master essential voice commands for navigation',
      voiceInstruction: 'Try saying "Go to shop" or "Show my profile"',
      audioUrl: '/audio/guide/basic_commands.mp3',
      category: 'basics',
      duration: 45,
      completed: false
    },
    {
      id: 'shopping_001',
      title: 'Voice Product Search',
      description: 'Search for products using natural voice commands',
      voiceInstruction: 'Say "Show me fresh apples under 100 rupees"',
      audioUrl: '/audio/guide/product_search.mp3',
      category: 'shopping',
      duration: 60,
      completed: false
    },
    {
      id: 'shopping_002',
      title: 'Voice Shopping Cart',
      description: 'Add items to cart using voice commands',
      voiceInstruction: 'Say "Add 2 kg mangoes to cart"',
      audioUrl: '/audio/guide/add_to_cart.mp3',
      category: 'shopping',
      duration: 40,
      completed: false
    },
    {
      id: 'negotiation_001',
      title: 'Starting Voice Negotiations',
      description: 'Begin price negotiations using voice',
      voiceInstruction: 'Say "I want to negotiate the price" or "Can you reduce the price?"',
      audioUrl: '/audio/guide/start_negotiation.mp3',
      category: 'negotiation',
      duration: 75,
      completed: false
    },
    {
      id: 'negotiation_002',
      title: 'Making Voice Offers',
      description: 'Make price offers using natural speech',
      voiceInstruction: 'Say "I offer 150 rupees" or "मैं 150 रुपये देना चाहता हूं"',
      audioUrl: '/audio/guide/make_offers.mp3',
      category: 'negotiation',
      duration: 50,
      completed: false
    },
    {
      id: 'settings_001',
      title: 'Voice Settings Configuration',
      description: 'Customize voice assistant settings',
      voiceInstruction: 'Say "Open voice settings" to customize your experience',
      audioUrl: '/audio/guide/voice_settings.mp3',
      category: 'settings',
      duration: 35,
      completed: false
    }
  ]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basics': return <Mic className="h-4 w-4" />;
      case 'shopping': return <ShoppingBag className="h-4 w-4" />;
      case 'negotiation': return <MessageCircle className="h-4 w-4" />;
      case 'settings': return <Settings className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basics': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shopping': return 'bg-green-100 text-green-800 border-green-200';
      case 'negotiation': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'settings': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handlePlayAudio = (audioUrl?: string) => {
    if (audioUrl) {
      setIsPlaying(true);
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const handleNextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setProgress(((currentStep + 1) / guideSteps.length) * 100);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setProgress(((currentStep - 1) / guideSteps.length) * 100);
    }
  };

  const currentGuideStep = guideSteps[currentStep];
  const totalCompleted = completedSteps.size;
  const overallProgress = (totalCompleted / guideSteps.length) * 100;

  useEffect(() => {
    setProgress(((currentStep + 1) / guideSteps.length) * 100);
  }, [currentStep, guideSteps.length]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        title={t('voiceGuide.title')}
        showBack={true}
      />

      <div className="pb-20">
        {/* Progress Overview */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('voiceGuide.progress')}
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {totalCompleted}/{guideSteps.length} {t('voiceGuide.completed')}
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">{t('voiceGuide.currentStep')}</p>
                    <p className="text-sm font-bold text-gray-900">{currentStep + 1}/{guideSteps.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">{t('voiceGuide.totalCompleted')}</p>
                    <p className="text-sm font-bold text-green-600">{totalCompleted}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Current Step */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoryColor(currentGuideStep.category)}>
                          {getCategoryIcon(currentGuideStep.category)}
                          <span className="ml-1 text-xs">
                            {t(`voiceGuide.categories.${currentGuideStep.category}`)}
                          </span>
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {currentGuideStep.duration}s
                        </span>
                      </div>
                      <CardTitle className="text-lg">
                        {currentGuideStep.title}
                      </CardTitle>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {completedSteps.has(currentGuideStep.id) ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {currentGuideStep.description}
                  </p>

                  {/* Voice Instruction */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Volume2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                          {t('voiceGuide.tryThis')}
                        </h4>
                        <p className="text-blue-800 dark:text-blue-200 text-sm">
                          "{currentGuideStep.voiceInstruction}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Audio Controls */}
                  <div className="flex items-center gap-3 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlayAudio(currentGuideStep.audioUrl)}
                      disabled={isPlaying}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          {t('voiceGuide.playing')}
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          {t('voiceGuide.playExample')}
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStepComplete(currentGuideStep.id)}
                      disabled={completedSteps.has(currentGuideStep.id)}
                    >
                      {completedSteps.has(currentGuideStep.id) ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('voiceGuide.completed')}
                        </>
                      ) : (
                        <>
                          <Circle className="h-4 w-4 mr-2" />
                          {t('voiceGuide.markComplete')}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePreviousStep}
                      disabled={currentStep === 0}
                    >
                      <SkipBack className="h-4 w-4 mr-2" />
                      {t('common.previous')}
                    </Button>

                    <span className="text-sm text-gray-500">
                      {currentStep + 1} / {guideSteps.length}
                    </span>

                    <Button
                      onClick={handleNextStep}
                      disabled={currentStep === guideSteps.length - 1}
                    >
                      {t('common.next')}
                      <SkipForward className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Step Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                {t('voiceGuide.allSteps')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {guideSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      index === currentStep 
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <div className="flex-shrink-0">
                      {completedSteps.has(step.id) ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : index === currentStep ? (
                        <Circle className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getCategoryColor(step.category)} variant="outline">
                          {getCategoryIcon(step.category)}
                          <span className="ml-1 text-xs">
                            {t(`voiceGuide.categories.${step.category}`)}
                          </span>
                        </Badge>
                        <span className="text-xs text-gray-500">{step.duration}s</span>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {step.title}
                      </h4>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {index + 1}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}