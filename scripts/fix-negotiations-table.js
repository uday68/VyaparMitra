const { Pool } = require('pg');

async function fixNegotiationsTable() {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'vyapar_mitra',
    user: 'postgres',
    password: '1234',
    ssl: false
  });

  try {
    console.log('🔄 Fixing negotiations table...');
    
    // Check if user_id column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'negotiations' AND column_name = 'user_id';
    `);
    
    if (columnCheck.rows.length === 0) {
      // Add user_id column
      await pool.query('ALTER TABLE negotiations ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;');
      console.log('✅ Added user_id column to negotiations table');
    }
    
    // Now create sample data
    const userCheck = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) === 0) {
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
      `;
      
      await pool.query(sampleDataSQL);
      console.log('✅ Sample data created successfully');
    } else {
      console.log('📊 Sample data already exists');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixNegotiationsTable();