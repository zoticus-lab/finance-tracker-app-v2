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
    // Get current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    console.log(`\n📅 Testing Month: ${currentMonth}/${currentYear}`);

    // Get all transactions for current month
    const [transactions] = await pool.query(`
      SELECT
        t.id,
        t.transaction_type,
        t.amount,
        t.transaction_date,
        CAST(DATE_FORMAT(t.transaction_date, '%m') AS UNSIGNED) AS month,
        CAST(DATE_FORMAT(t.transaction_date, '%Y') AS UNSIGNED) AS year,
        c.name AS category_name,
        c.category_type
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      ORDER BY t.transaction_date DESC
    `);

    console.log('\n📊 All Transactions:');
    transactions.forEach(tx => {
      const isCurrentMonth = tx.month === currentMonth && tx.year === currentYear;
      const marker = isCurrentMonth ? '✓' : '✗';
      console.log(`${marker} ${tx.transaction_date.toISOString().split('T')[0]} (M${tx.month}/Y${tx.year}) | Type: ${tx.transaction_type} | Cat: ${tx.category_name} | Amount: Rp ${tx.amount.toLocaleString('id-ID')}`);
    });

    // Filter current month
    const currentMonthTxs = transactions.filter(
      t => t.month === currentMonth && t.year === currentYear
    );

    // Filter real transactions (exclude transfer & loan)
    const realTxs = currentMonthTxs.filter(
      t => t.transaction_type !== 'transfer' && t.transaction_type !== 'loan'
    );

    console.log(`\n📈 Current Month (${currentMonth}/${currentYear}):`);
    console.log(`  Total transactions: ${currentMonthTxs.length}`);
    console.log(`  Real transactions (excl. transfer & loan): ${realTxs.length}`);

    const income = realTxs
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = realTxs
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    console.log(`\n💹 Calculation:`);
    console.log(`  Income:  Rp ${income.toLocaleString('id-ID')}`);
    console.log(`  Expense: Rp ${expense.toLocaleString('id-ID')}`);
    console.log(`  Balance: Rp ${balance.toLocaleString('id-ID')}`);

    // Show expenses detail
    console.log(`\n📋 Expense Details:`);
    realTxs
      .filter(t => t.transaction_type === 'expense')
      .forEach(tx => {
        console.log(`  ${tx.transaction_date.toISOString().split('T')[0]} | ${tx.category_name} | Rp ${tx.amount.toLocaleString('id-ID')}`);
      });

    // Show excluded transactions
    const excluded = currentMonthTxs.filter(
      t => t.transaction_type === 'transfer' || t.transaction_type === 'loan'
    );

    if (excluded.length > 0) {
      console.log(`\n⚠️  Excluded Transactions (Transfer & Loan):`);
      excluded.forEach(tx => {
        console.log(`  ${tx.transaction_date.toISOString().split('T')[0]} | Type: ${tx.transaction_type} | Cat: ${tx.category_name} | Amount: Rp ${tx.amount.toLocaleString('id-ID')}`);
      });
    }

    pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
