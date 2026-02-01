// Client-side QR Session Service
import { SupportedLanguage } from '../types/qr-commerce';

export interface QRSessionData {
  sessionId: string;
  vendorId: string;
  productId: string;
  vendorLanguage: string;
  isValid: boolean;
  expiresAt: string;
}

export interface JoinSessionResponse {
  success: boolean;
  negotiationRoom?: {
    id: string;
    sessionId: string;
    vendorId: string;
    customerId: string;
    vendorLanguage: string;
    customerLanguage: string;
    status: string;
  };
  error?: string;
}

export class QRSessionService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '/api';
  }

  /**
   * Validate QR code and get session information
   */
  async validateQRCode(qrToken: string): Promise<QRSessionData> {
    try {
      const response = await fetch(`${this.baseUrl}/qr-sessions/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate QR code');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('QR validation error:', error);
      return {
        sessionId: '',
        vendorId: '',
        productId: '',
        vendorLanguage: 'en',
        isValid: false,
        expiresAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Join a negotiation session as a customer
   */
  async joinSession(
    sessionId: string,
    customerId: string,
    customerLanguage: SupportedLanguage
  ): Promise<JoinSessionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/qr-sessions/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          sessionId,
          customerId,
          customerLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to join session',
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Join session error:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  /**
   * Generate QR code for general conversation (vendor side)
   */
  async generateGeneralQRCode(
    vendorId: string,
    vendorLanguage: SupportedLanguage
  ): Promise<{
    success: boolean;
    qrCodeUrl?: string;
    sessionToken?: string;
    sessionId?: string;
    expiresAt?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/qr-sessions/generate-general`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          vendorId,
          vendorLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to generate general QR code',
        };
      }

      const data = await response.json();
      return {
        success: true,
        ...data,
      };
    } catch (error) {
      console.error('General QR generation error:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  /**
   * Generate QR code for a product (vendor side)
   */
  async generateQRCode(
    productId: string,
    vendorLanguage: SupportedLanguage
  ): Promise<{
    success: boolean;
    qrCodeUrl?: string;
    sessionToken?: string;
    sessionId?: string;
    expiresAt?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/qr-sessions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          productId,
          vendorLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to generate QR code',
        };
      }

      const data = await response.json();
      return {
        success: true,
        ...data,
      };
    } catch (error) {
      console.error('QR generation error:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  /**
   * Get active sessions for a vendor
   */
  async getActiveSessions(): Promise<QRSessionData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/qr-sessions/active`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch active sessions');
      }

      const data = await response.json();
      return data.sessions || [];
    } catch (error) {
      console.error('Get active sessions error:', error);
      return [];
    }
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/qr-sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to end session',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('End session error:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }
}