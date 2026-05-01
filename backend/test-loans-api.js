import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/loans',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ /api/loans Response:\n');
      console.log(`Loans: ${result.loans?.length || 0}`);
      console.log(`Loan Transactions: ${result.loanTransactions?.length || 0}`);
      
      if (result.loanTransactions?.length > 0) {
        console.log('\n=== Loan Transactions ===');
        result.loanTransactions.forEach(tx => {
          console.log(`  ${tx.categoryName}: ${tx.amount} (${tx.transactionDate})`);
        });
      }
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
