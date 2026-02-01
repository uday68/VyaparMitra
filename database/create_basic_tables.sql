-- Create basic tables for VyaparMitra server compatibility
-- This creates the simple schema that server/storage.ts expects

-- Products table (matching shared/schema.ts exactly)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    image_url TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Negotiations table (matching shared/schema.ts)
CREATE TABLE IF NOT EXISTS negotiations (
    id SERIAL PRIMARY KEY,
    "productId" INTEGER NOT NULL REFERENCES products(id),
    "conversationId" INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    "finalPrice" NUMERIC,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table (for chat integration)
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table (for chat integration)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data (matching the expected schema)
INSERT INTO products (name, description, price, unit, image_url, vendor_name) VALUES
('Fresh Shimla Apples', 'Crisp, sweet and directly sourced from Shimla orchards.', 180, 'kg', '/images/apples.jpg', 'Sanjay''s Fruits'),
('Robusta Bananas', 'Naturally ripened, rich in potassium and energy.', 60, 'dozen', '/images/bananas.jpg', 'Sanjay''s Fruits'),
('Ratnagiri Alphonso', 'The King of Mangoes, premium quality from Ratnagiri.', 800, 'dozen', '/images/mangoes.jpg', 'Sanjay''s Fruits')
ON CONFLICT DO NOTHING;