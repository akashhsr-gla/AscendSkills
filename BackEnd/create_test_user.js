const mongoose = require('mongoose');
const User = require('./models/User');

async function createTestUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ascend_skills');
    console.log('✅ Connected to MongoDB');
    
    // Check if test user already exists
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (testUser) {
      console.log('✅ Test user already exists:', testUser.email);
      // Update password to a known value
      testUser.password = 'password123';
      await testUser.save();
      console.log('✅ Updated test user password to: password123');
    } else {
      // Create new test user
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        college: 'Test University',
        degree: 'Bachelor of Technology (B.Tech)',
        yearOfCompletion: '2024',
        role: 'student',
        status: {
          isActive: true,
          isEmailVerified: true,
          loginAttempts: 0
        }
      });
      
      await testUser.save();
      console.log('✅ Created test user with email: test@example.com, password: password123');
    }
    
    console.log('✅ Test user ready for login');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser(); 