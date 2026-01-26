import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getPool } from '../db/postgres';
import { logger } from '../utils/logger';
import { config } from '../config/settings';

export interface PaymentRequest {
  orderId: string;
  amount: number; // in paise (INR * 100)
  currency?: string;
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  paymentId?: string;
  signature?: string;
  receipt?: string;
  createdAt: Date;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // partial refund amount in paise
  reason?: string;
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  status: 'pending' | 'processed' | 'failed';
  reason?: string;
  createdAt: Date;
}

export class PaymentService {
  private razorpay: Razorpay;
  private pool = getPool();

  constructor() {
    if (!config.payment.razorpay.keyId || !config.payment.razorpay.keySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    this.razorpay = new Razorpay({
      key_id: config.payment.razorpay.keyId,
      key_secret: config.payment.razorpay.keySecret,
    });
  }

  /**
   * Create a new payment order
   */
  async createPaymentOrder(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate order exists and amount matches
      const orderResult = await this.pool.query(
        'SELECT id, total_amount, status FROM orders WHERE id = $1',
        [request.orderId]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];
      const expectedAmount = Math.round(order.total_amount * 100); // Convert to paise

      if (request.amount !== expectedAmount) {
        throw new Error('Payment amount does not match order total');
      }

      if (order.status !== 'PENDING') {
        throw new Error('Order is not in pending status');
      }

      // Create Razorpay order
      const razorpayOrder = await this.razorpay.orders.create({
        amount: request.amount,
        currency: request.currency || 'INR',
        receipt: `order_${request.orderId}`,
        notes: {
          orderId: request.orderId,
          description: request.description || 'VyaparMitra Order Payment',
        },
      });

      // Store payment record
      const paymentResult = await this.pool.query(`
        INSERT INTO payments (
          order_id, payment_gateway, gateway_payment_id, amount, currency, 
          status, payment_method, gateway_response
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at
      `, [
        request.orderId,
        'razorpay',
        razorpayOrder.id,
        request.amount,
        request.currency || 'INR',
        'PENDING',
        'online',
        JSON.stringify(razorpayOrder)
      ]);

      const payment = paymentResult.rows[0];

      logger.info('Payment order created', {
        paymentId: payment.id,
        orderId: request.orderId,
        amount: request.amount,
        razorpayOrderId: razorpayOrder.id
      });

      return {
        id: payment.id,
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency || 'INR',
        status: 'created',
        receipt: razorpayOrder.receipt,
        createdAt: payment.created_at,
      };

    } catch (error) {
      logger.error('Failed to create payment order:', error);
      throw error;
    }
  }

