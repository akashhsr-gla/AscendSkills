const mongoose = require('mongoose');
const InterviewCategory = require('../models/InterviewCategory');
const Question = require('../models/Question');
const Company = require('../models/Company');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ascend-skills', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const populateInterviewData = async () => {
  try {
    console.log('🚀 Starting interview data population...');

    // Get admin user for creating records
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('⚠️ No admin user found. Creating a default admin user...');
      const defaultAdmin = new User({
        name: 'System Admin',
        email: 'admin@ascendskills.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      await defaultAdmin.save();
      console.log('✅ Default admin user created');
    }

    const creatorId = adminUser?._id || (await User.findOne({ role: 'admin' }))._id;

    // Create or update companies
    const companies = [
      {
        name: 'google',
        displayName: 'Google',
        logo: '🟢',
        industry: 'Technology',
        companySize: 'large',
        contact: { email: 'careers@google.com' },
        assessment: {
          enableSystemDesign: true,
          defaultInterviewTime: 2700,
          passingScore: 70
        }
      },
      {
        name: 'microsoft',
        displayName: 'Microsoft',
        logo: '🔵',
        industry: 'Technology',
        companySize: 'large',
        contact: { email: 'careers@microsoft.com' },
        assessment: {
          enableSystemDesign: true,
          defaultInterviewTime: 2400,
          passingScore: 65
        }
      },
      {
        name: 'amazon',
        displayName: 'Amazon',
        logo: '🟠',
        industry: 'Technology',
        companySize: 'large',
        contact: { email: 'careers@amazon.com' },
        assessment: {
          enableSystemDesign: true,
          defaultInterviewTime: 3000,
          passingScore: 75
        }
      },
      {
        name: 'meta',
        displayName: 'Meta',
        logo: '🔵',
        industry: 'Technology',
        companySize: 'large',
        contact: { email: 'careers@meta.com' },
        assessment: {
          enableSystemDesign: true,
          defaultInterviewTime: 2400,
          passingScore: 65
        }
      },
      {
        name: 'apple',
        displayName: 'Apple',
        logo: '⚫',
        industry: 'Technology',
        companySize: 'large',
        contact: { email: 'careers@apple.com' },
        assessment: {
          enableSystemDesign: true,
          defaultInterviewTime: 2700,
          passingScore: 70
        }
      },
      {
        name: 'netflix',
        displayName: 'Netflix',
        logo: '🔴',
        industry: 'Technology',
        companySize: 'large',
        contact: { email: 'careers@netflix.com' },
        assessment: {
          enableSystemDesign: true,
          defaultInterviewTime: 3000,
          passingScore: 80
        }
      }
    ];

    const createdCompanies = {};
    for (const companyData of companies) {
      let company = await Company.findOne({ name: companyData.name });
      if (!company) {
        company = new Company(companyData);
        await company.save();
        console.log(`✅ Created company: ${company.displayName}`);
      } else {
        console.log(`ℹ️ Company already exists: ${company.displayName}`);
      }
      createdCompanies[companyData.name] = company;
    }

    console.log('✅ Companies created/updated successfully');

  } catch (error) {
    console.error('❌ Error populating interview data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
if (require.main === module) {
  populateInterviewData();
}

module.exports = populateInterviewData; 