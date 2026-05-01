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
    console.log('=== Piutang Diberikan Transactions ===');
    const [piutang] = await pool.execute(`
      SELECT t.id, t.transaction_type, t.amount, t.transaction_date,
             c.name, c.category_type
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE c.name = 'Piutang Diberikan'
      ORDER BY t.transaction_date DESC
    `);
    
    console.log(`Found ${piutang.length} transactions:`);
    piutang.forEach(tx => {
      console.log(`  ID ${tx.id}: type=${tx.transaction_type}, category_type=${tx.category_type}, amount=${tx.amount}, date=${tx.transaction_date}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
