const { Pool } = require('pg');

async function checkDatabaseSchema() {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'vyapar_mitra',
    user: 'postgres',
    password: '1234',
  });

  try {
    console.log('🔍 Checking database schema...');
    
    // Check if products table exists and get its columns
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      );
    `);
    
    console.log('Products table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get all columns in products table
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'products'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nProducts table columns:');
      columnsResult.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // Check other tables that analytics services use
    const tables = ['negotiations', 'orders', 'vendors', 'users'];
    for (const table of tables) {
      const exists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      console.log(`\n${table} table exists:`, exists.rows[0].exists);
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseSchema();