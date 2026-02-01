const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function fixAllErrors() {
  console.log('🔧 Starting comprehensive error fixes...');
  
  // 1. Fix Database Issues
  await fixDatabaseIssues();
  
  // 2. Create sample data for testing
  await createSampleData();
  
  console.log('✅ All errors fixed successfully!');
}

async function fixDatabaseIssues() {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'vyapar_mitra',
    user: 'postgres',
    password: '1234',
    ssl: false
  });

  try {
    console.log('🔄 Creating missing database tables...');
    
    // Create all required tables with proper relationships
    const createTablesSQL = `
      -- Users table (base table)
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'vendor')),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        location_lat DECIMAL(10,8),
        location_lng DECIMAL(11,8),
        language_preference VARCHAR(5) DEFAULT 'hi',
        voice_profile_id VARCHAR(255),
        is_verified BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        cost_price DECIMAL(10,2),
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        reorder_level INTEGER DEFAULT 10,
        lead_time_days INTEGER DEFAULT 7,
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Negotiations table
      CREATE TABLE IF NOT EXISTS negotiations (
        id SERIAL PRIMARY KEY,
        vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        product_category VARCHAR(100),
        language VARCHAR(5) DEFAULT 'hi',
        is_voice_enabled BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'active', 'completed', 'cancelled', 'expired')),
        final_price DECIMAL(10,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        negotiation_id INTEGER REFERENCES negotiations(id) ON DELETE SET NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        payment_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Bids table
      CREATE TABLE IF NOT EXISTS bids (
        id SERIAL PRIMARY KEY,
        negotiation_id INTEGER REFERENCES negotiations(id) ON DELETE CASCADE,
        bidder_type VARCHAR(10) NOT NULL CHECK (bidder_type IN ('customer', 'vendor')),
        bidder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bid_type VARCHAR(20) DEFAULT 'customer_bid' CHECK (bid_type IN ('customer_bid', 'vendor_counter')),
        amount DECIMAL(10,2) NOT NULL,
        message TEXT,
        language VARCHAR(10) NOT NULL,
        audio_url VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_negotiations_vendor_id ON negotiations(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_negotiations_customer_id ON negotiations(customer_id);
      CREATE INDEX IF NOT EXISTS idx_negotiations_product_id ON negotiations(product_id);
      CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status);
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_bids_negotiation_id ON bids(negotiation_id);
    `;
    
    await pool.query(createTablesSQL);
    console.log('✅ Database tables created successfully');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

async function createSampleData() {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'vyapar_mitra',
    user: 'postgres',
    password: '1234',
    ssl: false
  });

  try {
    console.log('🔄 Creating sample data for testing...');
    
    // Check if sample data already exists
    const userCheck = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) > 0) {
      console.log('📊 Sample data already exists, skipping creation');
      return;
    }
    
    const sampleDataSQL = `
      -- Insert sample users
      INSERT INTO users (id, email, password_hash, user_type, name, phone, language_preference, is_verified, is_active) VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'vendor1@example.com', '$2b$12$hash1', 'vendor', 'Sample Vendor 1', '+91-9876543210', 'hi', true, true),
      ('550e8400-e29b-41d4-a716-446655440002', 'customer1@example.com', '$2b$12$hash2', 'customer', 'Sample Customer 1', '+91-9876543211', 'hi', true, true),
      ('550e8400-e29b-41d4-a716-446655440003', 'vendor2@example.com', '$2b$12$hash3', 'vendor', 'Sample Vendor 2', '+91-9876543212', 'en', true, true);

      -- Insert sample products
      INSERT INTO products (id, vendor_id, name, description, category, price, cost_price, stock_quantity, reorder_level, is_active) VALUES
      ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Fresh Apples', 'Premium quality red apples', 'Fruits', 150.00, 100.00, 50, 10, true),
      ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Organic Bananas', 'Fresh organic bananas', 'Fruits', 80.00, 60.00, 30, 5, true),
      ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Rice (1kg)', 'Premium basmati rice', 'Grains', 120.00, 90.00, 100, 20, true);

      -- Insert sample negotiations
      INSERT INTO negotiations (vendor_id, customer_id, user_id, product_id, product_category, status, final_price) VALUES
      ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'Fruits', 'completed', 140.00),
      ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Fruits', 'active', NULL);

      -- Insert sample orders
      INSERT INTO orders (customer_id, vendor_id, negotiation_id, total_amount, status, payment_status) VALUES
      ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 1, 140.00, 'confirmed', 'paid');

      -- Insert sample bids
      INSERT INTO bids (negotiation_id, bidder_type, bidder_id, amount, message, language) VALUES
      (1, 'customer', '550e8400-e29b-41d4-a716-446655440002', 140.00, 'Can you do 140 for the apples?', 'en'),
      (2, 'customer', '550e8400-e29b-41d4-a716-446655440002', 75.00, 'How about 75 for bananas?', 'en');
    `;
    
    await pool.query(sampleDataSQL);
    console.log('✅ Sample data created successfully');
    
  } catch (error) {
    console.error('❌ Sample data creation failed:', error.message);
    // Don't throw here as this is not critical
  } finally {
    await pool.end();
  }
}

fixAllErrors().catch(console.error);