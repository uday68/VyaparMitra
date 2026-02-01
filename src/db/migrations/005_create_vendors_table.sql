-- Create vendors table
-- Migration 005

CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    gst_number VARCHAR(20),
    business_address TEXT,
    business_hours JSONB,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB DEFAULT '[]'::jsonb,
    bank_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON vendors(is_verified);
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON vendors(rating);

-- Insert sample vendor data for existing users
INSERT INTO vendors (user_id, business_name, business_type, is_verified)
SELECT 
    u.id,
    u.name || '''s Business',
    'General Store',
    true
FROM users u 
WHERE u.user_type = 'vendor'
AND NOT EXISTS (SELECT 1 FROM vendors v WHERE v.user_id = u.id);

COMMIT;