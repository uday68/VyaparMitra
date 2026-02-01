const { Pool } = require('pg');
const fs = require('fs');

async function runMigration() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:1234@localhost:5432/vyapar_mitra_dev'
  });

  try {
    console.log('Connecting to PostgreSQL...');
    const client = await pool.connect();
    
    console.log('Reading migration file...');
    const sql = fs.readFileSync('create_basic_tables.sql', 'utf8');
    
    console.log('Running migration...');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    client.release();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();