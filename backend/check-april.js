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
    console.log('=== Loan Transactions by Month ===');
    const [loans] = await pool.execute(`
      SELECT id, MONTH(transaction_date) as month, YEAR(transaction_date) as year, 
             amount, category_id
      FROM transactions
      WHERE transaction_type = 'loan'
      ORDER BY transaction_date DESC
    `);
    
    const byMonth = {};
    loans.forEach(tx => {
      const key = `${tx.year}-${String(tx.month).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = {count: 0, total: 0};
      byMonth[key].count++;
      byMonth[key].total += tx.amount;
    });
    
    console.log('Loan transactions by month:');
    Object.entries(byMonth).forEach(([month, data]) => {
      console.log(`  ${month}: ${data.count} txs = ${data.total}`);
    });
    
    console.log('\n=== All Expense Transactions in April 2026 ===');
    const [aprilExpenses] = await pool.execute(`
      SELECT id, transaction_type, amount, category_id, description
      FROM transactions
      WHERE MONTH(transaction_date) = 4 
        AND YEAR(transaction_date) = 2026
      ORDER BY transaction_type, id
    `);
    
    let loanCount = 0, expenseCount = 0, transferCount = 0;
    let loanTotal = 0, expenseTotal = 0, transferTotal = 0;
    
    aprilExpenses.forEach(tx => {
      if (tx.transaction_type === 'loan') {
        loanCount++;
        loanTotal += tx.amount;
      } else if (tx.transaction_type === 'expense') {
        expenseCount++;
        expenseTotal += tx.amount;
      } else if (tx.transaction_type === 'transfer') {
        transferCount++;
        transferTotal += tx.amount;
      }
    });
    
    console.log(`Loan: ${loanCount} txs = ${loanTotal}`);
    console.log(`Expense: ${expenseCount} txs = ${expenseTotal}`);
    console.log(`Transfer: ${transferCount} txs = ${transferTotal}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
