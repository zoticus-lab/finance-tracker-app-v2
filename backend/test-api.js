import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/dashboard',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('\n✅ API Response structure:');
      console.log('Has categories:', !!response.categories);
      console.log('Categories length:', response.categories?.length);
      if (response.categories && response.categories.length > 0) {
        console.log('\n📊 First category:');
        console.log(JSON.stringify(response.categories[0], null, 2));
      }
    } catch (err) {
      console.error('Parse error:', err.message);
      console.log('Raw data:', data.slice(0, 200));
    }
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('❌ Request error:', err);
  process.exit(1);
});

req.end();
