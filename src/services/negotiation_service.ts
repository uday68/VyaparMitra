import { getPool } from '../db/postgres';
import { TranslationService } from './translation_service';
import { TTSService } from '../voice/tts_service';
import { StockLockService } from './stock_lock_service';

export enum NegotiationStatus {
  OPEN = 'OPEN',
  COUNTERED = 'COUNTERED',
  ACCEPTED = 'ACCEPTED',
  LOCKED = 'LOCKED',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED'
}

export interface Negotiation {
  id: number;
  vendorId: string;
  customerId: string;
  productId: string;
  status: NegotiationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bid {
  id: number;
  negotiationId: number;
  bidderType: 'vendor' | 'customer';
  bidderId: string;
  amount: number;
  message?: string;
  language: string;
  audioUrl?: string;
  createdAt: Date;
}

export interface CreateBidRequest {
  negotiationId: number;
  bidderType: 'vendor' | 'customer';
  bidderId: string;
  amount: number;
  message?: string;
  language: string;
  targetLanguage?: string;
}

export class NegotiationService {
  private static readonly NEGOTIATION_TTL = 24 * 60 * 60 * 1000; // 24 hours

  static async createNegotiation(
    vendorId: string,
    customerId: string,
    productId: string
  ): Promise<Negotiation> {
    try {
      const pool = getPool();
      
      const result = await pool.query(`
        INSERT INTO negotiations (vendor_id, customer_id, product_id, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [vendorId, customerId, productId, NegotiationStatus.OPEN]);

      const negotiation = this.mapRowToNegotiation(result.rows[0]);
      
      console.log(`✅ Negotiation created: ${negotiation.id}`);
      return negotiation;
    } catch (error) {
      console.error('Failed to create negotiation:', error);
      throw error;
    }
  }

  static async createBid(request: CreateBidRequest): Promise<{
    bid: Bid;
    spokenResponseUrl?: string;
    translatedMessage?: string;
  }> {
    try {
      const pool = getPool();

      // Validate negotiation exists and is active
      const negotiation = await this.getNegotiationById(request.negotiationId);
      if (!negotiation) {
        throw new Error('Negotiation not found');
      }

      if (![NegotiationStatus.OPEN, NegotiationStatus.COUNTERED].includes(negotiation.status)) {
        throw new Error('Negotiation is not active');
      }

      // Translate message if target language is specified
      let translatedMessage = request.message;
      if (request.message && request.targetLanguage && request.language !== request.targetLanguage) {
        translatedMessage = await TranslationService.translateWithContext(
          request.message,
          request.language,
          request.targetLanguage,
          'negotiation'
        );
      }

      // Generate spoken response
      let spokenResponseUrl: string | undefined;
      const responseText = translatedMessage || request.message || `New bid: $${request.amount}`;
      
      try {
        const ttsResponse = await TTSService.speak({
          text: responseText,
          language: request.targetLanguage || request.language,
          userId: request.bidderId,
          userType: request.bidderType,
        });
        spokenResponseUrl = ttsResponse.audioUrl;
      } catch (ttsError) {
        console.warn('TTS generation failed for bid:', ttsError);
      }

      // Insert bid
      const bidResult = await pool.query(`
        INSERT INTO bids (negotiation_id, bidder_type, bidder_id, amount, message, language, audio_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        request.negotiationId,
        request.bidderType,
        request.bidderId,
        request.amount,
        translatedMessage || request.message,
        request.language,
        spokenResponseUrl
      ]);

      // Update negotiation status
      await pool.query(`
        UPDATE negotiations 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [NegotiationStatus.COUNTERED, request.negotiationId]);

      const bid = this.mapRowToBid(bidResult.rows[0]);

      console.log(`✅ Bid created: ${bid.id} for negotiation: ${request.negotiationId}`);
      
      return {
        bid,
        spokenResponseUrl,
        translatedMessage,
      };
    } catch (error) {
      console.error('Failed to create bid:', error);
      throw error;
    }
  }

  static async acceptBid(
    negotiationId: number,
    accepterId: string,
    accepterType: 'vendor' | 'customer',
    language: string
  ): Promise<{
    success: boolean;
    spokenResponseUrl?: string;
    message: string;
  }> {
    try {
      const pool = getPool();

      // Get negotiation and latest bid
      const negotiation = await this.getNegotiationById(negotiationId);
      if (!negotiation) {
        throw new Error('Negotiation not found');
      }

      const latestBid = await this.getLatestBid(negotiationId);
      if (!latestBid) {
        throw new Error('No bids found for negotiation');
      }

      // Validate accepter is not the same as the bidder
      if (latestBid.bidderId === accepterId) {
        throw new Error('Cannot accept your own bid');
      }

      // Try to lock stock
      const stockLocked = await StockLockService.lockStock(
        negotiation.productId,
        accepterId,
        300 // 5 minutes lock
      );

      if (!stockLocked) {
        const message = 'Stock is currently locked by another transaction';
        return {
          success: false,
          message,
        };
      }

      // Update negotiation status to ACCEPTED
      await pool.query(`
        UPDATE negotiations 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [NegotiationStatus.ACCEPTED, negotiationId]);

      // Generate acceptance message
      const acceptanceMessage = `Bid accepted! Final price: $${latestBid.amount}`;
      
      let spokenResponseUrl: string | undefined;
      try {
        const ttsResponse = await TTSService.speak({
          text: acceptanceMessage,
          language,
          userId: accepterId,
          userType: accepterType,
        });
        spokenResponseUrl = ttsResponse.audioUrl;
      } catch (ttsError) {
        console.warn('TTS generation failed for acceptance:', ttsError);
      }

      console.log(`✅ Bid accepted for negotiation: ${negotiationId}`);
      
      return {
        success: true,
        spokenResponseUrl,
        message: acceptanceMessage,
      };
    } catch (error) {
      console.error('Failed to accept bid:', error);
      throw error;
    }
  }

