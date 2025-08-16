const fetch = require('node-fetch');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const loginData = {
      email: 'admin@ascendskills.com',
      password: 'admin123'
    };

    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    const data = await response.json();
    console.log('Login response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ Admin login successful!');
      const token = data.data.token;
      console.log('Token:', token);
      
      // Test admin interviews API with the token
      console.log('\nTesting admin interviews API...');
      const interviewsResponse = await fetch('http://localhost:5000/api/admin/interviews?page=1&limit=5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const interviewsData = await interviewsResponse.json();
      console.log('Interviews API response:', JSON.stringify(interviewsData, null, 2));

      if (interviewsData.success) {
        console.log(`✅ Found ${interviewsData.data.interviews.length} interviews`);
        interviewsData.data.interviews.forEach((interview, index) => {
          console.log(`${index + 1}. ${interview.title} (${interview.type}) - Status: ${interview.status?.current}`);
        });
      }
    } else {
      console.log('❌ Admin login failed:', data.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAdminLogin(); 