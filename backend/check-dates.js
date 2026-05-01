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
    console.log('=== Transaction Dates (Expense Only) ===');
    const [expenses] = await pool.execute(`
      SELECT id, MONTH(transaction_date) as month, YEAR(transaction_date) as year, 
             transaction_type, amount, category_id, description
      FROM transactions
      WHERE transaction_type = 'expense'
      ORDER BY transaction_date DESC
    `);
    
    const byMonth = {};
    let total = 0;
    expenses.forEach(tx => {
      const key = `${tx.year}-${String(tx.month).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = 0;
      byMonth[key] += tx.amount;
      total += tx.amount;
    });
    
    console.log('Expenses by month:');
    Object.entries(byMonth).forEach(([month, amount]) => {
      console.log(`  ${month}: ${amount}`);
    });
    console.log(`\nTotal: ${total}`);
    console.log(`\nNow: ${new Date().toLocaleString()}`);
    console.log(`Current month: ${new Date().getMonth() + 1}`);
    console.log(`Current year: ${new Date().getFullYear()}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
