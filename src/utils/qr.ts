import QRCode from 'qrcode';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface QRCodeData {
  vendorId: string;
  sessionId: string;
  timestamp: number;
  expiresAt: number;
}

export class QRService {
  private static readonly QR_TTL = 30 * 60 * 1000; // 30 minutes

  static async generateVendorQR(vendorId: string): Promise<string> {
    try {
      // Generate unique session ID
      const sessionId = crypto.randomUUID();
      const timestamp = Date.now();
      const expiresAt = timestamp + this.QR_TTL;

      // Create QR data
      const qrData: QRCodeData = {
        vendorId,
        sessionId,
        timestamp,
        expiresAt,
      };

      // Generate QR code content (JSON string)
      const qrContent = JSON.stringify(qrData);

      // Generate QR code image
      const qrImageBuffer = await QRCode.toBuffer(qrContent, {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });

      // Save QR code image
      const qrImageUrl = await this.saveQRImage(qrImageBuffer, sessionId);

      return qrImageUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw error;
    }
  }

  static async generateQRWithCustomData(data: any, options?: {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }): Promise<string> {
    try {
      const qrContent = JSON.stringify(data);
      
      const qrOptions = {
        type: 'png' as const,
        width: options?.width || 300,
        margin: options?.margin || 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: options?.errorCorrectionLevel || 'M' as const,
      };

      const qrImageBuffer = await QRCode.toBuffer(qrContent, qrOptions);
      const sessionId = crypto.randomUUID();
      const qrImageUrl = await this.saveQRImage(qrImageBuffer, sessionId);

      return qrImageUrl;
    } catch (error) {
      console.error('Failed to generate custom QR code:', error);
      throw error;
    }
  }

  private static async saveQRImage(imageBuffer: Buffer, sessionId: string): Promise<string> {
    const filename = `qr_${sessionId}.png`;
    const qrDir = path.join(process.cwd(), 'public', 'qr');
    const filePath = path.join(qrDir, filename);

    try {
      // Ensure QR directory exists
      await fs.mkdir(qrDir, { recursive: true });

      // Save QR image
      await fs.writeFile(filePath, imageBuffer);

      // Return public URL
      return `/qr/${filename}`;
    } catch (error) {
      console.error('Failed to save QR image:', error);
      throw error;
    }
  }

  static parseQRData(qrContent: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrContent) as QRCodeData;
      
      // Validate required fields
      if (!data.vendorId || !data.sessionId || !data.timestamp || !data.expiresAt) {
        return null;
      }

      // Check if QR code has expired
      if (Date.now() > data.expiresAt) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to parse QR data:', error);
      return null;
    }
  }

  static isQRExpired(qrData: QRCodeData): boolean {
    return Date.now() > qrData.expiresAt;
  }

  static getQRTimeRemaining(qrData: QRCodeData): number {
    const remaining = qrData.expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  // Generate QR for different purposes
  static async generateProductQR(productId: string, vendorId: string): Promise<string> {
    const qrData = {
      type: 'product',
      productId,
      vendorId,
      timestamp: Date.now(),
    };

    return await this.generateQRWithCustomData(qrData);
  }

  static async generateNegotiationQR(negotiationId: string): Promise<string> {
    const qrData = {
      type: 'negotiation',
      negotiationId,
      timestamp: Date.now(),
    };

    return await this.generateQRWithCustomData(qrData);
  }

  // Batch QR generation for multiple vendors
  static async generateBatchQRs(vendorIds: string[]): Promise<{ vendorId: string; qrUrl: string }[]> {
    const results = await Promise.allSettled(
      vendorIds.map(async (vendorId) => ({
        vendorId,
        qrUrl: await this.generateVendorQR(vendorId),
      }))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<{ vendorId: string; qrUrl: string }> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  // Clean up expired QR images
  static async cleanupExpiredQRs(): Promise<void> {
    try {
      const qrDir = path.join(process.cwd(), 'public', 'qr');
      const files = await fs.readdir(qrDir);

      const now = Date.now();
      const cleanupPromises = files.map(async (file) => {
        const filePath = path.join(qrDir, file);
        const stats = await fs.stat(filePath);
        
        // Delete files older than QR_TTL
        if (now - stats.mtime.getTime() > this.QR_TTL) {
          await fs.unlink(filePath);
          console.log(`Cleaned up expired QR: ${file}`);
        }
      });

      await Promise.allSettled(cleanupPromises);
    } catch (error) {
      console.error('Failed to cleanup expired QRs:', error);
    }
  }
}