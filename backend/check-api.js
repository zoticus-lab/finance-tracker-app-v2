import fetch from 'node-fetch';

async function checkAPI() {
  try {
    const res = await fetch('http://localhost:5001/api/categories');
    const data = await res.json();
    
    console.log('\n📊 API Response for /api/categories:\n');
    if (Array.isArray(data)) {
      console.log('First 5 categories:');
      data.slice(0, 5).forEach(cat => {
        console.log(`  ${cat.id} | ${cat.name.padEnd(25)} | icon: ${cat.icon || 'NULL'}`);
      });
    } else if (data.categories) {
      console.log('Categories in response.categories:');
      data.categories.slice(0, 5).forEach(cat => {
        console.log(`  ${cat.id} | ${cat.name.padEnd(25)} | icon: ${cat.icon || 'NULL'}`);
      });
    } else {
      console.log('Full response:', JSON.stringify(data, null, 2).slice(0, 500));
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  process.exit(0);
}

checkAPI();
