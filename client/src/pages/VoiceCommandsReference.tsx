import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { 
  Mic, 
  Search, 
  ShoppingBag, 
  MessageCircle, 
  Settings, 
  Navigation,
  Volume2,
  Play,
  Copy,
  Check
} from 'lucide-react';

interface VoiceCommand {
  id: string;
  command: string;
  description: string;
  example: string;
  category: 'shopping' | 'navigation' | 'negotiation' | 'settings' | 'general';
  language: string;
  audioUrl?: string;
}

export function VoiceCommandsReference() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('shopping');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  // Mock voice commands data
  const [commands] = useState<VoiceCommand[]>([
    // Shopping Commands
    {
      id: 'shop_001',
      command: 'Show me apples under 100 rupees',
      description: 'Search for products with price filter',
      example: 'Show me [product] under [price]',
      category: 'shopping',
      language: 'en',
      audioUrl: '/audio/commands/show_me_apples.mp3'
    },
    {
      id: 'shop_002',
      command: 'मुझे 100 रुपये के अंदर सेब दिखाओ',
      description: 'Search for products with price filter (Hindi)',
      example: 'मुझे [price] के अंदर [product] दिखाओ',
      category: 'shopping',
      language: 'hi'
    },
    {
      id: 'shop_003',
      command: 'Add 2 kg mangoes to cart',
      description: 'Add specific quantity to cart',
      example: 'Add [quantity] [product] to cart',
      category: 'shopping',
      language: 'en'
    },
    {
      id: 'shop_004',
      command: 'Find organic vegetables near me',
      description: 'Location-based product search',
      example: 'Find [category] near me',
      category: 'shopping',
      language: 'en'
    },

    // Navigation Commands
    {
      id: 'nav_001',
      command: 'Go to my orders',
      description: 'Navigate to order history',
      example: 'Go to [page name]',
      category: 'navigation',
      language: 'en'
    },
    {
      id: 'nav_002',
      command: 'Open voice settings',
      description: 'Navigate to voice configuration',
      example: 'Open [settings type] settings',
      category: 'navigation',
      language: 'en'
    },
    {
      id: 'nav_003',
      command: 'Show my profile',
      description: 'Navigate to user profile',
      example: 'Show my [section]',
      category: 'navigation',
      language: 'en'
    },

    // Negotiation Commands
    {
      id: 'neg_001',
      command: 'I want to pay 150 rupees',
      description: 'Make a price offer',
      example: 'I want to pay [amount]',
      category: 'negotiation',
      language: 'en'
    },
    {
      id: 'neg_002',
      command: 'मैं 150 रुपये देना चाहता हूं',
      description: 'Make a price offer (Hindi)',
      example: 'मैं [amount] देना चाहता हूं',
      category: 'negotiation',
      language: 'hi'
    },
    {
      id: 'neg_003',
      command: 'Accept this deal',
      description: 'Accept vendor\'s offer',
      example: 'Accept this [deal/offer/price]',
      category: 'negotiation',
      language: 'en'
    },
    {
      id: 'neg_004',
      command: 'Can you reduce the price?',
      description: 'Request price reduction',
      example: 'Can you [reduce/lower] the price?',
      category: 'negotiation',
      language: 'en'
    },

    // Settings Commands
    {
      id: 'set_001',
      command: 'Change language to Hindi',
      description: 'Switch interface language',
      example: 'Change language to [language]',
      category: 'settings',
      language: 'en'
    },
    {
      id: 'set_002',
      command: 'Turn on voice assistant',
      description: 'Enable voice features',
      example: 'Turn [on/off] voice assistant',
      category: 'settings',
      language: 'en'
    },
    {
      id: 'set_003',
      command: 'Increase voice speed',
      description: 'Adjust voice synthesis speed',
      example: '[Increase/Decrease] voice speed',
      category: 'settings',
      language: 'en'
    },

    // General Commands
    {
      id: 'gen_001',
      command: 'Help',
      description: 'Get assistance and guidance',
      example: 'Help [with specific topic]',
      category: 'general',
      language: 'en'
    },
    {
      id: 'gen_002',
      command: 'What can I say?',
      description: 'List available voice commands',
      example: 'What can I [say/do]?',
      category: 'general',
      language: 'en'
    },
    {
      id: 'gen_003',
      command: 'Repeat that',
      description: 'Repeat last voice response',
      example: 'Repeat [that/last message]',
      category: 'general',
      language: 'en'
    }
  ]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'shopping': return <ShoppingBag className="h-4 w-4" />;
      case 'navigation': return <Navigation className="h-4 w-4" />;
      case 'negotiation': return <MessageCircle className="h-4 w-4" />;
      case 'settings': return <Settings className="h-4 w-4" />;
      case 'general': return <Mic className="h-4 w-4" />;
      default: return <Mic className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'shopping': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'navigation': return 'bg-green-100 text-green-800 border-green-200';
      case 'negotiation': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'settings': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'general': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredCommands = commands.filter(cmd => {
    const matchesTab = activeTab === 'all' || cmd.category === activeTab;
    const matchesSearch = searchQuery === '' || 
      cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handlePlayAudio = (audioUrl: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    }
  };

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command).then(() => {
      setCopiedCommand(command);
      setTimeout(() => setCopiedCommand(null), 2000);
    });
  };

  const commandsByCategory = {
    shopping: commands.filter(cmd => cmd.category === 'shopping').length,
    navigation: commands.filter(cmd => cmd.category === 'navigation').length,
    negotiation: commands.filter(cmd => cmd.category === 'negotiation').length,
    settings: commands.filter(cmd => cmd.category === 'settings').length,
    general: commands.filter(cmd => cmd.category === 'general').length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        title={t('voiceCommands.title')}
        showBack={true}
      />

      <div className="pb-20">
        {/* Search Section */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('voiceCommands.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('voiceCommands.totalCommands')}</p>
                    <p className="text-2xl font-bold text-gray-900">{commands.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('voiceCommands.languages')}</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="shopping">
                {t('voiceCommands.categories.shopping')} ({commandsByCategory.shopping})
              </TabsTrigger>
              <TabsTrigger value="negotiation">
                {t('voiceCommands.categories.negotiation')} ({commandsByCategory.negotiation})
              </TabsTrigger>
              <TabsTrigger value="navigation">
                {t('voiceCommands.categories.navigation')} ({commandsByCategory.navigation})
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <TabsTrigger value="settings" className="w-full">
                {t('voiceCommands.categories.settings')} ({commandsByCategory.settings})
              </TabsTrigger>
              <TabsTrigger value="general" className="w-full">
                {t('voiceCommands.categories.general')} ({commandsByCategory.general})
              </TabsTrigger>
            </div>

            {/* Commands List */}
            <div className="space-y-3">
              {filteredCommands.map((command, index) => (
                <motion.div
                  key={command.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Badge className={getCategoryColor(command.category)}>
                            {getCategoryIcon(command.category)}
                            <span className="ml-1 text-xs">
                              {t(`voiceCommands.categories.${command.category}`)}
                            </span>
                          </Badge>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                "{command.command}"
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {command.description}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-2">
                              {command.language && (
                                <Badge variant="outline" className="text-xs">
                                  {command.language.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                            <p className="text-xs text-gray-500 mb-1">
                              {t('voiceCommands.pattern')}:
                            </p>
                            <code className="text-sm text-blue-600 dark:text-blue-400">
                              {command.example}
                            </code>
                          </div>

                          <div className="flex items-center gap-2">
                            {command.audioUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePlayAudio(command.audioUrl!)}
                                className="text-xs"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                {t('voiceCommands.playExample')}
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyCommand(command.command)}
                              className="text-xs"
                            >
                              {copiedCommand === command.command ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  {t('voiceCommands.copied')}
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  {t('voiceCommands.copy')}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {filteredCommands.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchQuery ? 
                        t('voiceCommands.noResults', { query: searchQuery }) :
                        t('voiceCommands.noCommands')
                      }
                    </p>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        onClick={() => setSearchQuery('')}
                      >
                        {t('voiceCommands.clearSearch')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </Tabs>

          {/* Quick Tips */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                {t('voiceCommands.tips.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {t('voiceCommands.tips.speakClearly')}
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {t('voiceCommands.tips.useNaturalLanguage')}
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {t('voiceCommands.tips.waitForResponse')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}