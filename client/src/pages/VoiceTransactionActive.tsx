import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { 
  Mic, 
  Link, 
  Gavel, 
  CheckCircle, 
  X,
  Volume2
} from 'lucide-react';

export function VoiceTransactionActive() {
  const [, setLocation] = useLocation();
  const { negotiationId } = useParams<{ negotiationId: string }>();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);

  const steps = [
    {
      title: t('voiceTransaction.steps.processing.title'),
      description: t('voiceTransaction.steps.processing.description'),
      icon: Mic,
      duration: 2000
    },
    {
      title: t('voiceTransaction.steps.connecting.title'),
      description: t('voiceTransaction.steps.connecting.description'),
      icon: Link,
      duration: 1500
    },
    {
      title: t('voiceTransaction.steps.negotiating.title'),
      description: t('voiceTransaction.steps.negotiating.description'),
      icon: Gavel,
      duration: 3000
    },
    {
      title: t('voiceTransaction.steps.finalizing.title'),
      description: t('voiceTransaction.steps.finalizing.description'),
      icon: CheckCircle,
      duration: 1000
    }
  ];

  useEffect(() => {
    const processSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      }
      setIsProcessing(false);
      // Navigate to success page
      setTimeout(() => {
        setLocation(`/transaction-success/${negotiationId || 'demo'}`);
      }, 1000);
    };

    processSteps();
  }, [setLocation, negotiationId, steps]);

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentIcon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="absolute -top-2 -left-2 p-2"
          >
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('voiceTransaction.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('voiceTransaction.subtitle')}
          </p>
        </div>

        {/* Main Animation Area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Central Animation */}
          <motion.div 
            className="relative mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Outer Ring */}
            <motion.div 
              className="w-32 h-32 border-4 border-blue-200 dark:border-blue-800 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Middle Ring */}
            <motion.div 
              className="absolute inset-2 w-28 h-28 border-4 border-blue-400 dark:border-blue-600 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Inner Circle with Icon */}
            <motion.div 
              className="absolute inset-6 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CurrentIcon className="text-white h-8 w-8" />
            </motion.div>

            {/* Floating Particles */}
            <div className="absolute -inset-8">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-blue-400 rounded-full"
                  style={{
                    top: `${20 + Math.sin(i * 60 * Math.PI / 180) * 40}%`,
                    left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 40}%`,
                  }}
                  animate={{ 
                    y: [-10, 10, -10],
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: i * 0.5 
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Current Step Info */}
          <motion.div 
            className="text-center mb-8"
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {currentStepData.description}
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="w-full max-w-xs mb-8">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>{t('voiceTransaction.step')} {currentStep + 1} {t('common.of')} {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-4 mb-8">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={index}
                  className={`flex flex-col items-center transition-all duration-300 ${
                    index <= currentStep ? 'opacity-100' : 'opacity-40'
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: index === currentStep ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    index < currentStep 
                      ? 'bg-green-500 text-white' 
                      : index === currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 text-center max-w-16">
                    {step.title.split(' ')[0]}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Voice Feedback */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full"
                    animate={{ 
                      height: [12, 24, 12],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1, 
                      repeat: Infinity, 
                      delay: i * 0.2 
                    }}
                  />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white text-sm font-medium">
                  {isProcessing ? t('voiceTransaction.processing') : t('voiceTransaction.completed')}
                </p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Volume2 className="h-5 w-5 text-blue-600" />
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Cancel Button */}
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mt-4 w-full text-gray-600 dark:text-gray-400"
        >
          {t('voiceTransaction.cancel')}
        </Button>
      </div>
    </div>
  );
}