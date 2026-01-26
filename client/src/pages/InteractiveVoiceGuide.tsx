import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function InteractiveVoiceGuide() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      id: 'stock',
      title: 'Check Inventory',
      category: '📦 STOCK',
      color: 'blue',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWndRZkEf30x2zMu1jcDTcvGrTkSnMVtOlIznznZJwZna9q1jnay39CGSd2gcBRsp5n6MonyzeNDzn9cD95sLfemG1t_Yty4vxX0UbBfMNlEQ3501ZWJb33deEBFGroNdIEcGCZDaT6YHfbDogNPckRHwANVroYJ1E_mpAlg__DLEDXQ31uk_kAWvbD8ZEGDzKdqQdyTkXguSu8qobi08uZAx6fZLU3D6nmfxH2vFbIS0l2EwKIMr42Jj8A1yyRSjUFQt1O0XZ',
      commands: [
        { text: "What's my current stock level?", action: 'Try it' },
        { text: "List items low on stock", action: 'Try it' }
      ],
      icon: 'inventory_2'
    },
    {
      id: 'chat',
      title: 'Manage Messages',
      category: '💬 CHAT',
      color: 'green',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwtfCayUPFMA1CXW_kBfk69LgV-t9x8qbrZ9yWbY_HBmRhUfGBqlkATZaGNoVFoSBS96pm7Vyb4cXxEueNGSBnBmPHMlqP6d08EHyYKDoEQeJydbddwT5Q6wfeNOKzvzu0-9zalOt8LkhcJYFQlu_-cyrfahgNeJ7JDNQ0E9jJeQQTUk8NuhP7Zt38wGX2UAwdP-P3DnK6L3PKzqdqxI_yKdtGPccuyAqvZZTTiSzoY_qgxyS1UMpLea1tMIkpgPViLdgoUWYF',
      commands: [
        { text: "Read my unread messages", action: 'Try it' },
        { text: "Reply to the last buyer...", action: 'Try it' }
      ],
      icon: 'forum'
    },
    {
      id: 'deals',
      title: 'Track Transactions',
      category: '💰 DEALS',
      color: 'amber',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA60VoouxypVR1LHenS-XgGouBadB8MphDETG2hm7uQG2Q8tsNQ6wN5PVkAym7u9cKzXpb8Qgd-zHTFKwGZ1X2dZNGG4aFs5wAVrWidUk2fzOgGhVyxg7StnZT6s8FvlHjt3pFsvi0zxjwB5oCklXW7XuuaG5eeSfF2oHegriKCyHch9D47uc3i--X5F6L_eUpmMInry2PgB0UQgro_HhtO8BDvuOtYXkIfwXRYvHPuWMBCMSc-_utd_CcHObihVHjMhFETRXvL',
      commands: [
        { text: "What are today's top deals?", action: 'Try it' },
        { text: "Show recent sales revenue", action: 'Try it' }
      ],
      icon: 'payments'
    }
  ];

  const handleTryCommand = (command: string) => {
    // Simulate voice command execution
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Executing command: ${command}`);
      speechSynthesis.speak(utterance);
    }
    console.log('Trying command:', command);
  };

  const getStepColor = (color: string) => {
    switch (color) {
      case 'blue': return 'from-blue-100/50 to-blue-600/10';
      case 'green': return 'from-green-100/50 to-green-500/10';
      case 'amber': return 'from-amber-100/50 to-amber-500/10';
      default: return 'from-gray-100/50 to-gray-500/10';
    }
  };

  const getCategoryColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600';
      case 'green': return 'bg-green-50 dark:bg-green-900/30 text-green-600';
      case 'amber': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-600';
      default: return 'bg-gray-50 dark:bg-gray-900/30 text-gray-600';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 font-display text-gray-900 dark:text-white min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center size-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight">Voice Guide</h1>
        </div>
        <button 
          onClick={() => navigate('/voice-commands')}
          className="flex items-center justify-center size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600"
        >
          <span className="material-symbols-outlined">help</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Quick Tips Action Panel */}
        <div className="p-4">
          <div className="flex flex-col gap-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-full">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-blue-600 text-base font-bold leading-tight">Quick Tip</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-normal leading-normal">
                  Keep your phone within 3 feet and say "Hey Assistant" to start hands-free.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-[10px] font-bold uppercase tracking-wider text-blue-600 border border-blue-200 dark:border-blue-800">
                New Feature
              </span>
              <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-500 border border-gray-200 dark:border-gray-700">
                Offline Mode
              </span>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="px-4 py-2">
          <h2 className="text-2xl font-bold tracking-tight">Interactive Tutorial</h2>
          <p className="text-gray-500 text-sm">Master your business with voice commands</p>
        </div>

        {/* Interactive Timeline / Card Flow */}
        <div className="relative px-4 mt-6">
          {/* Timeline Line */}
          <div className="absolute left-9 top-10 bottom-0 w-0.5 bg-blue-600/20 dark:bg-blue-600/40 rounded-full"></div>
          
          <div className="space-y-12 relative">
            {tutorialSteps.map((step, index) => (
              <div key={step.id} className="flex gap-6">
                <div className="relative z-10 flex-shrink-0 flex items-center justify-center size-10 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                  <span className="material-symbols-outlined">{step.icon}</span>
                </div>
                
                <div className="flex-1">
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(step.color)}`}>
                        {step.category}
                      </span>
                      <div className="flex gap-1">
                        {tutorialSteps.map((_, i) => (
                          <div 
                            key={i}
                            className={`size-1.5 rounded-full ${
                              i === index ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="relative h-40 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${getStepColor(step.color)}`}></div>
                      <img 
                        alt={`${step.title} Voice Guide`}
                        className="h-full w-full object-cover opacity-80" 
                        src={step.image}
                      />
                      <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-gray-900/90 p-2 rounded-lg shadow-sm">
                        <span className="material-symbols-outlined text-blue-600">mic</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    
                    <div className="space-y-3">
                      {step.commands.map((command, cmdIndex) => (
                        <div key={cmdIndex} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                          <p className="text-sm italic">"{command.text}"</p>
                          <button 
                            onClick={() => handleTryCommand(command.text)}
                            className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium hover:bg-blue-700 transition-colors"
                          >
                            {command.action}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar (iOS Style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-6 pt-2 pb-8 flex justify-between items-center z-50">
        <button 
          onClick={() => navigate('/')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium">Home</span>
        </button>
        
        <button className="flex flex-col items-center gap-1 text-blue-600">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>mic</span>
          <span className="text-[10px] font-medium">Voice</span>
        </button>
        
        <div className="-mt-8 size-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/40">
          <span className="material-symbols-outlined text-3xl">add</span>
        </div>
        
        <button 
          onClick={() => navigate('/analytics')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <span className="material-symbols-outlined">analytics</span>
          <span className="text-[10px] font-medium">Stats</span>
        </button>
        
        <button 
          onClick={() => navigate('/voice-settings-page')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>
    </div>
  );
}