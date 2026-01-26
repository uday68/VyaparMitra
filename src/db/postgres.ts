import { Pool } from 'pg';
import { config } from '../config/settings';

let pool: Pool;

export async function connectPostgreSQL(): Promise<void> {
  try {
    pool = new Pool({
      connectionString: config.database.postgresql.uri,
    });
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected successfully');
    
    // Create tables if they don't exist
    await createTables();
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
}

async function createTables(): Promise<void> {
  const createNegotiationsTable = `
    CREATE TABLE IF NOT EXISTS negotiations (
      id SERIAL PRIMARY KEY,
      vendor_id VARCHAR(24) NOT NULL,
      customer_id VARCHAR(24) NOT NULL,
      product_id VARCHAR(24) NOT NULL,
      status VARCHAR(20) DEFAULT 'OPEN',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createBidsTable = `
    CREATE TABLE IF NOT EXISTS bids (
      id SERIAL PRIMARY KEY,
      negotiation_id INTEGER REFERENCES negotiations(id),
      bidder_type VARCHAR(10) NOT NULL, -- 'vendor' or 'customer'
      bidder_id VARCHAR(24) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      message TEXT,
      language VARCHAR(10) NOT NULL,
      audio_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createTransactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      negotiation_id INTEGER REFERENCES negotiations(id),
      vendor_id VARCHAR(24) NOT NULL,
      customer_id VARCHAR(24) NOT NULL,
      product_id VARCHAR(24) NOT NULL,
      final_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createStockLocksTable = `
    CREATE TABLE IF NOT EXISTS stock_locks (
      id SERIAL PRIMARY KEY,
      product_id VARCHAR(24) NOT NULL UNIQUE,
      locked_by VARCHAR(24) NOT NULL,
      locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    );
  `;

  try {
    await pool.query(createNegotiationsTable);
    await pool.query(createBidsTable);
    await pool.query(createTransactionsTable);
    await pool.query(createStockLocksTable);
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