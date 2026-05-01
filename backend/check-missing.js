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
    // Check apakah ada transactions dengan category_id 496 atau 497
    console.log('=== Transactions dengan Category ID 496 atau 497 ===');
    const [txWithIds] = await pool.execute(`
      SELECT t.id, t.category_id, t.transaction_type, t.amount 
      FROM transactions t
      WHERE t.category_id IN (496, 497)
    `);
    console.log(`Found ${txWithIds.length} transactions`);
    txWithIds.forEach(tx => {
      console.log(`  ID: ${tx.id}, CatID: ${tx.category_id}, Type: ${tx.transaction_type}`);
    });

    // Check category distribution
    console.log('\n=== Distribution by Category ID (loan categories only) ===');
    const [dist] = await pool.execute(`
      SELECT t.category_id, c.name, COUNT(*) as count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE c.category_type = 'loan'
      GROUP BY t.category_id, c.name
    `);
    dist.forEach(row => {
      console.log(`  CatID ${row.category_id} (${row.name}): ${row.count} transactions`);
    });

    // Check if category IDs 496, 497 even have any data
    console.log('\n=== All category IDs in transactions ===');
    const [allCats] = await pool.execute(`
      SELECT DISTINCT category_id FROM transactions ORDER BY category_id
    `);
    console.log(`Unique category IDs: ${allCats.map(c => c.category_id).join(', ')}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
