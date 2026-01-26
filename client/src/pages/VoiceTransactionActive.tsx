import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function VoiceTransactionActive() {
  const navigate = useNavigate();
  const { negotiationId } = useParams<{ negotiationId: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);

  const steps = [
    {
      title: 'Processing Voice Command',
      description: 'Analyzing your negotiation request...',
      icon: 'mic',
      duration: 2000
    },
    {
      title: 'Connecting to Vendor',
      description: 'Establishing secure connection...',
      icon: 'link',
      duration: 1500
    },
    {
      title: 'Negotiating Price',
      description: 'AI is negotiating on your behalf...',
      icon: 'gavel',
      duration: 3000
    },
    {
      title: 'Finalizing Deal',
      description: 'Confirming transaction details...',
      icon: 'check_circle',
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
        navigate(`/transaction-success/${negotiationId || 'demo'}`);
      }, 1000);
    };

    processSteps();
  }, [navigate, negotiationId]);

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-8 left-6 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">close</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Voice Transaction
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Processing your request...
          </p>
        </div>

        {/* Main Animation Area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Central Animation */}
          <div className="relative mb-8">
            {/* Outer Ring */}
            <div className="w-32 h-32 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin-slow"></div>
            
            {/* Middle Ring */}
            <div className="absolute inset-2 w-28 h-28 border-4 border-blue-400 dark:border-blue-600 rounded-full animate-spin-reverse"></div>
            
            {/* Inner Circle with Icon */}
            <div className="absolute inset-6 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-3xl animate-pulse">
                {currentStepData.icon}
              </span>
            </div>

            {/* Floating Particles */}
            <div className="absolute -inset-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-blue-400 rounded-full animate-float"
                  style={{
                    top: `${20 + Math.sin(i * 60 * Math.PI / 180) * 40}%`,
                    left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 40}%`,
                    animationDelay: `${i * 0.5}s`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Current Step Info */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {currentStepData.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-xs mb-8">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-4 mb-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex flex-col items-center transition-all duration-300 ${
                  index <= currentStep ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                    ? 'bg-blue-600 text-white animate-pulse' 
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <span className="material-symbols-outlined text-sm">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">{step.icon}</span>
                  )}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 text-center max-w-16">
                  {step.title.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Feedback */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <span className="w-1 h-4 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="w-1 h-6 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
              <span className="w-1 h-3 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 dark:text-white text-sm font-medium">
                {isProcessing ? 'Processing your voice command...' : 'Transaction completed!'}
              </p>
            </div>
            <span className="material-symbols-outlined text-blue-600 animate-pulse">
              record_voice_over
            </span>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={() => navigate(-1)}
          className="mt-4 w-full bg-transparent text-gray-600 dark:text-gray-400 font-medium py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel Transaction
        </button>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.7; }
          50% { transform: translateY(-10px) scale(1.1); opacity: 1; }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 2s linear infinite;
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}