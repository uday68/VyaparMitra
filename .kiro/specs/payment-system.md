# Payment System Feature Specification

## 🎯 Overview

The Payment System provides secure, reliable payment processing for VyaparMitra's negotiation-based commerce platform, integrating with Razorpay for comprehensive payment gateway services including UPI, cards, net banking, and wallet payments.

## 💳 Payment Gateway Integration

### Razorpay Integration
**Location**: `src/services/payment_service.ts`

#### Core Features
- **Order Creation**: Secure payment order generation
- **Payment Processing**: Real-time payment execution
- **Webhook Handling**: Automated payment status updates
- **Refund Management**: Automated and manual refund processing
- **Transaction Verification**: Cryptographic signature validation

#### Payment Flow Architecture
```
Customer → Order Creation → Payment Gateway → Payment Execution → Webhook → Order Fulfillment
    ↓           ↓                ↓               ↓                ↓           ↓
 Negotiation → Razorpay API → Payment UI → Transaction → Verification → Database Update
```

### Supported Payment Methods
1. **UPI (Unified Payments Interface)**
   - QR code generation for instant payments
   - UPI ID-based payments
   - Real-time payment confirmation
   - Support for all major UPI apps

2. **Credit/Debit Cards**
   - Visa, Mastercard, RuPay support
   - Secure card tokenization
   - EMI options for high-value transactions
   - International card support

3. **Net Banking**
   - 50+ supported banks
   - Direct bank integration
   - Secure bank redirects
   - Real-time payment status

4. **Digital Wallets**
   - Paytm, PhonePe, Google Pay
   - Wallet balance payments
   - Instant payment confirmation
   - Cashback and offers integration

## 🔐 Security Implementation

### Payment Security Layers
**Location**: `src/middleware/auth.ts`, `src/middleware/validation.ts`

#### 1. Authentication & Authorization
```typescript
interface PaymentRequest {
  userId: string;
  orderId: string;
  amount: number;
  currency: 'INR';
  negotiationId: string;
}

// JWT-based user authentication
const authenticatePayment = async (req: AuthenticatedRequest) => {
  const user = await validateJWT(req.headers.authorization);
  const order = await validateOrderOwnership(user.id, req.body.orderId);
  return { user, order };
};
```

#### 2. Input Validation
```typescript
const paymentSchema = z.object({
  amount: z.number().positive().max(1000000), // Max ₹10,00,000
  currency: z.literal('INR'),
  orderId: z.string().uuid(),
  negotiationId: z.string().uuid(),
  paymentMethod: z.enum(['upi', 'card', 'netbanking', 'wallet'])
});
```

#### 3. Signature Verification
```typescript
const verifyWebhookSignature = (payload: string, signature: string): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', config.payment.razorpay.webhookSecret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
```

### Rate Limiting
**Location**: `src/middleware/rateLimiter.ts`

#### Payment-Specific Rate Limits
- **Payment Creation**: 5 attempts per 5 minutes per user
- **Webhook Processing**: 100 requests per minute per IP
- **Refund Requests**: 3 attempts per hour per user
- **Payment Status Check**: 20 requests per minute per user

## 🗄️ Database Schema

### Payment Tables
**Location**: `src/db/migrations/001_initial_schema.sql`

