import pool from './db.js';

async function addInitialWallet() {
  try {
    // Check if BCA already exists
    const [existing] = await pool.query(
      'SELECT id FROM accounts WHERE name = ?',
      ['BCA']
    );

    if (existing.length > 0) {
      console.log('BCA wallet already exists');
      return;
    }

    // Insert BCA wallet with Rp 492.100
    const [result] = await pool.execute(
      `INSERT INTO accounts (name, account_type, balance, currency, color, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      ['BCA', 'bank', 492100, 'IDR', '#00AA5B', 1]
    );

    console.log('✅ BCA wallet added with balance: Rp 492.100');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addInitialWallet();
