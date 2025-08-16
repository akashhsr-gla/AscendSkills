const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/ascend_skills', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createAdminUser() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/ascend_skills');
    console.log('✅ Connected to MongoDB');
    
    // Check if admin user already exists
    let adminUser = await User.findOne({ email: 'admin@ascendskills.com' });
    
    if (adminUser) {
      console.log('✅ Admin user already exists:', adminUser.email);
      // Update password to a known value
      const hashedPassword = await bcrypt.hash('admin123', 12);
      adminUser.password = hashedPassword;
      adminUser.role = 'admin';
      adminUser.status = {
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        isDefaulter: false,
        loginAttempts: 0
      };
      await adminUser.save();
      console.log('✅ Updated admin user password to: admin123');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      adminUser = new User({
        name: 'System Administrator',
        email: 'admin@ascendskills.com',
        password: hashedPassword,
        role: 'admin',
        profile: {
          phone: '+1 (555) 123-4567',
          college: 'Ascend Skills',
          degree: 'Administration',
          year: 2024,
          branch: 'System Management',
          cgpa: 10.0,
          skills: ['System Administration', 'User Management', 'Data Analytics'],
          bio: 'System Administrator for Ascend Skills Platform',
          location: 'Global',
          gender: 'other'
        },
        subscription: {
          type: 'enterprise',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          isActive: true,
          paymentStatus: 'completed',
          amount: 0,
          features: [
            { name: 'full_access', enabled: true },
            { name: 'user_management', enabled: true },
            { name: 'analytics', enabled: true },
            { name: 'system_settings', enabled: true }
          ]
        },
        status: {
          isActive: true,
          isEmailVerified: true,
          isPhoneVerified: false,
          isDefaulter: false,
          lastLogin: new Date(),
          loginAttempts: 0
        },
        analytics: {
          totalQuizzes: 0,
          totalInterviews: 0,
          totalCodingProblems: 0,
          averageQuizScore: 0,
          averageInterviewScore: 0,
          averageCodingScore: 0,
          overallRating: 100,
          strengths: ['System Management', 'User Administration'],
          weaknesses: [],
          totalTimeSpent: 0,
          streakCount: 0,
          lastActivityDate: new Date()
        }
      });
      
      await adminUser.save();
      console.log('✅ Created admin user with email: admin@ascendskills.com, password: admin123');
    }
    
    console.log('\n📋 Admin User Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@ascendskills.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Name: System Administrator');
    console.log('🔐 Role: admin');
    console.log('✅ Status: Active & Email Verified');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Access URLs:');
    console.log('• Admin Login: http://localhost:3000/admin/login');
    console.log('• Admin Dashboard: http://localhost:3000/admin');
    console.log('\n⚠️  Security Note: Change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser(); 