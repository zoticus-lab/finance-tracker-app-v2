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
    console.log('=== All Categories ===');
    const [cats] = await pool.execute(`
      SELECT id, name, category_type FROM categories ORDER BY id
    `);
    cats.forEach(cat => {
      console.log(`  ID: ${cat.id}, Name: ${cat.name}, Type: ${cat.category_type}`);
    });

    console.log('\n=== Transactions dengan NULL category_id ===');
    const [nullCat] = await pool.execute(`
      SELECT COUNT(*) as count FROM transactions WHERE category_id IS NULL
    `);
    console.log(`NULL category_id: ${nullCat[0].count}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
