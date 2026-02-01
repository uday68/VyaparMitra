import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  QrCode, 
  Scan, 
  MessageSquare, 
  ArrowLeft, 
  Users, 
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { CrossLanguageQRScanner } from '../components/CrossLanguageQRScanner';
import { NegotiationInterface } from '../components/NegotiationInterface';
import { QRSessionData, SupportedLanguage } from '../types/qr-commerce';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';

// Mock GraphQL client - replace with your actual GraphQL client
const mockGraphQLClient = {
  subscribe: (query: string, variables?: any) => ({
    subscribe: (observer: any) => ({ unsubscribe: () => {} })
  }),
  request: async (query: string, variables?: any) => {
    // Mock implementation - replace with actual GraphQL client
    return {};
  }
};

interface CrossLanguageNegotiationProps {
  productId?: string;
  productName?: string;
  productPrice?: number;
}

export const CrossLanguageNegotiation: React.FC<CrossLanguageNegotiationProps> = ({
  productId,
  productName = "Sample Product",
  productPrice = 1000
}) => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/negotiate/:mode/:sessionId?');
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentMode, setCurrentMode] = useState<'generate' | 'scan' | 'negotiate'>('generate');
  const [sessionData, setSessionData] = useState<QRSessionData | null>(null);
  const [customerLanguage, setCustomerLanguage] = useState<SupportedLanguage>('en');
  const [isVendor, setIsVendor] = useState(true);

  // Parse URL parameters
  useEffect(() => {
    if (match && params) {
      const mode = params.mode as 'generate' | 'scan' | 'negotiate';
      setCurrentMode(mode);
      
      if (params.sessionId && mode === 'negotiate') {
        // Load session data for negotiation
        setSessionData({
          sessionId: params.sessionId,
          vendorId: '',
          productId: productId || '',
          vendorLanguage: 'hi',
          isValid: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'ACTIVE'
        });
      }
    }
  }, [match, params, productId]);

  // Determine user role
  useEffect(() => {
    // In a real app, this would be determined by user role or context
    // For demo purposes, we'll use URL or default logic
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    setIsVendor(role !== 'customer');
  }, []);

  const handleModeChange = (mode: 'generate' | 'scan' | 'negotiate') => {
    setCurrentMode(mode);
    setLocation(`/negotiate/${mode}`);
  };

  const handleQRGenerated = (sessionId: string) => {
    toast({
      title: "QR Code Ready",
      description: "Share this QR code with customers to start multilingual negotiations.",
    });
  };

  const handleQRScanned = (scannedData: QRSessionData, selectedLanguage: SupportedLanguage) => {
    setSessionData(scannedData);
    setCustomerLanguage(selectedLanguage);
    setCurrentMode('negotiate');
    setLocation(`/negotiate/negotiate/${scannedData.sessionId}`);
    
    toast({
      title: "Joining Negotiation",
      description: `Connected to vendor. You can now communicate in your preferred language.`,
    });
  };

  const handleBackToHome = () => {
    setLocation('/');
  };

  const renderModeSelector = () => (
    <div className="flex justify-center mb-6">
      <Tabs value={currentMode} onValueChange={(value) => handleModeChange(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Generate QR
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Scan className="w-4 h-4" />
            Scan QR
          </TabsTrigger>
          <TabsTrigger value="negotiate" className="flex items-center gap-2" disabled={!sessionData}>
            <MessageSquare className="w-4 h-4" />
            Negotiate
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );

  const renderFeatureHighlights = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Cross-Language Commerce Features
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Real-time Translation</p>
              <p className="text-gray-600">Powered by BHASHINI for 12 Indian languages</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Voice & Text Support</p>
              <p className="text-gray-600">Communicate using voice messages or text</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Seamless Payment</p>
              <p className="text-gray-600">Complete transactions in your language</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-gray-600 mb-4">
              Please log in to use the cross-language negotiation feature.
            </p>
            <Button onClick={() => setLocation('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBackToHome}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">Cross-Language Negotiation</h1>
            <p className="text-gray-600">
              Communicate with customers in any language using AI translation
            </p>
          </div>
        </div>

        <Badge variant="outline" className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {isVendor ? 'Vendor' : 'Customer'}
        </Badge>
      </div>

      {/* Feature Highlights */}
      {renderFeatureHighlights()}

      {/* Mode Selector */}
      {currentMode !== 'negotiate' && renderModeSelector()}

      {/* Main Content */}
      <div className="space-y-6">
        {currentMode === 'generate' && (
          <div className="flex justify-center">
            <QRCodeGenerator
              productId={productId || 'demo-product'}
              productName={productName}
              productPrice={productPrice}
              onSessionCreated={handleQRGenerated}
            />
          </div>
        )}

        {currentMode === 'scan' && (
          <div className="flex justify-center">
            <CrossLanguageQRScanner
              onScanSuccess={handleQRScanned}
              onScanError={(error) => {
                toast({
                  title: "Scan Failed",
                  description: error,
                  variant: "destructive"
                });
              }}
            />
          </div>
        )}

        {currentMode === 'negotiate' && sessionData && (
          <div className="space-y-4">
            {/* Session Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{productName}</p>
                      <p className="text-sm text-gray-600">
                        Session: {sessionData.sessionId.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Active Negotiation
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Negotiation Interface */}
            <div className="flex justify-center">
              <NegotiationInterface
                sessionId={sessionData.sessionId}
                userId={user.id}
                userType={isVendor ? 'VENDOR' : 'CUSTOMER'}
                initialLanguage={isVendor ? (sessionData.vendorLanguage as SupportedLanguage) : customerLanguage}
                graphqlClient={mockGraphQLClient}
                onAgreementReached={(details) => {
                  toast({
                    title: "Agreement Reached!",
                    description: "Proceeding to payment...",
                  });
                  // Handle payment flow
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">For Vendors:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Select your product and preferred language</li>
                <li>Generate a QR code for the product</li>
                <li>Display the QR code for customers to scan</li>
                <li>Negotiate in real-time with automatic translation</li>
                <li>Complete the sale when terms are agreed</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">For Customers:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Scan the vendor's QR code with your phone</li>
                <li>Select your preferred language</li>
                <li>Start negotiating using voice or text</li>
                <li>All messages are translated automatically</li>
                <li>Pay in your language when you agree on terms</li>
              </ol>
            </div>
          </div>

          <Alert>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              <strong>Supported Languages:</strong> English, Hindi, Bengali, Telugu, Tamil, Malayalam, 
              Kannada, Gujarati, Marathi, Punjabi, Odia, and Assamese
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};