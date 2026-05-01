async function testAPI() {
  try {
    console.log('Testing /api/dashboard endpoint...\n');
    const response = await fetch('http://localhost:5001/api/dashboard');
    const data = await response.json();
    
    console.log('=== Summary Values (should exclude loan transactions) ===');
    console.log(`Income: ${data.summary?.income || 'N/A'}`);
    console.log(`Expense: ${data.summary?.expense || 'N/A'}`);
    console.log(`Balance: ${data.summary?.balance || 'N/A'}`);
    
    console.log('\n=== Expected (from DB check) ===');
    console.log('Income: 3000');
    console.log('Expense: 272900');
    console.log('Transfer: 500000 (not counted in income/expense)');
    console.log('Loans: 2408000 (excluded from totals)');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
