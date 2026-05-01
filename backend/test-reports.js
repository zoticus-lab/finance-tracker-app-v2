import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/reports',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const report = JSON.parse(data);
      console.log('✅ Reports API Successfully Retrieved!\n');
      console.log('📊 Monthly Summary:');
      console.log(`   Month: ${report.monthlySummary.monthName} ${report.monthlySummary.year}`);
      console.log(`   Income: Rp ${report.monthlySummary.income.toLocaleString('id-ID')}`);
      console.log(`   Expense: Rp ${report.monthlySummary.expense.toLocaleString('id-ID')}`);
      console.log(`   Balance: Rp ${report.monthlySummary.balance.toLocaleString('id-ID')}\n`);

      console.log('💰 Budget Capacity:');
      console.log(`   Avg Income: Rp ${report.budgetCapacity.avgIncome.toLocaleString('id-ID')}`);
      console.log(`   Fixed Cost: Rp ${report.budgetCapacity.fixedCost.toLocaleString('id-ID')}`);
      console.log(`   Routine Cost: Rp ${report.budgetCapacity.routineCost.toLocaleString('id-ID')}`);
      console.log(`   Available for Spending: Rp ${report.budgetCapacity.availableForSpending.toLocaleString('id-ID')}`);
      console.log(`   Safe to Spend: Rp ${report.budgetCapacity.safeToSpend.toLocaleString('id-ID')}\n`);

      console.log('🥧 Category Breakdown:');
      console.log(`   Income Categories: ${report.categoryBreakdown.income.length}`);
      console.log(`   Expense Categories: ${report.categoryBreakdown.expense.length}\n`);

      console.log('📈 Spending Trend:');
      console.log(`   Data Points: ${report.spendingTrend.length} months`);
      console.log(`   Latest: ${report.spendingTrend[report.spendingTrend.length - 1].monthName} ${report.spendingTrend[report.spendingTrend.length - 1].year}`);
      
      console.log('\n✅ All report data loaded successfully!');
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.error('Response:', data.substring(0, 200));
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
  process.exit(1);
});

req.end();
