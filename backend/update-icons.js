import pool from './db.js';

async function updateIcons() {
  const updates = [
    ['Parkir', 'MapPin'],
    ['Bensin', 'Zap'],
    ['Piutang Diberikan', 'UserCheck'],
  ];

  console.log('\n🔄 Updating category icons...\n');

  for (const [name, newIcon] of updates) {
    const [result] = await pool.execute(
      `UPDATE categories SET icon = ? WHERE name = ?`,
      [newIcon, name]
    );
    console.log(`✓ ${name} → ${newIcon} (affected: ${result.affectedRows})`);
  }

  // Verify
  const [rows] = await pool.query(`
    SELECT id, name, icon FROM categories 
    WHERE name IN ('Parkir', 'Bensin', 'Piutang Diberikan')
  `);

  console.log('\n✅ Verification:');
  rows.forEach(row => {
    console.log(`  ${row.name}: ${row.icon}`);
  });

  process.exit(0);
}

updateIcons().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