  /**
   * Verify payment signature from Razorpay webhook
   */
  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    try {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', config.payment.razorpay.keySecret)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === razorpaySignature;
    } catch (error) {
      logger.error('Payment signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process successful payment
   */
  async processSuccessfulPayment(
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Verify signature
      if (!this.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
        throw new Error('Invalid payment signature');
      }

      // Get payment record
      const paymentResult = await client.query(
        'SELECT id, order_id, amount FROM payments WHERE gateway_payment_id = $1',
        [razorpayOrderId]
      );

      if (paymentResult.rows.length === 0) {
        throw new Error('Payment record not found');
      }

      const payment = paymentResult.rows[0];

      // Update payment status
      await client.query(`
        UPDATE payments 
        SET status = 'COMPLETED', payment_method = 'razorpay', 
            gateway_response = gateway_response || $1, completed_at = NOW()
        WHERE id = $2
      `, [
        JSON.stringify({
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          verified_at: new Date().toISOString()
        }),
        payment.id
      ]);

      // Update order status
      await client.query(`
        UPDATE orders 
        SET payment_status = 'COMPLETED', status = 'CONFIRMED', 
            payment_id = $1, updated_at = NOW()
        WHERE id = $2
      `, [razorpayPaymentId, payment.order_id]);

      // Release stock locks (if any)
      await client.query(
        'DELETE FROM stock_locks WHERE user_id IN (SELECT customer_id FROM orders WHERE id = $1)',
        [payment.order_id]
      );

      await client.query('COMMIT');

      logger.info('Payment processed successfully', {
        paymentId: payment.id,
        orderId: payment.order_id,
        razorpayPaymentId,
        amount: payment.amount
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to process successful payment:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process failed payment
   */
  async processFailedPayment(
    razorpayOrderId: string,
    failureReason: string
  ): Promise<void> {
    try {
      // Update payment status
      await this.pool.query(`
        UPDATE payments 
        SET status = 'FAILED', failure_reason = $1, updated_at = NOW()
        WHERE gateway_payment_id = $2
      `, [failureReason, razorpayOrderId]);

      // Update order status
      await this.pool.query(`
        UPDATE orders 
        SET payment_status = 'FAILED', updated_at = NOW()
        WHERE id = (SELECT order_id FROM payments WHERE gateway_payment_id = $1)
      `, [razorpayOrderId]);

      logger.info('Payment failure processed', {
        razorpayOrderId,
        failureReason
      });

    } catch (error) {
      logger.error('Failed to process payment failure:', error);
      throw error;
    }
  }

  /**
   * Initiate refund
   */
  async initiateRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      // Get payment details
      const paymentResult = await this.pool.query(
        'SELECT id, order_id, amount, status FROM payments WHERE gateway_payment_id = $1',
        [request.paymentId]
      );

      if (paymentResult.rows.length === 0) {
        throw new Error('Payment not found');
      }

      const payment = paymentResult.rows[0];

      if (payment.status !== 'COMPLETED') {
        throw new Error('Payment is not in completed status');
      }

      const refundAmount = request.amount || payment.amount;

      if (refundAmount > payment.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
      }

      // Create refund with Razorpay
      const razorpayRefund = await this.razorpay.payments.refund(request.paymentId, {
        amount: refundAmount,
        notes: {
          reason: request.reason || 'Customer requested refund',
          orderId: payment.order_id,
        },
      });

      // Update payment record
      await this.pool.query(`
        UPDATE payments 
        SET refund_amount = refund_amount + $1, refund_reason = $2, 
            gateway_response = gateway_response || $3, updated_at = NOW()
        WHERE id = $4
      `, [
        refundAmount,
        request.reason,
        JSON.stringify({ refund: razorpayRefund }),
        payment.id
      ]);

      // Update order status if full refund
      if (refundAmount === payment.amount) {
        await this.pool.query(
          'UPDATE orders SET status = $1, payment_status = $2 WHERE id = $3',
          ['REFUNDED', 'REFUNDED', payment.order_id]
        );
      }

      logger.info('Refund initiated', {
        paymentId: payment.id,
        orderId: payment.order_id,
        refundAmount,
        razorpayRefundId: razorpayRefund.id
      });

      return {
        id: razorpayRefund.id,
        paymentId: request.paymentId,
        amount: refundAmount,
        status: 'pending',
        reason: request.reason,
        createdAt: new Date(),
      };

    } catch (error) {
      logger.error('Failed to initiate refund:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(orderId: string): Promise<PaymentResponse | null> {
    try {
      const result = await this.pool.query(`
        SELECT id, order_id, amount, currency, status, payment_method, 
               gateway_payment_id, created_at, completed_at
        FROM payments 
        WHERE order_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [orderId]);

      if (result.rows.length === 0) {
        return null;
      }

      const payment = result.rows[0];

      return {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status.toLowerCase(),
        paymentId: payment.gateway_payment_id,
        createdAt: payment.created_at,
      };

    } catch (error) {
      logger.error('Failed to get payment status:', error);
      throw error;
    }
  }

  /**
   * Handle Razorpay webhook
   */
  async handleWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', config.payment.razorpay.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      const { event, payload: eventPayload } = payload;

      switch (event) {
        case 'payment.captured':
          await this.processSuccessfulPayment(
            eventPayload.payment.entity.id,
            eventPayload.payment.entity.order_id,
            '' // Signature not available in webhook
          );
          break;

        case 'payment.failed':
          await this.processFailedPayment(
            eventPayload.payment.entity.order_id,
            eventPayload.payment.entity.error_description || 'Payment failed'
          );
          break;

        case 'refund.processed':
          // Handle refund processed
          logger.info('Refund processed', {
            refundId: eventPayload.refund.entity.id,
            paymentId: eventPayload.refund.entity.payment_id,
            amount: eventPayload.refund.entity.amount
          });
          break;

        default:
          logger.info('Unhandled webhook event', { event });
      }

    } catch (error) {
      logger.error('Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Generate payment link for UPI/QR code
   */
  async generatePaymentLink(orderId: string): Promise<string> {
    try {
      const orderResult = await this.pool.query(
        'SELECT total_amount FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const amount = Math.round(orderResult.rows[0].total_amount * 100);

      const paymentLink = await this.razorpay.paymentLink.create({
        amount,
        currency: 'INR',
        description: 'VyaparMitra Order Payment',
        reference_id: orderId,
        expire_by: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
        notify: {
          sms: true,
          email: true,
        },
        callback_url: `${config.app.baseUrl}/payment/callback`,
        callback_method: 'get',
      });

      logger.info('Payment link generated', {
        orderId,
        paymentLinkId: paymentLink.id,
        shortUrl: paymentLink.short_url
      });

      return paymentLink.short_url;

    } catch (error) {
      logger.error('Failed to generate payment link:', error);
      throw error;
    }
  }
}

// Export singleton instance with lazy initialization
let paymentServiceInstance: PaymentService | null = null;

export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService();
  }
  return paymentServiceInstance;
}