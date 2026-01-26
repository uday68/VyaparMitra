import express from 'express';
import { z } from 'zod';
import { getPaymentService } from '../services/payment_service';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { rateLimiters } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const createPaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().optional().default('INR'),
  description: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerName: z.string().optional(),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
});

const refundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
});

// Create payment order
router.post('/create',
  authenticateToken,
  rateLimiters.payment,
  validateRequest(createPaymentSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const paymentRequest = req.body;
      
      // Verify user owns the order
      const pool = require('../db/postgres').getPool();
      const orderResult = await pool.query(
        'SELECT customer_id FROM orders WHERE id = $1',
        [paymentRequest.orderId]
      );
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      if (orderResult.rows[0].customer_id !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to access this order'
        });
      }
      
      const payment = await getPaymentService().createPaymentOrder(paymentRequest);
      
      res.json({
        success: true,
        data: payment
      });
      
    } catch (error) {
      logger.error('Payment creation failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      });
    }
  }
);

// Verify payment
router.post('/verify',
  authenticateToken,
  rateLimiters.payment,
  validateRequest(verifyPaymentSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      await getPaymentService().processSuccessfulPayment(
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
      );
      
      res.json({
        success: true,
        message: 'Payment verified successfully'
      });
      
    } catch (error) {
      logger.error('Payment verification failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed'
      });
    }
  }
);

// Get payment status
router.get('/status/:orderId',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { orderId } = req.params;
      
      // Verify user owns the order
      const pool = require('../db/postgres').getPool();
      const orderResult = await pool.query(
        'SELECT customer_id FROM orders WHERE id = $1',
        [orderId]
      );
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      if (orderResult.rows[0].customer_id !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to access this order'
        });
      }
      
      const payment = await getPaymentService().getPaymentStatus(orderId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }
      
      res.json({
        success: true,
        data: payment
      });
      
    } catch (error) {
      logger.error('Failed to get payment status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment status'
      });
    }
  }
);

// Generate payment link
router.post('/link/:orderId',
  authenticateToken,
  rateLimiters.payment,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { orderId } = req.params;
      
      // Verify user owns the order
      const pool = require('../db/postgres').getPool();
      const orderResult = await pool.query(
        'SELECT customer_id FROM orders WHERE id = $1',
        [orderId]
      );
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      if (orderResult.rows[0].customer_id !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to access this order'
        });
      }
      
      const paymentLink = await getPaymentService().generatePaymentLink(orderId);
      
      res.json({
        success: true,
        data: {
          paymentLink
        }
      });
      
    } catch (error) {
      logger.error('Failed to generate payment link:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate payment link'
      });
    }
  }
);

// Initiate refund (vendor only)
router.post('/refund',
  authenticateToken,
  rateLimiters.payment,
  validateRequest(refundSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      // Only vendors can initiate refunds
      if (req.user!.type !== 'vendor') {
        return res.status(403).json({
          success: false,
          error: 'Only vendors can initiate refunds'
        });
      }
      
      const refund = await getPaymentService().initiateRefund(req.body);
      
      res.json({
        success: true,
        data: refund
      });
      
    } catch (error) {
      logger.error('Refund initiation failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Refund initiation failed'
      });
    }
  }
);

// Razorpay webhook endpoint
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.get('X-Razorpay-Signature');
      
      if (!signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing signature'
        });
      }
      
      await getPaymentService().handleWebhook(req.body, signature);
      
      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
      
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      res.status(400).json({
        success: false,
        error: 'Webhook processing failed'
      });
    }
  }
);

// Payment callback (for payment links)
router.get('/callback',
  async (req, res) => {
    try {
      const { razorpay_payment_id, razorpay_payment_link_id, razorpay_payment_link_reference_id, razorpay_payment_link_status, razorpay_signature } = req.query;
      
      if (razorpay_payment_link_status === 'paid') {
        // Redirect to success page
        res.redirect(`${process.env.FRONTEND_URL}/payment/success?payment_id=${razorpay_payment_id}&order_id=${razorpay_payment_link_reference_id}`);
      } else {
        // Redirect to failure page
        res.redirect(`${process.env.FRONTEND_URL}/payment/failed?order_id=${razorpay_payment_link_reference_id}`);
      }
      
    } catch (error) {
      logger.error('Payment callback failed:', error);
      res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
    }
  }
);

export default router;