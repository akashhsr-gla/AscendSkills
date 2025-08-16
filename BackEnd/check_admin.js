const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ascend_skills');
    console.log('Connected to MongoDB');

    const adminUser = await User.findOne({ email: 'admin@ascendskills.com' });
    
    if (adminUser) {
      console.log('Admin user found:', {
        email: adminUser.email,
        role: adminUser.role,
        hasPassword: !!adminUser.password,
        isActive: adminUser.status?.isActive
      });
      
      // Test password
      const isMatch = await bcrypt.compare('admin123', adminUser.password);
      console.log('Password "admin123" match:', isMatch);
      
      // Test other common passwords
      const testPasswords = ['admin', 'password', '123456', 'admin123'];
      for (const pwd of testPasswords) {
        const match = await bcrypt.compare(pwd, adminUser.password);
        if (match) {
          console.log(`Password "${pwd}" matches!`);
        }
      }
      
    } else {
      console.log('Admin user not found');
      
      // List all users
      const allUsers = await User.find().select('email role');
      console.log('All users in database:', allUsers);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkAdmin(); 