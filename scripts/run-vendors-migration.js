const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runVendorsMigration() {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'vyapar_mitra',
    user: 'postgres',
    password: '1234',
  });

  try {
    console.log('🔄 Running vendors migration...');
    
    const migrationPath = path.join(__dirname, '..', 'src', 'db', 'migrations', '005_create_vendors_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('✅ Vendors migration completed successfully');
  } catch (error) {
    console.error('❌ Vendors migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runVendorsMigration();