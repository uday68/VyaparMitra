import React, { useRef, useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Camera, AlertCircle } from 'lucide-react';
import { QRSessionService } from '../services/qrSessionService';
import { QRSessionData, SupportedLanguage, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../types/qr-commerce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

interface CrossLanguageQRScannerProps {
  onScanSuccess: (sessionData: QRSessionData, customerLanguage: SupportedLanguage) => void;
  onScanError?: (error: string) => void;
}

export const CrossLanguageQRScanner: React.FC<CrossLanguageQRScannerProps> = ({ 
  onScanSuccess, 
  onScanError 
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const qrSessionService = new QRSessionService();
  
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedSession, setScannedSession] = useState<QRSessionData | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "cross-lang-qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2
        },
        false
      );

      scanner.render(
        async (decodedText) => {
          setIsValidating(true);
          setError(null);
          
          try {
            // Validate the QR code with the backend
            const sessionData = await qrSessionService.validateQRCode(decodedText);
            
            if (sessionData.isValid) {
              setScannedSession(sessionData);
              setShowLanguageSelection(true);
              scanner.clear();
              setIsScanning(false);
            } else {
              setError('Invalid or expired QR code. Please ask the vendor for a new one.');
            }
          } catch (error) {
            const errorMessage = 'Failed to validate QR code. Please try again.';
            setError(errorMessage);
            if (onScanError) {
              onScanError(errorMessage);
            }
          } finally {
            setIsValidating(false);
          }
        },
        (error) => {
          // Only show errors that are not just scanning failures
          if (!error.includes('No QR code found')) {
            console.warn('QR Scanner error:', error);
          }
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [isScanning, onScanError]);

  const handleStartScanning = () => {
    setError(null);
    setScannedSession(null);
    setShowLanguageSelection(false);
    setIsScanning(true);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    setError(null);
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
  };

  const handleLanguageConfirm = () => {
    if (scannedSession && selectedLanguage) {
      onScanSuccess(scannedSession, selectedLanguage);
    }
  };

  const handleBackToScanning = () => {
    setShowLanguageSelection(false);
    setScannedSession(null);
    setError(null);
  };

  if (showLanguageSelection && scannedSession) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 mr-2 text-green-600" />
            <h3 className="text-lg font-semibold">QR Code Scanned Successfully!</h3>
          </div>
          
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800 mb-2">
              Ready to negotiate with vendor
            </p>
            <p className="text-xs text-green-600">
              Vendor speaks: <strong>{LANGUAGE_NAMES[scannedSession.vendorLanguage as SupportedLanguage]}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-left">
              <Label htmlFor="language-select" className="text-sm font-medium">
                Select your preferred language:
              </Label>
              <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as SupportedLanguage)}>
                <SelectTrigger id="language-select" className="w-full mt-2">
                  <SelectValue placeholder="Choose your language" />
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

            <div className="flex gap-2">
              <Button 
                onClick={handleLanguageConfirm}
                className="flex-1"
                disabled={!selectedLanguage}
              >
                Start Negotiation
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBackToScanning}
                className="flex-1"
              >
                Scan Again
              </Button>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p>You can change your language during the conversation</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Camera className="w-8 h-8 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold">Scan Vendor's QR Code</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Point your camera at the vendor's QR code to start a multilingual negotiation
        </p>

        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isScanning ? (
          <Button 
            onClick={handleStartScanning}
            className="w-full"
            disabled={isValidating}
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Start Scanning
              </>
            )}
          </Button>
        ) : (
          <div>
            <div id="cross-lang-qr-reader" className="mb-4 rounded-lg overflow-hidden"></div>
            
            {isValidating && (
              <div className="flex items-center justify-center mb-4 text-blue-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="text-sm">Validating QR code...</span>
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleStopScanning}
              className="w-full"
              disabled={isValidating}
            >
              Stop Scanning
            </Button>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>• Make sure the QR code is well-lit and clearly visible</p>
          <p>• Hold your device steady while scanning</p>
          <p>• You'll be able to communicate in your preferred language</p>
        </div>
      </div>
    </Card>
  );
};