  static async rejectBid(
    negotiationId: number,
    rejecterId: string,
    rejectorType: 'vendor' | 'customer',
    language: string,
    reason?: string
  ): Promise<{
    success: boolean;
    spokenResponseUrl?: string;
    message: string;
  }> {
    try {
      const pool = getPool();

      // Update negotiation status
      await pool.query(`
        UPDATE negotiations 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [NegotiationStatus.REJECTED, negotiationId]);

      // Generate rejection message
      const rejectionMessage = reason 
        ? `Bid rejected: ${reason}`
        : 'Bid rejected';
      
      let spokenResponseUrl: string | undefined;
      try {
        const ttsResponse = await TTSService.speak({
          text: rejectionMessage,
          language,
          userId: rejecterId,
          userType: rejectorType,
        });
        spokenResponseUrl = ttsResponse.audioUrl;
      } catch (ttsError) {
        console.warn('TTS generation failed for rejection:', ttsError);
      }

      console.log(`✅ Bid rejected for negotiation: ${negotiationId}`);
      
      return {
        success: true,
        spokenResponseUrl,
        message: rejectionMessage,
      };
    } catch (error) {
      console.error('Failed to reject bid:', error);
      throw error;
    }
  }

  static async getNegotiationById(id: number): Promise<Negotiation | null> {
    try {
      const pool = getPool();
      const result = await pool.query('SELECT * FROM negotiations WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToNegotiation(result.rows[0]);
    } catch (error) {
      console.error('Failed to get negotiation:', error);
      return null;
    }
  }

  static async getNegotiationBids(negotiationId: number): Promise<Bid[]> {
    try {
      const pool = getPool();
      const result = await pool.query(
        'SELECT * FROM bids WHERE negotiation_id = $1 ORDER BY created_at ASC',
        [negotiationId]
      );

      return result.rows.map(this.mapRowToBid);
    } catch (error) {
      console.error('Failed to get negotiation bids:', error);
      return [];
    }
  }

  static async getLatestBid(negotiationId: number): Promise<Bid | null> {
    try {
      const pool = getPool();
      const result = await pool.query(
        'SELECT * FROM bids WHERE negotiation_id = $1 ORDER BY created_at DESC LIMIT 1',
        [negotiationId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToBid(result.rows[0]);
    } catch (error) {
      console.error('Failed to get latest bid:', error);
      return null;
    }
  }

  static async getUserNegotiations(
    userId: string,
    userType: 'vendor' | 'customer'
  ): Promise<Negotiation[]> {
    try {
      const pool = getPool();
      const column = userType === 'vendor' ? 'vendor_id' : 'customer_id';
      
      const result = await pool.query(
        `SELECT * FROM negotiations WHERE ${column} = $1 ORDER BY updated_at DESC`,
        [userId]
      );

      return result.rows.map(this.mapRowToNegotiation);
    } catch (error) {
      console.error('Failed to get user negotiations:', error);
      return [];
    }
  }

  static async expireOldNegotiations(): Promise<void> {
    try {
      const pool = getPool();
      const cutoffTime = new Date(Date.now() - this.NEGOTIATION_TTL);

      const result = await pool.query(`
        UPDATE negotiations 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE status IN ($2, $3) AND created_at < $4
        RETURNING id
      `, [
        NegotiationStatus.EXPIRED,
        NegotiationStatus.OPEN,
        NegotiationStatus.COUNTERED,
        cutoffTime
      ]);

      if (result.rowCount && result.rowCount > 0) {
        console.log(`✅ Expired ${result.rowCount} old negotiations`);
      }
    } catch (error) {
      console.error('Failed to expire old negotiations:', error);
    }
  }

  // State machine validation
  static isValidTransition(
    currentStatus: NegotiationStatus,
    newStatus: NegotiationStatus
  ): boolean {
    const validTransitions: { [key in NegotiationStatus]: NegotiationStatus[] } = {
      [NegotiationStatus.OPEN]: [
        NegotiationStatus.COUNTERED,
        NegotiationStatus.ACCEPTED,
        NegotiationStatus.REJECTED,
        NegotiationStatus.EXPIRED
      ],
      [NegotiationStatus.COUNTERED]: [
        NegotiationStatus.COUNTERED,
        NegotiationStatus.ACCEPTED,
        NegotiationStatus.REJECTED,
        NegotiationStatus.EXPIRED
      ],
      [NegotiationStatus.ACCEPTED]: [
        NegotiationStatus.LOCKED,
        NegotiationStatus.COMPLETED
      ],
      [NegotiationStatus.LOCKED]: [
        NegotiationStatus.COMPLETED,
        NegotiationStatus.EXPIRED
      ],
      [NegotiationStatus.COMPLETED]: [],
      [NegotiationStatus.EXPIRED]: [],
      [NegotiationStatus.REJECTED]: []
    };

    return validTransitions[currentStatus].includes(newStatus);
  }

  private static mapRowToNegotiation(row: any): Negotiation {
    return {
      id: row.id,
      vendorId: row.vendor_id,
      customerId: row.customer_id,
      productId: row.product_id,
      status: row.status as NegotiationStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapRowToBid(row: any): Bid {
    return {
      id: row.id,
      negotiationId: row.negotiation_id,
      bidderType: row.bidder_type,
      bidderId: row.bidder_id,
      amount: parseFloat(row.amount),
      message: row.message,
      language: row.language,
      audioUrl: row.audio_url,
      createdAt: row.created_at,
    };
  }
}