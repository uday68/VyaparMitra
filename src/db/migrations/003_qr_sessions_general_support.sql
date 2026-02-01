-- Add support for general conversation QR codes
-- Migration 003: QR Sessions General Support

-- Add session_type column to distinguish between product and general conversations
ALTER TABLE qr_sessions 
ADD COLUMN IF NOT EXISTS session_type VARCHAR(20) NOT NULL DEFAULT 'PRODUCT' 
CHECK (session_type IN ('PRODUCT', 'GENERAL'));

-- Make product_id nullable to support general conversations
ALTER TABLE qr_sessions 
ALTER COLUMN product_id DROP NOT NULL;

-- Add constraint to ensure product_id is required for PRODUCT sessions
ALTER TABLE qr_sessions 
ADD CONSTRAINT qr_sessions_product_id_check 
CHECK (
    (session_type = 'PRODUCT' AND product_id IS NOT NULL) OR 
    (session_type = 'GENERAL' AND product_id IS NULL)
);

-- Add customer_id column to track which customer joined the session
ALTER TABLE qr_sessions 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Update indexes for new columns
CREATE INDEX IF NOT EXISTS idx_qr_sessions_session_type ON qr_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_customer_id ON qr_sessions(customer_id);

-- Update the negotiation_messages table to reference qr_sessions properly
ALTER TABLE negotiation_messages 
ADD CONSTRAINT fk_negotiation_messages_session_id 
FOREIGN KEY (session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON COLUMN qr_sessions.session_type IS 'Type of QR session: PRODUCT for specific product negotiations, GENERAL for open conversations';
COMMENT ON COLUMN qr_sessions.product_id IS 'Product ID for PRODUCT sessions, NULL for GENERAL sessions';
COMMENT ON COLUMN qr_sessions.customer_id IS 'Customer who joined the session, set when customer scans QR code';