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
    console.log('=== Transaction Count per Category ===');
    const [counts] = await pool.execute(`
      SELECT c.id, c.name, c.category_type, COUNT(t.id) as tx_count
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
      GROUP BY c.id, c.name, c.category_type
      ORDER BY tx_count DESC
    `);
    counts.forEach(row => {
      if (row.tx_count > 0) {
        console.log(`  ID ${row.id}: ${row.name} (${row.category_type}) - ${row.tx_count} tx`);
      }
    });

    console.log('\n=== Categories with NO Transactions ===');
    counts.filter(r => r.tx_count === 0).forEach(row => {
      console.log(`  ID ${row.id}: ${row.name} (${row.category_type})`);
    });

    console.log('\n=== Summary ===');
    const totalTx = counts.reduce((sum, row) => sum + row.tx_count, 0);
    const withTx = counts.filter(r => r.tx_count > 0).length;
    const withoutTx = counts.filter(r => r.tx_count === 0).length;
    console.log(`Total transactions: ${totalTx}`);
    console.log(`Categories with transactions: ${withTx}`);
    console.log(`Categories with NO transactions: ${withoutTx}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
