import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  QrCode, 
  Scan, 
  MessageSquare, 
  Globe,
  CheckCircle,
  Users,
  ArrowRight
} from 'lucide-react';

import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { CrossLanguageQRScanner } from '../components/CrossLanguageQRScanner';
import { QRSessionData, SupportedLanguage } from '../types/qr-commerce';

export const CrossLanguageDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [demoStep, setDemoStep] = useState(1);

  const handleQRGenerated = (sessionId: string) => {
    console.log('QR Generated:', sessionId);
    setDemoStep(2);
  };

  const handleQRScanned = (sessionData: QRSessionData, language: SupportedLanguage) => {
    console.log('QR Scanned:', sessionData, language);
    setDemoStep(3);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Cross-Language QR Commerce</h1>
        <p className="text-lg text-gray-600 mb-6">
          Break language barriers in commerce with AI-powered real-time translation
        </p>
        
        <div className="flex justify-center gap-4 mb-8">
          <Badge variant="outline" className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            12 Indian Languages
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            Voice + Text Support
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Real-time Translation
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendor">Vendor Demo</TabsTrigger>
          <TabsTrigger value="customer">Customer Demo</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle>How Cross-Language Commerce Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Generate QR Code</h3>
                  <p className="text-sm text-gray-600">
                    Vendor creates a QR code for their product in their preferred language
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Scan className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Customer Scans</h3>
                  <p className="text-sm text-gray-600">
                    Customer scans QR code and selects their preferred language
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Real-time Chat</h3>
                  <p className="text-sm text-gray-600">
                    Both parties communicate in their native language with AI translation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Flow */}
          <Card>
            <CardHeader>
              <CardTitle>Interactive Demo Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className={`flex items-center gap-2 ${demoStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${demoStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    1
                  </div>
                  <span className="font-medium">Vendor generates QR</span>
                </div>
                
                <ArrowRight className="w-4 h-4 text-gray-400" />
                
                <div className={`flex items-center gap-2 ${demoStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${demoStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                    2
                  </div>
                  <span className="font-medium">Customer scans QR</span>
                </div>
                
                <ArrowRight className="w-4 h-4 text-gray-400" />
                
                <div className={`flex items-center gap-2 ${demoStep >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${demoStep >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                    3
                  </div>
                  <span className="font-medium">Start negotiation</span>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={() => setActiveTab('vendor')} variant="outline">
                  Try Vendor Demo
                </Button>
                <Button onClick={() => setActiveTab('customer')} variant="outline">
                  Try Customer Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Vendor Experience
              </CardTitle>
              <p className="text-gray-600">
                Generate a QR code for your product and let customers negotiate in any language
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <QRCodeGenerator
                  productId="demo-mango"
                  productName="Alphonso Mangoes"
                  productPrice={800}
                  onSessionCreated={handleQRGenerated}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5" />
                Customer Experience
              </CardTitle>
              <p className="text-gray-600">
                Scan a vendor's QR code to start negotiating in your preferred language
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <CrossLanguageQRScanner
                  onScanSuccess={handleQRScanned}
                  onScanError={(error) => console.error('Scan error:', error)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Language Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>English, Hindi, Bengali</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Telugu, Tamil, Malayalam</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Kannada, Gujarati, Marathi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Punjabi, Odia, Assamese</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Voice message support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Text chat with translation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Real-time message delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Typing indicators</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>BHASHINI AI translation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Fallback translation services</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Offline message queuing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Session recovery</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Expand to new markets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Improve customer experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Increase conversion rates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Seamless payment flow</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};