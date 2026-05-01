import pool from './db.js';

async function checkIcons() {
  const [rows] = await pool.query(`
    SELECT id, name, icon, category_type 
    FROM categories 
    LIMIT 25
  `);

  console.log('\n=== Current Category Icons in Database ===\n');
  rows.forEach(row => {
    console.log(`${row.id.toString().padStart(2)} | ${row.name.padEnd(20)} | ${row.category_type.padEnd(10)} | ${row.icon || 'NULL'}`);
  });

  // Check how many have NULL icons
  const [nullCount] = await pool.query(`SELECT COUNT(*) as count FROM categories WHERE icon IS NULL`);
  console.log(`\n❌ Categories with NULL icon: ${nullCount[0].count}`);

  process.exit(0);
}

checkIcons().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
