import pool from './db.js';

async function checkIcons() {
  const [rows] = await pool.query(`
    SELECT name, icon FROM categories 
    WHERE name IN ('Bensin', 'Biaya Admin', 'Donasi', 'Tagihan', 'Makanan', 'Transportasi')
    ORDER BY name
  `);

  console.log('\n📊 Updated Icons:');
  rows.forEach(r => {
    console.log(`  ${r.name.padEnd(20)} → ${r.icon}`);
  });

  process.exit(0);
}

checkIcons().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
