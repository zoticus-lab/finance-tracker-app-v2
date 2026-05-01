import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'personal_finance_tracker',
  waitForConnections: true,
  connectionLimit: 10,
});

async function test() {
  try {
    // Check transactions around March 31 / April
    const [transactions] = await pool.query(`
      SELECT id, transaction_date, MONTH(transaction_date) AS month, YEAR(transaction_date) AS year
      FROM transactions
      WHERE transaction_date >= '2026-03-30' AND transaction_date <= '2026-04-02'
      ORDER BY transaction_date DESC
    `);

    console.log('\n📋 Transactions around March/April boundary:\n');
    transactions.forEach(tx => {
      const date = tx.transaction_date instanceof Date 
        ? tx.transaction_date.toISOString().split('T')[0]
        : tx.transaction_date;
      console.log(`ID: ${tx.id} | Date: ${date} | M${tx.month}/Y${tx.year}`);
    });

    pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
