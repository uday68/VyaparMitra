import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQRScanner } from '../services/qrScannerService';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Camera, CameraOff, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess?: (vendorData: { vendorId: string; shopName?: string }) => void;
  onClose?: () => void;
  showManualEntry?: boolean;
}

const QRScanner = ({
  onScanSuccess,
  onClose,
  showManualEntry = true
}: QRScannerProps) => {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [showManual, setShowManual] = useState(false);
  const [manualVendorId, setManualVendorId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    videoRef,
    isScanning,
    error,
    result,
    devices,
    selectedDevice,
    setSelectedDevice,
    startScanning,
    stopScanning,
    resetScanner,
    isSupported,
    parseVendorQR
  } = useQRScanner();

  // Handle successful QR scan
  useEffect(() => {
    if (result && !isProcessing) {
      setIsProcessing(true);
      
      const vendorData = parseVendorQR(result.text);
      if (vendorData) {
        onScanSuccess?.(vendorData);
        setLocation(`/shop/${vendorData.vendorId}`);
      } else {
        resetScanner();
        setIsProcessing(false);
      }
    }
  }, [result, parseVendorQR, onScanSuccess, setLocation, resetScanner, isProcessing]);

  // Handle manual vendor ID entry
  const handleManualEntry = () => {
    if (manualVendorId.trim()) {
      const vendorData = { vendorId: manualVendorId.trim() };
      onScanSuccess?.(vendorData);
      setLocation(`/shop/${vendorData.vendorId}`);
    }
  };

  // Start scanning on component mount
  useEffect(() => {
    if (isSupported && !showManual) {
      startScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isSupported, showManual, startScanning, stopScanning]);

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            {t('qrScanner.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {t('qrScanner.notSupported')}
            </AlertDescription>
          </Alert>
          
          {showManualEntry && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendorId">{t('qrScanner.vendorId')}</Label>
                <Input
                  id="vendorId"
                  value={manualVendorId}
                  onChange={(e) => setManualVendorId(e.target.value)}
                  placeholder={t('qrScanner.vendorId')}
                />
              </div>
              <Button 
                onClick={handleManualEntry}
                disabled={!manualVendorId.trim()}
                className="w-full"
              >
                {t('common.continue')}
              </Button>
            </div>
          )}
          
          {onClose && (
            <Button variant="outline" onClick={onClose} className="w-full">
              {t('common.close')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (showManual) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('qrScanner.manualEntry')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendorId">{t('qrScanner.vendorId')}</Label>
            <Input
              id="vendorId"
              value={manualVendorId}
              onChange={(e) => setManualVendorId(e.target.value)}
              placeholder={t('qrScanner.vendorId')}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleManualEntry}
              disabled={!manualVendorId.trim()}
              className="flex-1"
            >
              {t('common.continue')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowManual(false)}
              className="flex-1"
            >
              {t('qrScanner.scanVendorQR')}
            </Button>
          </div>
          
          {onClose && (
            <Button variant="outline" onClick={onClose} className="w-full">
              {t('common.close')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {t('qrScanner.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('qrScanner.subtitle')}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Camera Selection */}
        {devices.length > 1 && (
          <div className="space-y-2">
            <Label>{t('qrScanner.switchCamera')}</Label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || 
                      (device.deviceId.includes('front') ? 
                        t('qrScanner.frontCamera') : 
                        t('qrScanner.backCamera')
                      )
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Video Preview */}
        <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-white rounded-lg relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
          </div>

          {/* Status Overlay */}
          {isScanning && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                {t('qrScanner.scanning')}
              </div>
            </div>
          )}

          {result && (
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
              <div className="bg-green-500 text-white p-3 rounded-full">
                <CheckCircle className="h-8 w-8" />
              </div>
            </div>
          )}
        </div>
        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• {t('qrScanner.instructions.holdSteady')}</p>
          <p>• {t('qrScanner.instructions.pointAtQR')}</p>
          <p>• {t('qrScanner.instructions.ensureGoodLighting')}</p>
          <p>• {t('qrScanner.instructions.moveCloser')}</p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.code === 'PERMISSION_DENIED' && t('qrScanner.permissionDenied')}
              {error.code === 'NOT_FOUND' && t('qrScanner.errors.cameraNotFound')}
              {error.code === 'NOT_SUPPORTED' && t('qrScanner.notSupported')}
              {error.code === 'UNKNOWN' && error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isScanning && !result && (
            <Button onClick={startScanning} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              {t('qrScanner.startScanning')}
            </Button>
          )}
          
          {isScanning && (
            <Button onClick={stopScanning} variant="outline" className="flex-1">
              <CameraOff className="h-4 w-4 mr-2" />
              {t('qrScanner.stopScanning')}
            </Button>
          )}
          
          {(error || result) && (
            <Button onClick={() => { resetScanner(); startScanning(); }} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('qrScanner.scanAgain')}
            </Button>
          )}
        </div>

        {/* Manual Entry Option */}
        {showManualEntry && (
          <Button 
            variant="outline" 
            onClick={() => setShowManual(true)}
            className="w-full"
          >
            {t('qrScanner.manualEntry')}
          </Button>
        )}

        {/* Close Button */}
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="w-full">
            {t('common.close')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QRScanner;