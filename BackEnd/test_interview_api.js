const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

async function testInterviewAPI() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ascend_skills');
    console.log('Connected to MongoDB');

    // Get admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found');
      return;
    }

    console.log('Admin user found:', adminUser.email);

    // Generate JWT token with userId instead of id
    const token = jwt.sign(
      { userId: adminUser._id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Generated token:', token);

    // Test the interview API
    const response = await fetch('http://localhost:5000/api/admin/interviews?page=1&limit=5', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`Found ${data.data.interviews.length} interviews`);
      data.data.interviews.forEach((interview, index) => {
        console.log(`${index + 1}. ${interview.title} (${interview.type}) - Status: ${interview.status?.current}`);
      });
    } else {
      console.log('API Error:', data.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

testInterviewAPI(); 