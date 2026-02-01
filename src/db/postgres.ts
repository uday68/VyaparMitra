import { Pool } from 'pg';

let pool: Pool;

export async function connectPostgreSQL(): Promise<void> {
  try {
    // Connect to default database first
    const defaultPool = new Pool({
      host: 'localhost',
      port: 5433,
      database: 'postgres',
      user: 'postgres',
      password: '1234',
      ssl: false
    });

    // Create database if it does not exist
    try {
      const result = await defaultPool.query(
        "SELECT 1 FROM pg_database WHERE datname = 'vyapar_mitra'"
      );

      if (result.rows.length === 0) {
        console.log('Creating database vyapar_mitra...');
        await defaultPool.query('CREATE DATABASE vyapar_mitra');
        console.log('✅ Database vyapar_mitra created');
      }
      
      // Also check for vyapar_mitra_dev database
      const devResult = await defaultPool.query(
        "SELECT 1 FROM pg_database WHERE datname = 'vyapar_mitra_dev'"
      );

      if (devResult.rows.length === 0) {
        console.log('Creating database vyapar_mitra_dev...');
        await defaultPool.query('CREATE DATABASE vyapar_mitra_dev');
        console.log('✅ Database vyapar_mitra_dev created');
      }
    } finally {
      await defaultPool.end();
    }

    // Connect to application database
    pool = new Pool({
      host: 'localhost',
      port: 5433,
      database: 'vyapar_mitra',
      user: 'postgres',
      password: '1234',
      ssl: false
    });

    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');

    await createTables();
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
}

async function createTables(): Promise<void> {
  const queries = [
    // Users table (referenced by other tables)
    `CREATE TABLE IF NOT EXISTS users (
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
    );`,

    // Products table (referenced by negotiations)
    `CREATE TABLE IF NOT EXISTS products (
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
    );`,

    // Orders table (referenced by negotiations)
    `CREATE TABLE IF NOT EXISTS orders (
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
    );`,

    `CREATE TABLE IF NOT EXISTS negotiations (
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
    );`,

    `CREATE TABLE IF NOT EXISTS bids (
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
    );`,

    `CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      negotiation_id INTEGER REFERENCES negotiations(id) ON DELETE CASCADE,
      vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      final_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS stock_locks (
      id SERIAL PRIMARY KEY,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE UNIQUE,
      locked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS social_posts (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      negotiation_id INTEGER REFERENCES negotiations(id) ON DELETE SET NULL,
      images TEXT,
      language VARCHAR(10) DEFAULT 'en',
      location VARCHAR(255),
      tags TEXT,
      is_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS social_post_likes (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER REFERENCES social_posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (user_id, post_id)
    );`,

    `CREATE TABLE IF NOT EXISTS social_post_comments (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER REFERENCES social_posts(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      language VARCHAR(10) DEFAULT 'en',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS user_follows (
      id SERIAL PRIMARY KEY,
      follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (follower_id, following_id)
    );`,

    `CREATE TABLE IF NOT EXISTS community_challenges (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      start_date TIMESTAMP WITH TIME ZONE NOT NULL,
      end_date TIMESTAMP WITH TIME ZONE NOT NULL,
      prizes TEXT,
      rules TEXT,
      hashtags TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      movement_type VARCHAR(20) NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 🔥 FIXED TABLE
    `CREATE TABLE IF NOT EXISTS recommendation_interactions (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      action VARCHAR(20) NOT NULL,
      interaction_count INTEGER DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      interaction_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED,
      UNIQUE (user_id, product_id, action, interaction_date)
    );`,

    `CREATE TABLE IF NOT EXISTS user_product_views (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`
  ];

  try {
    for (const q of queries) {
      await pool.query(q);
    }
    console.log('✅ PostgreSQL tables created/verified');
  } catch (error) {
    console.error('❌ Failed to create tables:', error);
    throw error;
  }
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('PostgreSQL not connected');
  }
  return pool;
}

export { pool };
