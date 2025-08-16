const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function fixAdminPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ascend_skills');
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@ascendskills.com' });
    
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }

    console.log('Admin user found:', adminUser.email);

    // Hash password manually
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Update password directly without triggering pre-save middleware
    await User.updateOne(
      { _id: adminUser._id },
      { $set: { password: hashedPassword } }
    );

    console.log('✅ Password updated to: admin123');

    // Verify the password
    const updatedUser = await User.findById(adminUser._id);
    const isMatch = await bcrypt.compare('admin123', updatedUser.password);
    console.log('Password verification:', isMatch ? '✅ SUCCESS' : '❌ FAILED');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

fixAdminPassword(); 