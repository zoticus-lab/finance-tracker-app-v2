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
    console.log('=== Transactions Table Schema ===');
    const [schema] = await pool.execute('DESCRIBE transactions');
    schema.forEach(row => {
      console.log(`${row.Field}: ${row.Type}`);
    });

    console.log('\n=== All Transactions with Loan Category Names ===');
    const [allLoans] = await pool.execute(`
      SELECT t.id, t.category_id, t.transaction_type, t.amount 
      FROM transactions t
      INNER JOIN categories c ON t.category_id = c.id
      WHERE c.category_type = 'loan'
      ORDER BY c.name, t.id
    `);
    console.log(`Total loan transactions: ${allLoans.length}`);
    allLoans.forEach(tx => {
      console.log(`  ID: ${tx.id}, CatID: ${tx.category_id}, Type: ${tx.transaction_type}, Amount: ${tx.amount}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
