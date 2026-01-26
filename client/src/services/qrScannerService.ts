import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import React from 'react';

export interface QRScanResult {
  text: string;
  format: string;
  timestamp: number;
}

export interface QRScanError {
  message: string;
  code: 'PERMISSION_DENIED' | 'NOT_FOUND' | 'NOT_SUPPORTED' | 'UNKNOWN';
}

export class QRScannerService {
  private static reader: BrowserMultiFormatReader | null = null;
  private static currentStream: MediaStream | null = null;

  /**
   * Initialize the QR scanner
   */
  static async initialize(): Promise<BrowserMultiFormatReader> {
    if (!this.reader) {
      this.reader = new BrowserMultiFormatReader();
    }
    return this.reader;
  }

  /**
   * Check if QR scanning is supported
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Get available video input devices (cameras)
   */
  static async getVideoInputDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Failed to get video devices:', error);
      return [];
    }
  }

  /**
   * Start scanning for QR codes
   */
  static async startScanning(
    videoElement: HTMLVideoElement,
    onResult: (result: QRScanResult) => void,
    onError: (error: QRScanError) => void,
    deviceId?: string
  ): Promise<void> {
    try {
      const reader = await this.initialize();
      
      // Stop any existing stream
      await this.stopScanning();

      // Get video constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: deviceId ? undefined : 'environment', // Prefer back camera
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      // Get camera stream
      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.currentStream;

      // Start decoding
      reader.decodeFromVideoDevice(
        deviceId || undefined,
        videoElement,
        (result: any, error: any) => {
          if (result) {
            onResult({
              text: result.getText(),
              format: result.getBarcodeFormat().toString(),
              timestamp: Date.now()
            });
          }
          
          if (error && !(error instanceof NotFoundException)) {
            onError({
              message: error.message || 'Unknown scanning error',
              code: 'UNKNOWN'
            });
          }
        }
      );

    } catch (error: any) {
      let errorCode: QRScanError['code'] = 'UNKNOWN';
      let errorMessage = 'Failed to start QR scanner';

      if (error.name === 'NotAllowedError') {
        errorCode = 'PERMISSION_DENIED';
        errorMessage = 'Camera permission denied';
      } else if (error.name === 'NotFoundError') {
        errorCode = 'NOT_FOUND';
        errorMessage = 'No camera found';
      } else if (error.name === 'NotSupportedError') {
        errorCode = 'NOT_SUPPORTED';
        errorMessage = 'QR scanning not supported';
      }

      onError({
        message: errorMessage,
        code: errorCode
      });
    }
  }

  /**
   * Stop scanning and release camera
   */
  static async stopScanning(): Promise<void> {
    try {
      // Stop the reader
      if (this.reader) {
        this.reader.reset();
      }

      // Stop camera stream
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
      }
    } catch (error) {
      console.error('Failed to stop QR scanner:', error);
    }
  }

  /**
   * Parse vendor QR code data
   */
  static parseVendorQR(qrText: string): { vendorId: string; shopName?: string } | null {
    try {
      // Try parsing as JSON first
      const data = JSON.parse(qrText);
      if (data.vendorId || data.vendor_id) {
        return {
          vendorId: data.vendorId || data.vendor_id,
          shopName: data.shopName || data.shop_name
        };
      }
    } catch {
      // Not JSON, try other formats
    }

    // Try URL format: https://vyaparmitra.com/vendor/123
    const urlMatch = qrText.match(/\/vendor\/([a-zA-Z0-9]+)/);
    if (urlMatch) {
      return {
        vendorId: urlMatch[1]
      };
    }

    // Try simple vendor ID format: VENDOR_123
    const vendorMatch = qrText.match(/^VENDOR_([a-zA-Z0-9]+)$/);
    if (vendorMatch) {
      return {
        vendorId: vendorMatch[1]
      };
    }

    // Try direct vendor ID (if it looks like an ID)
    if (/^[a-zA-Z0-9]{6,}$/.test(qrText)) {
      return {
        vendorId: qrText
      };
    }

    return null;
  }

  /**
   * Validate QR code format
   */
  static isValidVendorQR(qrText: string): boolean {
    return this.parseVendorQR(qrText) !== null;
  }

  /**
   * Request camera permission
   */
  static async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }
}

// React hook for QR scanning
export function useQRScanner() {
  const [isScanning, setIsScanning] = React.useState(false);
  const [error, setError] = React.useState<QRScanError | null>(null);
  const [result, setResult] = React.useState<QRScanResult | null>(null);
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = React.useState<string>('');

  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Load available devices
  React.useEffect(() => {
    const loadDevices = async () => {
      if (QRScannerService.isSupported()) {
        const videoDevices = await QRScannerService.getVideoInputDevices();
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDevice) {
          // Prefer back camera
          const backCamera = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear')
          );
          setSelectedDevice(backCamera?.deviceId || videoDevices[0].deviceId);
        }
      }
    };

    loadDevices();
  }, [selectedDevice]);

  const startScanning = async () => {
    if (!videoRef.current) return;

    setIsScanning(true);
    setError(null);
    setResult(null);

    await QRScannerService.startScanning(
      videoRef.current,
      (scanResult) => {
        setResult(scanResult);
        setIsScanning(false);
      },
      (scanError) => {
        setError(scanError);
        setIsScanning(false);
      },
      selectedDevice
    );
  };

  const stopScanning = async () => {
    await QRScannerService.stopScanning();
    setIsScanning(false);
  };

  const resetScanner = () => {
    setError(null);
    setResult(null);
  };

  return {
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
    isSupported: QRScannerService.isSupported(),
    parseVendorQR: QRScannerService.parseVendorQR,
    isValidVendorQR: QRScannerService.isValidVendorQR
  };
}

// Add React import for the hook
// import React from 'react'; - moved to top