#### Core Tables
1. **payments**
   ```sql
   CREATE TABLE payments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES users(id),
     order_id UUID NOT NULL REFERENCES orders(id),
     negotiation_id UUID NOT NULL REFERENCES negotiations(id),
     razorpay_order_id VARCHAR(255) NOT NULL,
     razorpay_payment_id VARCHAR(255),
     amount INTEGER NOT NULL, -- Amount in paise
     currency VARCHAR(3) DEFAULT 'INR',
     status payment_status DEFAULT 'created',
     payment_method VARCHAR(50),
     gateway_response JSONB,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **refunds**
   ```sql
   CREATE TABLE refunds (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     payment_id UUID NOT NULL REFERENCES payments(id),
     razorpay_refund_id VARCHAR(255) NOT NULL,
     amount INTEGER NOT NULL,
     reason VARCHAR(255),
     status refund_status DEFAULT 'pending',
     processed_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

#### Payment Status Enum
```sql
CREATE TYPE payment_status AS ENUM (
  'created',      -- Order created, payment pending
  'authorized',   -- Payment authorized but not captured
  'captured',     -- Payment successfully captured
  'failed',       -- Payment failed
  'cancelled',    -- Payment cancelled by user
  'refunded'      -- Payment refunded
);
```

## 🔄 Payment Workflows

### 1. Order Creation Workflow
```typescript
export class PaymentService {
  async createPaymentOrder(request: PaymentRequest): Promise<PaymentResponse> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Validate negotiation and amount
      const negotiation = await this.validateNegotiation(request.negotiationId, client);
      
      // 2. Create Razorpay order
      const razorpayOrder = await this.razorpay.orders.create({
        amount: request.amount, // Amount in paise
        currency: 'INR',
        receipt: `order_${request.orderId}`,
        notes: {
          negotiationId: request.negotiationId,
          userId: request.userId
        }
      });
      
      // 3. Store payment record
      await client.query(`
        INSERT INTO payments (user_id, order_id, negotiation_id, razorpay_order_id, amount, currency, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [request.userId, request.orderId, request.negotiationId, razorpayOrder.id, request.amount, 'INR', 'created']);
      
      await client.query('COMMIT');
      
      return {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        status: 'created'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

### 2. Webhook Processing Workflow
```typescript
export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    // 1. Verify webhook signature
    const signature = req.get('X-Razorpay-Signature');
    const isValid = verifyWebhookSignature(JSON.stringify(req.body), signature);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // 2. Process webhook event
    const { event, payload } = req.body;
    
    switch (event) {
      case 'payment.captured':
        await processPaymentCaptured(payload.payment.entity);
        break;
      case 'payment.failed':
        await processPaymentFailed(payload.payment.entity);
        break;
      case 'refund.processed':
        await processRefundCompleted(payload.refund.entity);
        break;
    }
    
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error('Webhook processing failed', { error, body: req.body });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
```

### 3. Refund Processing Workflow
```typescript
export const processRefund = async (paymentId: string, amount?: number, reason?: string) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Get payment details
    const payment = await getPaymentById(paymentId, client);
    
    // 2. Create refund with Razorpay
    const refundAmount = amount || payment.amount;
    const razorpayRefund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      amount: refundAmount,
      notes: { reason: reason || 'Customer request' }
    });
    
    // 3. Store refund record
    await client.query(`
      INSERT INTO refunds (payment_id, razorpay_refund_id, amount, reason, status)
      VALUES ($1, $2, $3, $4, $5)
    `, [paymentId, razorpayRefund.id, refundAmount, reason, 'pending']);
    
    // 4. Update payment status if full refund
    if (refundAmount === payment.amount) {
      await client.query(`
        UPDATE payments SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [paymentId]);
    }
    
    await client.query('COMMIT');
    
    return razorpayRefund;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```

## 🌐 API Endpoints

### Payment Routes
**Location**: `src/routes/payment.ts`

#### Core Endpoints
1. **POST /api/payment/create-order**
   - Creates payment order for negotiation
   - Requires authentication
   - Rate limited: 5 requests per 5 minutes

2. **POST /api/payment/verify**
   - Verifies payment completion
   - Validates payment signature
   - Updates order status

3. **POST /api/payment/webhook**
   - Processes Razorpay webhooks
   - Signature verification required
   - Idempotent processing

4. **POST /api/payment/refund**
   - Initiates payment refund
   - Vendor/admin authorization required
   - Audit logging enabled

5. **GET /api/payment/status/:orderId**
   - Retrieves payment status
   - User authorization required
   - Real-time status updates

### API Response Formats
```typescript
interface PaymentResponse {
  success: boolean;
  data?: {
    orderId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paymentUrl?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## 📊 Business Logic Integration

### Negotiation-Payment Integration
**Location**: `src/services/negotiation_service.ts`

#### Payment Triggers
1. **Bid Acceptance**: Automatic payment order creation
2. **Negotiation Completion**: Payment processing initiation
3. **Order Confirmation**: Payment capture and fulfillment
4. **Cancellation**: Automatic refund processing

#### Business Rules
- **Payment Timeout**: 15 minutes for payment completion
- **Price Lock**: Final negotiated price locked during payment
- **Stock Reservation**: Inventory held during payment process
- **Automatic Cancellation**: Failed payments cancel negotiation

### Inventory Integration
**Location**: `src/services/inventory_service.ts`

#### Stock Management
- **Payment Initiated**: Stock reserved for 15 minutes
- **Payment Completed**: Stock permanently allocated
- **Payment Failed**: Stock reservation released
- **Refund Processed**: Stock returned to inventory

## 🔍 Monitoring & Analytics

### Payment Metrics
**Location**: `src/utils/logger.ts`

#### Key Performance Indicators
- **Payment Success Rate**: Target >95%
- **Average Processing Time**: Target <30 seconds
- **Refund Rate**: Monitor <5%
- **Webhook Processing**: Target <2 seconds
- **Gateway Uptime**: Monitor >99.9%

#### Business Metrics
- **Revenue Tracking**: Daily/monthly transaction volumes
- **Payment Method Distribution**: UPI vs Cards vs Net Banking
- **Failed Payment Analysis**: Reasons and patterns
- **Refund Analysis**: Reasons and vendor patterns

### Logging Strategy
```typescript
// Payment event logging
logger.info('Payment order created', {
  event: 'payment_order_created',
  userId: user.id,
  orderId: order.id,
  amount: order.amount,
  currency: order.currency,
  negotiationId: negotiation.id,
  paymentMethod: request.paymentMethod
});

// Payment completion logging
logger.info('Payment completed successfully', {
  event: 'payment_completed',
  paymentId: payment.id,
  razorpayPaymentId: payment.razorpay_payment_id,
  amount: payment.amount,
  processingTime: Date.now() - payment.created_at,
  paymentMethod: payment.payment_method
});
```

## 🧪 Testing Strategy

### Payment Testing Scenarios
**Location**: `src/__tests__/payment.test.ts`

#### Unit Tests
1. **Payment Order Creation**: Valid and invalid scenarios
2. **Signature Verification**: Webhook signature validation
3. **Refund Processing**: Full and partial refunds
4. **Error Handling**: Gateway failures and network issues

#### Integration Tests
1. **End-to-End Payment Flow**: Complete payment journey
2. **Webhook Processing**: Real webhook event handling
3. **Database Transactions**: ACID compliance testing
4. **Rate Limiting**: Payment rate limit enforcement

#### Test Data Management
```typescript
const createTestPayment = () => ({
  userId: 'test-user-id',
  orderId: 'test-order-id',
  negotiationId: 'test-negotiation-id',
  amount: 10000, // ₹100 in paise
  currency: 'INR',
  paymentMethod: 'upi'
});

const mockRazorpayResponse = {
  id: 'order_test123',
  amount: 10000,
  currency: 'INR',
  status: 'created'
};
```

## 🚀 Performance Optimization

### Caching Strategy
- **Payment Status**: Redis cache for frequent status checks
- **User Payment Methods**: Cache preferred payment methods
- **Gateway Responses**: Cache successful payment confirmations
- **Refund Status**: Cache refund processing status

### Database Optimization
- **Indexed Queries**: Optimized payment lookup queries
- **Connection Pooling**: Efficient database connection management
- **Transaction Batching**: Bulk payment processing for efficiency
- **Read Replicas**: Separate read/write database instances

## 🔒 Compliance & Security

### PCI DSS Compliance
- **No Card Storage**: All card data handled by Razorpay
- **Secure Transmission**: HTTPS for all payment communications
- **Access Controls**: Role-based payment system access
- **Audit Logging**: Complete payment activity tracking

### Data Protection
- **Encryption**: Payment data encrypted at rest and in transit
- **Data Retention**: Payment logs retained for 7 years
- **User Privacy**: Minimal payment data collection
- **GDPR Compliance**: User data deletion and export capabilities

This specification ensures the Payment System provides secure, reliable, and scalable payment processing for the VyaparMitra platform while maintaining compliance with financial regulations and security standards.