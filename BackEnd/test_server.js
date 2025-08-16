const fetch = require('node-fetch');

async function testServer() {
  try {
    // Test health endpoint
    console.log('Testing server connectivity...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check response:', healthData);

    // Test admin endpoint without auth to see error
    console.log('\nTesting admin endpoint without auth...');
    const adminResponse = await fetch('http://localhost:5000/api/admin/interviews');
    const adminData = await adminResponse.json();
    console.log('Admin response:', adminData);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testServer(); 