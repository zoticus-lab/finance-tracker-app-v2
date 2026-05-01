async function testReportsDetail() {
  try {
    console.log('Testing /api/reports endpoint for April 2026...\n');
    const response = await fetch('http://localhost:5001/api/reports');
    const data = await response.json();
    
    console.log('=== Category Breakdown - Expense ===');
    data.categoryBreakdown.expense.forEach(cat => {
      console.log(`${cat.name}: ${cat.amount}`);
    });
    
    console.log('\n=== Looking for Piutang Diberikan ===');
    const piutang = data.categoryBreakdown.expense.find(c => c.name === 'Piutang Diberikan');
    if (piutang) {
      console.log(`FOUND: ${piutang.name} - ${piutang.amount}`);
    } else {
      console.log('NOT FOUND in expense breakdown - GOOD!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testReportsDetail();
