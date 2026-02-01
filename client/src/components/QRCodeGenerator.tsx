import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { 
  QrCode, 
  Download, 
  Share2, 
  RefreshCw, 
  Clock, 
  Users, 
  AlertCircle,
  CheckCircle,
  Copy
} from 'lucide-react';
import { QRSessionService } from '../services/qrSessionService';
import { SupportedLanguage, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../types/qr-commerce';
import { useToast } from '../hooks/use-toast';

interface QRCodeGeneratorProps {
  productId?: string;
  productName?: string;
  productPrice?: number;
  qrType: 'product' | 'general';
  vendorId: string;
  vendorName: string;
  onSessionCreated?: (sessionId: string) => void;
}

interface QRSessionData {
  qrCodeUrl: string;
  sessionToken: string;
  sessionId: string;
  expiresAt: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  productId,
  productName,
  productPrice,
  qrType,
  vendorId,
  vendorName,
  onSessionCreated
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('hi');
  const [qrSession, setQrSession] = useState<QRSessionData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  
  const qrSessionService = new QRSessionService();
  const { toast } = useToast();

  // Update countdown timer
  useEffect(() => {
    if (!qrSession) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(qrSession.expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      setIsExpired(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [qrSession]);

  const handleGenerateQR = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      let result;
      
      if (qrType === 'product' && productId) {
        // Generate product-specific QR code
        result = await qrSessionService.generateQRCode(productId, selectedLanguage);
      } else {
        // Generate general conversation QR code
        result = await qrSessionService.generateGeneralQRCode(vendorId, selectedLanguage);
      }
      
      if (result.success && result.qrCodeUrl && result.sessionId) {
        setQrSession({
          qrCodeUrl: result.qrCodeUrl,
          sessionToken: result.sessionToken || '',
          sessionId: result.sessionId,
          expiresAt: result.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

        if (onSessionCreated) {
          onSessionCreated(result.sessionId);
        }

        toast({
          title: "QR Code Generated",
          description: qrType === 'product' 
            ? "Customers can now scan this QR code to negotiate this product in their language."
            : "Customers can now scan this QR code to start a conversation with you in their language.",
        });
      } else {
        setError(result.error || 'Failed to generate QR code');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateQR = async () => {
    setQrSession(null);
    await handleGenerateQR();
  };

  const handleDownloadQR = () => {
    if (!qrSession?.qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrSession.qrCodeUrl;
    const fileName = qrType === 'product' && productName
      ? `qr-code-${productName.replace(/\s+/g, '-').toLowerCase()}.png`
      : `qr-code-${vendorName.replace(/\s+/g, '-').toLowerCase()}-general.png`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "QR Code Downloaded",
      description: "QR code has been saved to your device.",
    });
  };

  const handleCopySessionId = async () => {
    if (!qrSession?.sessionId) return;

    try {
      await navigator.clipboard.writeText(qrSession.sessionId);
      toast({
        title: "Session ID Copied",
        description: "Session ID has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy session ID to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleShareQR = async () => {
    if (!qrSession?.qrCodeUrl) return;

    const shareTitle = qrType === 'product' && productName
      ? `Negotiate for ${productName}`
      : `Chat with ${vendorName}`;
    
    const shareText = qrType === 'product' && productName
      ? `Scan this QR code to negotiate the price of ${productName} in your language!`
      : `Scan this QR code to start a conversation with ${vendorName} in your language!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Page link has been copied to clipboard.",
        });
      } catch (err) {
        toast({
          title: "Share Failed",
          description: "Could not share QR code.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          {qrType === 'product' ? 'Generate QR Code for Product Negotiation' : 'Generate QR Code for General Conversation'}
        </CardTitle>
        <div className="text-sm text-gray-600">
          {qrType === 'product' && productName && productPrice ? (
            <>
              <p className="font-medium">{productName}</p>
              <p>Starting Price: ₹{productPrice.toLocaleString()}</p>
            </>
          ) : (
            <>
              <p className="font-medium">{vendorName}</p>
              <p>General conversation and inquiries</p>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!qrSession ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="vendor-language">Your Language</Label>
              <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as SupportedLanguage)}>
                <SelectTrigger id="vendor-language">
                  <SelectValue placeholder="Select your language" />
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

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleGenerateQR}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating QR Code...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate QR Code
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              {qrType === 'product' ? (
                <>
                  <p>• Customers will scan this QR code to negotiate this product</p>
                  <p>• They can communicate in their preferred language</p>
                  <p>• Real-time voice translation will handle the conversation</p>
                  <p>• Voice messages will be translated and played automatically</p>
                </>
              ) : (
                <>
                  <p>• Customers will scan this QR code to start a conversation</p>
                  <p>• They can ask questions or make general inquiries</p>
                  <p>• Real-time voice translation will handle the conversation</p>
                  <p>• Voice messages will be translated and played automatically</p>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* QR Code Display */}
            <div className="text-center">
              <div className="relative inline-block">
                <img 
                  src={qrSession.qrCodeUrl} 
                  alt="QR Code for negotiation"
                  className="w-48 h-48 mx-auto border rounded-lg shadow-sm"
                />
                {isExpired && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center rounded-lg">
                    <Badge variant="destructive" className="text-xs">
                      EXPIRED
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Session Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <Badge variant={isExpired ? "destructive" : "default"}>
                  {isExpired ? (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Expired
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Time Remaining:</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className={isExpired ? "text-red-600" : "text-green-600"}>
                    {timeRemaining}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Your Language:</span>
                <span>{LANGUAGE_NAMES[selectedLanguage]}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Session ID:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopySessionId}
                  className="h-auto p-1 text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {qrSession.sessionId.substring(0, 8)}...
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQR}
                disabled={isExpired}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShareQR}
                disabled={isExpired}
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateQR}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                New QR
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-500 space-y-1 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">Instructions for customers:</p>
              <p>1. Scan this QR code with your phone camera</p>
              <p>2. Select your preferred language</p>
              <p>3. Tap the microphone to speak in your language</p>
              <p>4. Your voice will be translated and played to the vendor</p>
              <p>5. The vendor's response will be translated back to you</p>
              {qrType === 'product' && <p>6. Complete the purchase when you agree on terms</p>}
            </div>

            {isExpired && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This QR code has expired. Generate a new one to continue accepting customers.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};