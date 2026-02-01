const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'vyapar_mitra',
    user: 'postgres',
    password: '1234',
    ssl: false
  });

  try {
    console.log('🔄 Running QR Commerce migration...');
    
    const migrationPath = path.join(__dirname, '../src/db/migrations/002_qr_commerce_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log('✅ QR Commerce migration completed successfully');
    
    // Also run the main table creation
    console.log('🔄 Creating main tables...');
    
    const mainTablesSQL = `
      -- Users table (referenced by other tables)
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

      -- Products table (referenced by negotiations)
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

      -- Orders table (referenced by negotiations)
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        negotiation_id INTEGER,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        payment_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await pool.query(mainTablesSQL);
    console.log('✅ Main tables created successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();