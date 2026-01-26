import { Pool } from 'pg';
import { config } from '../config/settings';

let pool: Pool;

export async function connectPostgreSQL(): Promise<void> {
  try {
    // First, connect to the default 'postgres' database to create our database if needed
    const defaultPool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'postgres', // Connect to default database first
      user: 'postgres',
      password: '1234',
      ssl: false
    });

    // Check if our database exists, create if not
    try {
      const dbCheckResult = await defaultPool.query(
        "SELECT 1 FROM pg_database WHERE datname = 'vyapar_mitra_dev'"
      );
      
      if (dbCheckResult.rows.length === 0) {
        console.log('Creating database vyapar_mitra_dev...');
        await defaultPool.query('CREATE DATABASE vyapar_mitra_dev');
        console.log('✅ Database vyapar_mitra_dev created successfully');
      }
    } catch (createError) {
      console.warn('Database creation check failed:', createError);
    } finally {
      await defaultPool.end();
    }

    // Now connect to our application database
    pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'vyapar_mitra_dev',
      user: 'postgres',
      password: '1234',
      ssl: false
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