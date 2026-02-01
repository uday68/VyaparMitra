import React, { useState } from 'react';
import { useLocation } from 'wouter';

export function VoiceCommandsGuide() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState('shopping');

  const commandCategories = {
    shopping: {
      title: 'Shopping Commands',
      icon: 'shopping_cart',
      commands: [
        {
          command: '"Show me apples"',
          description: 'Browse specific products',
          example: 'Voice: "Show me apples" → System displays apple products'
        },
        {
          command: '"Place bid for 150 rupees"',
          description: 'Start price negotiation',
          example: 'Voice: "Place bid for 150 rupees" → Opens negotiation chat'
        },
        {
          command: '"Search for fruits"',
          description: 'Search product categories',
          example: 'Voice: "Search for fruits" → Shows all fruit products'
        },
        {
          command: '"Add to cart"',
          description: 'Add current item to cart',
          example: 'Voice: "Add to cart" → Item added to shopping cart'
        }
      ]
    },
    negotiation: {
      title: 'Negotiation Commands',
      icon: 'gavel',
      commands: [
        {
          command: '"Accept offer"',
          description: 'Accept the current price',
          example: 'Voice: "Accept offer" → Deal confirmed at current price'
        },
        {
          command: '"Counter with 175"',
          description: 'Make a counter offer',
          example: 'Voice: "Counter with 175" → Sends counter offer of ₹175'
        },
        {
          command: '"Reject offer"',
          description: 'Decline current offer',
          example: 'Voice: "Reject offer" → Declines and continues negotiation'
        },
        {
          command: '"Final offer 180"',
          description: 'Make your final offer',
          example: 'Voice: "Final offer 180" → Sends ₹180 as final offer'
        }
      ]
    },
    navigation: {
      title: 'Navigation Commands',
      icon: 'navigation',
      commands: [
        {
          command: '"Go back"',
          description: 'Navigate to previous screen',
          example: 'Voice: "Go back" → Returns to previous page'
        },
        {
          command: '"Go to settings"',
          description: 'Open settings menu',
          example: 'Voice: "Go to settings" → Opens app settings'
        },
        {
          command: '"Show my orders"',
          description: 'View order history',
          example: 'Voice: "Show my orders" → Opens order history page'
        },
        {
          command: '"Help"',
          description: 'Get assistance',
          example: 'Voice: "Help" → Shows help and support options'
        }
      ]
    },
    vendor: {
      title: 'Vendor Commands',
      icon: 'storefront',
      commands: [
        {
          command: '"Add product apples 200 rupees"',
          description: 'Add new product with price',
          example: 'Voice: "Add product apples 200 rupees" → Creates new apple product'
        },
        {
          command: '"Update stock to 50"',
          description: 'Update product inventory',
          example: 'Voice: "Update stock to 50" → Sets stock quantity to 50'
        },
        {
          command: '"Show my products"',
          description: 'View your product list',
          example: 'Voice: "Show my products" → Displays vendor product catalog'
        },
        {
          command: '"Generate QR code"',
          description: 'Create shop QR code',
          example: 'Voice: "Generate QR code" → Creates shareable shop QR code'
        }
      ]
    }
  };

  const handleTryCommand = (command: string) => {
    // Simulate voice command
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`You said: ${command}`);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-gray-900 dark:text-white">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Voice Commands</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Learn how to use voice features</p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Object.entries(commandCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                  activeCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{category.icon}</span>
                {category.title}
              </button>
            ))}
          </div>
        </div>

        {/* Commands List */}
        <div className="px-4 pb-8">
          <div className="space-y-4">
            {commandCategories[activeCategory as keyof typeof commandCategories].commands.map((cmd, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-blue-600 text-lg">mic</span>
                      <code className="text-blue-600 font-semibold text-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                        {cmd.command}
                      </code>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium mb-1">
                      {cmd.description}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {cmd.example}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTryCommand(cmd.command)}
                    className="ml-3 p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                    title="Try this command"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="px-4 pb-8">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-sm">lightbulb</span>
              </div>
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-400 mb-2">Pro Tips</h3>
                <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
                  <li>• Speak clearly and at normal pace</li>
                  <li>• Use specific numbers for prices (e.g., "175 rupees")</li>
                  <li>• Wait for the beep before speaking</li>
                  <li>• Say "repeat" if you didn't hear the response</li>
                  <li>• Use "cancel" to stop current voice interaction</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Test Section */}
        <div className="px-4 pb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-400">Test Your Voice</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">Practice with the voice assistant</p>
              </div>
              <span className="material-symbols-outlined text-blue-600 text-2xl">record_voice_over</span>
            </div>
            <button
              onClick={() => setLocation('/voice-test')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Voice Practice
            </button>
          </div>
        </div>

        {/* Language Note */}
        <div className="px-4 pb-8">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Voice commands work in English, Hindi, Marathi, Gujarati, Tamil, and Bengali.
              <br />
              Change language in Settings → Voice Settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}