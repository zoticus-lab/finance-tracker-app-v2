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
    console.log('=== Loan Transactions (should be excluded) ===');
    const [loans] = await pool.execute(`
      SELECT id, category_id, amount, transaction_type FROM transactions
      WHERE transaction_type = 'loan'
      ORDER BY id
    `);
    const loanTotal = loans.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    console.log(`Count: ${loans.length}, Total: ${loanTotal}`);
    loans.forEach(tx => {
      console.log(`  ID ${tx.id}: ${tx.amount} (${tx.transaction_type})`);
    });

    console.log('\n=== Income Transactions (after loan filter) ===');
    const [income] = await pool.execute(`
      SELECT id, category_id, amount, transaction_type FROM transactions
      WHERE transaction_type = 'income'
      ORDER BY id
    `);
    const incomeTotal = income.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    console.log(`Count: ${income.length}, Total: ${incomeTotal}`);

    console.log('\n=== Expense Transactions (after loan filter) ===');
    const [expense] = await pool.execute(`
      SELECT id, category_id, amount, transaction_type FROM transactions
      WHERE transaction_type = 'expense'
      ORDER BY id
    `);
    const expenseTotal = expense.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    console.log(`Count: ${expense.length}, Total: ${expenseTotal}`);

    console.log('\n=== Transfer Transactions ===');
    const [transfer] = await pool.execute(`
      SELECT id, category_id, amount, transaction_type FROM transactions
      WHERE transaction_type = 'transfer'
    `);
    const transferTotal = transfer.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    console.log(`Count: ${transfer.length}, Total: ${transferTotal}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
