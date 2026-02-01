import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Languages, 
  User, 
  Store,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { 
  NegotiationRoom, 
  NegotiationMessage, 
  SupportedLanguage, 
  LANGUAGE_NAMES, 
  SUPPORTED_LANGUAGES,
  MessageInput 
} from '../types/qr-commerce';
import { useNegotiationRoom } from '../hooks/useNegotiationRoom';
import { useToast } from '../hooks/use-toast';

interface NegotiationInterfaceProps {
  sessionId: string;
  userId: string;
  userType: 'VENDOR' | 'CUSTOMER';
  initialLanguage: SupportedLanguage;
  onAgreementReached?: (agreementDetails: any) => void;
  token: string; // JWT token for WebSocket authentication
}

export const NegotiationInterface: React.FC<NegotiationInterfaceProps> = ({
  sessionId,
  userId,
  userType,
  initialLanguage,
  onAgreementReached,
  token
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const {
    room,
    messages,
    isConnected,
    isLoading,
    error,
    typingUsers,
    sendMessage,
    updateTypingStatus,
    joinNegotiation,
    reconnect
  } = useNegotiationRoom({
    sessionId,
    userId,
    token
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join negotiation if customer
  useEffect(() => {
    if (userType === 'CUSTOMER' && !room?.customerId) {
      joinNegotiation(currentLanguage);
    }
  }, [userType, room, currentLanguage, joinNegotiation]);

  // Handle typing indicators
  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 3000);
  };

  const handleSendTextMessage = async () => {
    if (!messageText.trim()) return;

    const messageInput: MessageInput = {
      content: messageText.trim(),
      type: 'TEXT',
      language: currentLanguage
    };

    const success = await sendMessage(messageInput);
    if (success) {
      setMessageText('');
      setIsTyping(false);
      updateTypingStatus(false);
    } else {
      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to send voice messages.",
        variant: "destructive"
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleSendVoiceMessage = async () => {
    if (!audioBlob) return;

    const messageInput: MessageInput = {
      content: 'Voice message', // Placeholder - will be replaced by STT
      type: 'VOICE',
      language: currentLanguage,
      audioData: audioBlob
    };

    const success = await sendMessage(messageInput);
    if (success) {
      setAudioBlob(null);
      toast({
        title: "Voice message sent",
        description: "Your voice message is being processed and translated.",
      });
    } else {
      toast({
        title: "Failed to send voice message",
        description: "Please try again or use text instead.",
        variant: "destructive"
      });
    }
  };

  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setCurrentLanguage(newLanguage);
    toast({
      title: "Language Changed",
      description: `Switched to ${LANGUAGE_NAMES[newLanguage]}. Future messages will be in this language.`,
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStatusIcon = (message: NegotiationMessage) => {
    switch (message.translationStatus) {
      case 'PENDING':
        return <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'FAILED':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Connecting to negotiation room...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Cross-Language Negotiation
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            
            {room?.status && (
              <Badge variant="outline">
                {room.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Your language:</span>
          <Select value={currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {LANGUAGE_NAMES[lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Connection Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="outline" size="sm" onClick={reconnect}>
                Reconnect
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === userId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.senderId === userId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center gap-2 mb-1">
                    {message.senderType === 'VENDOR' ? (
                      <Store className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    <span className="text-xs opacity-75">
                      {message.senderType === 'VENDOR' ? 'Vendor' : 'Customer'}
                    </span>
                    {message.type === 'VOICE' && (
                      <Volume2 className="w-3 h-3" />
                    )}
                    {getMessageStatusIcon(message)}
                  </div>

                  {/* Message Content */}
                  <div className="space-y-1">
                    <p className="text-sm">{message.content}</p>
                    
                    {/* Show original content if different (translated) */}
                    {message.originalContent !== message.content && (
                      <p className="text-xs opacity-75 italic">
                        Original: {message.originalContent}
                      </p>
                    )}

                    {/* Audio Player for voice messages */}
                    {message.type === 'VOICE' && message.audioUrl && (
                      <audio controls className="w-full mt-2">
                        <source src={message.audioUrl} type="audio/wav" />
                        Your browser does not support audio playback.
                      </audio>
                    )}
                  </div>

                  {/* Message Footer */}
                  <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                    <span>{formatTimestamp(message.timestamp)}</span>
                    <div className="flex items-center gap-1">
                      <span>{LANGUAGE_NAMES[message.language]}</span>
                      {message.language !== message.targetLanguage && (
                        <>
                          <span>→</span>
                          <span>{LANGUAGE_NAMES[message.targetLanguage]}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>
                      {typingUsers.length === 1 ? 'Someone is' : 'People are'} typing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Voice Message Preview */}
        {audioBlob && (
          <div className="p-4 border-t bg-yellow-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm">Voice message recorded</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAudioBlob(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSendVoiceMessage}>
                  Send Voice Message
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            {/* Text Input */}
            <Input
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTypingStart();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendTextMessage();
                }
              }}
              placeholder={`Type your message in ${LANGUAGE_NAMES[currentLanguage]}...`}
              disabled={!isConnected}
              className="flex-1"
            />

            {/* Voice Recording Button */}
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={!isConnected || !!audioBlob}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            {/* Send Button */}
            <Button
              onClick={handleSendTextMessage}
              disabled={!messageText.trim() || !isConnected}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            {isRecording ? (
              <span className="text-red-600">🔴 Recording... Click mic to stop</span>
            ) : (
              <span>Press Enter to send • Click mic for voice message</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};