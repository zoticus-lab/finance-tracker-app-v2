import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'personal_finance_tracker',
  decimalNumbers: true
});

(async () => {
  try {
    // Check what getTransactions now returns
    console.log('=== API getTransactions (should exclude loans) ===');
    const [txWithoutLoans] = await pool.execute(`
      SELECT t.id, t.transaction_type, t.category_id
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.transaction_type != 'loan'
      ORDER BY t.transaction_date DESC
    `);
    
    console.log(`Transactions (without loans): ${txWithoutLoans.length}`);
    txWithoutLoans.forEach(tx => {
      console.log(`  ID ${tx.id}: type=${tx.transaction_type}`);
    });
    
    console.log('\n=== All transactions (for comparison) ===');
    const [allTx] = await pool.execute(`
      SELECT COUNT(*) as total FROM transactions
    `);
    console.log(`Total in DB: ${allTx[0].total}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
