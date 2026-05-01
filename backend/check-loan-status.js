import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'personal_finance_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function checkLoanStatus() {
  try {
    console.log('\n=== 1. Check Loan Categories ===');
    const [categories] = await pool.execute(
      'SELECT id, name, category_type FROM categories WHERE category_type = "loan"'
    );
    console.log(`Found ${categories.length} loan categories:`);
    categories.forEach(cat => {
      console.log(`  ID: ${cat.id}, Name: ${cat.name}, Type: ${cat.category_type}`);
    });

    console.log('\n=== 2. Count Loan Transactions ===');
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as loan_count 
       FROM transactions t
       WHERE t.category_id IN (
         SELECT id FROM categories WHERE category_type = "loan"
       )`
    );
    console.log(`Transactions linked to loan categories: ${countResult[0].loan_count}`);

    console.log('\n=== 3. Check Transactions with Loan Category Names ===');
    const [loanTransactions] = await pool.execute(
      `SELECT t.id, t.category_id, t.category_name, t.transaction_type, t.amount
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.category_name IN ('Utang', 'Cicilan Utang', 'Piutang Diberikan', 'Pembayaran Piutang')
       ORDER BY t.category_name, t.id
       LIMIT 20`
    );
    console.log(`Found ${loanTransactions.length} transactions with loan category names:`);
    loanTransactions.forEach(tx => {
      console.log(`  ID: ${tx.id}, Cat: ${tx.category_name}, CatID: ${tx.category_id}, Type: ${tx.transaction_type}, Amount: ${tx.amount}`);
    });

    console.log('\n=== 4. Transaction Type Distribution ===');
    const [distribution] = await pool.execute(
      `SELECT transaction_type, COUNT(*) as count FROM transactions GROUP BY transaction_type`
    );
    console.log('Transaction types in database:');
    distribution.forEach(row => {
      console.log(`  ${row.transaction_type}: ${row.count}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkLoanStatus();
