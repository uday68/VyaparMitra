-- Cross-Language QR Commerce Database Schema Migration

-- QR Sessions table (PostgreSQL for ACID transactions)
CREATE TABLE IF NOT EXISTS qr_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    vendor_language VARCHAR(5) NOT NULL,
    customer_language VARCHAR(5),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'JOINED', 'COMPLETED', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    qr_code_url TEXT NOT NULL,
    CONSTRAINT valid_languages CHECK (
        vendor_language IN ('en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as') AND
        (customer_language IS NULL OR customer_language IN ('en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as'))
    )
);

-- Translation cache table (PostgreSQL for consistency)
CREATE TABLE IF NOT EXISTS translation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    from_language VARCHAR(5) NOT NULL,
    to_language VARCHAR(5) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_text, from_language, to_language),
    CONSTRAINT valid_cache_languages CHECK (
        from_language IN ('en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as') AND
        to_language IN ('en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as')
    )
);

-- Negotiation Messages table for real-time chat
CREATE TABLE IF NOT EXISTS negotiation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('VENDOR', 'CUSTOMER')),
    content TEXT NOT NULL,
    original_content TEXT NOT NULL,
    language VARCHAR(5) NOT NULL,
    target_language VARCHAR(5) NOT NULL,
    type VARCHAR(10) NOT NULL DEFAULT 'TEXT' CHECK (type IN ('TEXT', 'VOICE')),
    translation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (translation_status IN ('PENDING', 'COMPLETED', 'FAILED', 'NOT_REQUIRED')),
    audio_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_message_languages CHECK (
        language IN ('en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as') AND
        target_language IN ('en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as')
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_sessions_vendor_id ON qr_sessions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_session_token ON qr_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_status ON qr_sessions(status);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_expires_at ON qr_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup ON translation_cache(source_text, from_language, to_language);
CREATE INDEX IF NOT EXISTS idx_translation_cache_usage ON translation_cache(usage_count DESC, last_used_at DESC);

-- Function to automatically expire sessions
CREATE OR REPLACE FUNCTION expire_old_qr_sessions()
RETURNS void AS $$
BEGIN
    UPDATE qr_sessions 
    SET status = 'EXPIRED', last_activity_at = NOW()
    WHERE expires_at < NOW() AND status IN ('ACTIVE', 'JOINED');
END;
$$ LANGUAGE plpgsql;

-- Schedule function to run every hour (requires pg_cron extension in production)
-- SELECT cron.schedule('expire-qr-sessions', '0 * * * *', 'SELECT expire_old_qr_sessions();');