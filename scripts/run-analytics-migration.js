const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runAnalyticsMigration() {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'vyapar_mitra',
    user: 'postgres',
    password: '1234',
  });

  try {
    console.log('🔄 Running analytics migration...');
    
    const migrationPath = path.join(__dirname, '..', 'src', 'db', 'migrations', '004_add_missing_analytics_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('✅ Analytics migration completed successfully');
  } catch (error) {
    console.error('❌ Analytics migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAnalyticsMigration();