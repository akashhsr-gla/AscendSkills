const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ascend-skills', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedJobs = async () => {
  try {
    // Get admin user for createdBy field
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      return;
    }

    // Clear existing jobs
    await Job.deleteMany({});
    console.log('Cleared existing jobs');

    const dummyJobs = [
      {
        title: 'Senior Software Engineer',
        company: {
          name: 'TechCorp Solutions',
          logo: 'https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=TC',
          location: {
            city: 'San Francisco',
            state: 'CA',
            country: 'USA'
          },
          industry: 'Technology',
          size: 'Large',
          website: 'https://techcorp.com'
        },
        description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing, developing, and maintaining high-quality software solutions.',
        requirements: {
          experience: {
            min: 5,
            max: 8,
            unit: 'years'
          },
          skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS'],
          education: {
            level: 'Bachelor',
            field: 'Computer Science'
          },
          certifications: ['AWS Certified Developer', 'MongoDB Certified Developer']
        },
        details: {
          type: 'Full-time',
          location: {
            type: 'Hybrid',
            address: 'San Francisco, CA'
          },
          salary: {
            min: 120000,
            max: 180000,
            currency: 'USD',
            period: 'yearly'
          },
          benefits: ['Health Insurance', '401k', 'Stock Options', 'Flexible PTO'],
          workSchedule: 'Monday - Friday, 9 AM - 5 PM'
        },
        status: {
          isActive: true,
          isFeatured: true,
          isUrgent: false
        },
        applications: {
          total: 45,
          viewed: 30,
          shortlisted: 8,
          hired: 1
        },
        tags: ['React', 'Node.js', 'Senior', 'Full-stack'],
        category: 'Technology',
        createdBy: adminUser._id
      },
      {
        title: 'Data Scientist',
        company: {
          name: 'DataFlow Analytics',
          logo: 'https://via.placeholder.com/150x150/10B981/FFFFFF?text=DF',
          location: {
            city: 'New York',
            state: 'NY',
            country: 'USA'
          },
          industry: 'Technology',
          size: 'Medium',
          website: 'https://dataflow.com'
        },
        description: 'Join our data science team to build machine learning models and analyze large datasets to drive business decisions.',
        requirements: {
          experience: {
            min: 3,
            max: 6,
            unit: 'years'
          },
          skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'],
          education: {
            level: 'Master',
            field: 'Data Science'
          },
          certifications: ['Google Cloud Professional Data Engineer']
        },
        details: {
          type: 'Full-time',
          location: {
            type: 'Remote',
            address: 'Remote'
          },
          salary: {
            min: 100000,
            max: 150000,
            currency: 'USD',
            period: 'yearly'
          },
          benefits: ['Health Insurance', '401k', 'Remote Work Allowance'],
          workSchedule: 'Flexible hours'
        },
        status: {
          isActive: true,
          isFeatured: false,
          isUrgent: true
        },
        applications: {
          total: 32,
          viewed: 20,
          shortlisted: 5,
          hired: 0
        },
        tags: ['Python', 'Machine Learning', 'Data Science', 'Remote'],
        category: 'Technology',
        createdBy: adminUser._id
      },
      {
        title: 'Marketing Manager',
        company: {
          name: 'Growth Marketing Inc',
          logo: 'https://via.placeholder.com/150x150/F59E0B/FFFFFF?text=GM',
          location: {
            city: 'Austin',
            state: 'TX',
            country: 'USA'
          },
          industry: 'Marketing',
          size: 'Medium',
          website: 'https://growthmarketing.com'
        },
        description: 'Lead our marketing initiatives and develop strategies to grow our customer base and increase brand awareness.',
        requirements: {
          experience: {
            min: 4,
            max: 7,
            unit: 'years'
          },
          skills: ['Digital Marketing', 'SEO', 'Social Media', 'Analytics', 'Content Strategy'],
          education: {
            level: 'Bachelor',
            field: 'Marketing'
          },
          certifications: ['Google Ads Certification', 'HubSpot Certification']
        },
        details: {
          type: 'Full-time',
          location: {
            type: 'On-site',
            address: 'Austin, TX'
          },
          salary: {
            min: 80000,
            max: 120000,
            currency: 'USD',
            period: 'yearly'
          },
          benefits: ['Health Insurance', '401k', 'Professional Development'],
          workSchedule: 'Monday - Friday, 9 AM - 6 PM'
        },
        status: {
          isActive: true,
          isFeatured: false,
          isUrgent: false
        },
        applications: {
          total: 28,
          viewed: 15,
          shortlisted: 4,
          hired: 0
        },
        tags: ['Marketing', 'Digital Marketing', 'SEO', 'Social Media'],
        category: 'Marketing',
        createdBy: adminUser._id
      },
      {
        title: 'UX/UI Designer',
        company: {
          name: 'Creative Design Studio',
          logo: 'https://via.placeholder.com/150x150/EC4899/FFFFFF?text=CD',
          location: {
            city: 'Los Angeles',
            state: 'CA',
            country: 'USA'
          },
          industry: 'Design',
          size: 'Small',
          website: 'https://creativedesign.com'
        },
        description: 'Create beautiful and intuitive user experiences for web and mobile applications. Work closely with development teams to bring designs to life.',
        requirements: {
          experience: {
            min: 2,
            max: 5,
            unit: 'years'
          },
          skills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping', 'Design Systems'],
          education: {
            level: 'Bachelor',
            field: 'Design'
          },
          certifications: ['Google UX Design Certificate']
        },
        details: {
          type: 'Full-time',
          location: {
            type: 'Hybrid',
            address: 'Los Angeles, CA'
          },
          salary: {
            min: 70000,
            max: 110000,
            currency: 'USD',
            period: 'yearly'
          },
          benefits: ['Health Insurance', '401k', 'Creative Tools Allowance'],
          workSchedule: 'Monday - Friday, 10 AM - 6 PM'
        },
        status: {
          isActive: true,
          isFeatured: true,
          isUrgent: false
        },
        applications: {
          total: 38,
          viewed: 25,
          shortlisted: 6,
          hired: 0
        },
        tags: ['UX/UI', 'Figma', 'Design', 'Creative'],
        category: 'Design',
        createdBy: adminUser._id
      },
      {
        title: 'Financial Analyst',
        company: {
          name: 'Global Finance Corp',
          logo: 'https://via.placeholder.com/150x150/059669/FFFFFF?text=GF',
          location: {
            city: 'Chicago',
            state: 'IL',
            country: 'USA'
          },
          industry: 'Finance',
          size: 'Large',
          website: 'https://globalfinance.com'
        },
        description: 'Analyze financial data, prepare reports, and provide insights to support business decisions and strategic planning.',
        requirements: {
          experience: {
            min: 3,
            max: 6,
            unit: 'years'
          },
          skills: ['Excel', 'Financial Modeling', 'SQL', 'Power BI', 'Accounting'],
          education: {
            level: 'Bachelor',
            field: 'Finance'
          },
          certifications: ['CFA', 'CPA']
        },
        details: {
          type: 'Full-time',
          location: {
            type: 'On-site',
            address: 'Chicago, IL'
          },
          salary: {
            min: 75000,
            max: 120000,
            currency: 'USD',
            period: 'yearly'
          },
          benefits: ['Health Insurance', '401k', 'Performance Bonus'],
          workSchedule: 'Monday - Friday, 8 AM - 5 PM'
        },
        status: {
          isActive: true,
          isFeatured: false,
          isUrgent: false
        },
        applications: {
          total: 22,
          viewed: 12,
          shortlisted: 3,
          hired: 0
        },
        tags: ['Finance', 'Analytics', 'Excel', 'Financial Modeling'],
        category: 'Finance',
        createdBy: adminUser._id
      }
    ];

    // Insert jobs
    const createdJobs = await Job.insertMany(dummyJobs);
    console.log(`Created ${createdJobs.length} jobs successfully`);

    console.log('Job seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding jobs:', error);
    process.exit(1);
  }
};

seedJobs(); 