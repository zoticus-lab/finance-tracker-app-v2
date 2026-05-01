import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('Testing /api/dashboard endpoint...\n');
    const response = await fetch('http://localhost:5001/api/dashboard');
    const data = await response.json();
    
    console.log('=== Dashboard Summary ===');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
