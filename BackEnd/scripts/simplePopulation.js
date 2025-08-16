const mongoose = require('mongoose');
const InterviewCategory = require('../models/InterviewCategory');
const Question = require('../models/Question');
const Company = require('../models/Company');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ascend_skills', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const populateData = async () => {
  try {
    console.log('🚀 Starting data population...');

    // Create admin user if not exists
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = new User({
        name: 'System Admin',
        email: 'admin@ascendskills.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
      console.log('✅ Admin user created');
    }

    // Create companies
    const companies = [
      { name: 'google', displayName: 'Google', logo: '🟢', industry: 'Technology', companySize: 'large' },
      { name: 'microsoft', displayName: 'Microsoft', logo: '🔵', industry: 'Technology', companySize: 'large' },
      { name: 'amazon', displayName: 'Amazon', logo: '🟠', industry: 'Technology', companySize: 'large' },
      { name: 'meta', displayName: 'Meta', logo: '🔵', industry: 'Technology', companySize: 'large' },
      { name: 'apple', displayName: 'Apple', logo: '⚫', industry: 'Technology', companySize: 'large' },
      { name: 'netflix', displayName: 'Netflix', logo: '🔴', industry: 'Technology', companySize: 'large' }
    ];

    const createdCompanies = {};
    for (const companyData of companies) {
      let company = await Company.findOne({ name: companyData.name });
      if (!company) {
        company = new Company({
          ...companyData,
          contact: { email: `careers@${companyData.name}.com` },
          subscription: { isActive: true },
          createdBy: adminUser._id
        });
        await company.save();
        console.log(`✅ Created company: ${company.displayName}`);
      }
      createdCompanies[companyData.name] = company;
    }

    // Create main categories
    const mainCategories = [
      {
        name: 'technical',
        displayName: 'Technical',
        description: 'Technical programming and coding questions',
        icon: 'Code',
        color: 'blue',
        type: 'main',
        status: { isActive: true, isPublic: true, sortOrder: 1 }
      },
      {
        name: 'behavioral',
        displayName: 'Behavioral',
        description: 'Behavioral and situational questions',
        icon: 'Users',
        color: 'green',
        type: 'main',
        status: { isActive: true, isPublic: true, sortOrder: 2 }
      },
      {
        name: 'system-design',
        displayName: 'System Design',
        description: 'System architecture and design questions',
        icon: 'Brain',
        color: 'purple',
        type: 'main',
        status: { isActive: true, isPublic: true, sortOrder: 3 }
      },
      {
        name: 'data-structures',
        displayName: 'Data Structures',
        description: 'Data structures and algorithms questions',
        icon: 'Target',
        color: 'orange',
        type: 'main',
        status: { isActive: true, isPublic: true, sortOrder: 4 }
      },
      {
        name: 'algorithms',
        displayName: 'Algorithms',
        description: 'Algorithm design and optimization questions',
        icon: 'Zap',
        color: 'yellow',
        type: 'main',
        status: { isActive: true, isPublic: true, sortOrder: 5 }
      }
    ];

    for (const categoryData of mainCategories) {
      let category = await InterviewCategory.findOne({ name: categoryData.name });
      if (!category) {
        category = new InterviewCategory({
          ...categoryData,
          createdBy: adminUser._id
        });
        await category.save();
        console.log(`✅ Created category: ${category.displayName}`);
      } else {
        // Update the status to ensure it's active
        category.status = { isActive: true, isPublic: true, sortOrder: categoryData.status.sortOrder };
        await category.save();
        console.log(`✅ Updated category: ${category.displayName}`);
      }
    }

    // Create sample questions
    const questions = [
      // Technical Questions
      {
        title: 'Two Sum Problem',
        content: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        type: 'coding',
        category: 'technical',
        difficulty: 'easy',
        metadata: { estimatedTime: 900, points: 1 },
        statistics: { totalAttempts: 1250, correctAttempts: 1062, averageScore: 85, averageTime: 720 },
        coding: {
          problemDescription: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
          tags: ['Array', 'Hash Table'],
          starterCode: [{ language: 'javascript', code: 'function twoSum(nums, target) {\n    // Your code here\n}' }]
        }
      },
      {
        title: 'Reverse a String',
        content: 'Write a function that reverses a string without using any built-in reverse methods.',
        type: 'coding',
        category: 'technical',
        difficulty: 'easy',
        metadata: { estimatedTime: 600, points: 1 },
        statistics: { totalAttempts: 980, correctAttempts: 882, averageScore: 90, averageTime: 480 },
        coding: {
          problemDescription: 'Write a function that reverses a string without using any built-in reverse methods.',
          tags: ['String', 'Two Pointers'],
          starterCode: [{ language: 'javascript', code: 'function reverseString(s) {\n    // Your code here\n}' }]
        }
      },
      {
        title: 'Valid Parentheses',
        content: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
        type: 'coding',
        category: 'technical',
        difficulty: 'medium',
        metadata: { estimatedTime: 900, points: 1 },
        statistics: { totalAttempts: 750, correctAttempts: 525, averageScore: 70, averageTime: 720 },
        coding: {
          problemDescription: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
          tags: ['Stack', 'String'],
          starterCode: [{ language: 'javascript', code: 'function isValid(s) {\n    // Your code here\n}' }]
        }
      },
      // Behavioral Questions
      {
        title: 'Tell me about a time you faced a challenging deadline',
        content: 'Describe a situation where you had to meet a tight deadline. What was the challenge, how did you approach it, and what was the outcome?',
        type: 'behavioral',
        category: 'behavioral',
        difficulty: 'medium',
        metadata: { estimatedTime: 300, points: 1 },
        statistics: { totalAttempts: 890, correctAttempts: 641, averageScore: 72, averageTime: 240 }
      },
      {
        title: 'Describe a conflict you had with a team member',
        content: 'Tell me about a time when you disagreed with a colleague. How did you handle the situation and what was the result?',
        type: 'behavioral',
        category: 'behavioral',
        difficulty: 'medium',
        metadata: { estimatedTime: 300, points: 1 },
        statistics: { totalAttempts: 650, correctAttempts: 455, averageScore: 70, averageTime: 240 }
      },
      {
        title: 'How do you handle stress and pressure?',
        content: 'Describe a situation where you were under significant pressure. How did you manage it and what was the outcome?',
        type: 'behavioral',
        category: 'behavioral',
        difficulty: 'easy',
        metadata: { estimatedTime: 240, points: 1 },
        statistics: { totalAttempts: 1200, correctAttempts: 960, averageScore: 80, averageTime: 180 }
      },
      // System Design Questions
      {
        title: 'Design a URL Shortener',
        content: 'Design a system like bit.ly that can shorten long URLs and redirect users to the original URL when they visit the shortened version.',
        type: 'system_design',
        category: 'system_design',
        difficulty: 'hard',
        metadata: { estimatedTime: 2700, points: 1 },
        statistics: { totalAttempts: 456, correctAttempts: 264, averageScore: 58, averageTime: 2400 },
        systemDesign: {
          requirements: ['Shorten long URLs to short URLs', 'Redirect users to original URL when they visit short URL'],
          constraints: ['URLs should be as short as possible', 'System should be highly available'],
          components: ['URL Shortening Service', 'Database for URL mappings', 'Cache layer for fast lookups']
        }
      },
      {
        title: 'Design a Chat Application',
        content: 'Design a real-time chat application like WhatsApp or Slack that supports text messaging, file sharing, and group chats.',
        type: 'system_design',
        category: 'system_design',
        difficulty: 'hard',
        metadata: { estimatedTime: 2700, points: 1 },
        statistics: { totalAttempts: 320, correctAttempts: 160, averageScore: 50, averageTime: 2400 },
        systemDesign: {
          requirements: ['Real-time messaging', 'File sharing', 'Group chats', 'Message history'],
          constraints: ['Low latency for real-time messaging', 'High availability'],
          components: ['WebSocket servers', 'Message queue system', 'File storage service']
        }
      },
      // Data Structures Questions
      {
        title: 'Implement a Stack',
        content: 'Implement a stack data structure with push, pop, and peek operations. Also implement a method to get the minimum element in O(1) time.',
        type: 'coding',
        category: 'data_structures',
        difficulty: 'medium',
        metadata: { estimatedTime: 900, points: 1 },
        statistics: { totalAttempts: 680, correctAttempts: 476, averageScore: 70, averageTime: 720 },
        coding: {
          problemDescription: 'Implement a stack data structure with push, pop, and peek operations. Also implement a method to get the minimum element in O(1) time.',
          tags: ['Stack', 'Data Structures'],
          starterCode: [{ language: 'javascript', code: 'class MinStack {\n    constructor() {\n        // Your code here\n    }\n    \n    push(val) {\n        // Your code here\n    }\n    \n    pop() {\n        // Your code here\n    }\n    \n    peek() {\n        // Your code here\n    }\n    \n    getMin() {\n        // Your code here\n    }\n}' }]
        }
      },
      {
        title: 'Binary Tree Traversal',
        content: 'Implement inorder, preorder, and postorder traversal of a binary tree both recursively and iteratively.',
        type: 'coding',
        category: 'algorithms',
        difficulty: 'medium',
        metadata: { estimatedTime: 1200, points: 1 },
        statistics: { totalAttempts: 520, correctAttempts: 312, averageScore: 60, averageTime: 900 },
        coding: {
          problemDescription: 'Implement inorder, preorder, and postorder traversal of a binary tree both recursively and iteratively.',
          tags: ['Binary Tree', 'Traversal', 'Recursion'],
          starterCode: [{ language: 'javascript', code: 'function inorderTraversal(root) {\n    // Your code here\n}\n\nfunction preorderTraversal(root) {\n    // Your code here\n}\n\nfunction postorderTraversal(root) {\n    // Your code here\n}' }]
        }
      },
      // Add missing questions for system-design and data-structures
      {
        title: 'Design a Social Media Feed',
        content: 'Design a social media feed system like Facebook or Twitter that can handle millions of users and real-time updates.',
        type: 'system_design',
        category: 'system_design',
        difficulty: 'hard',
        metadata: { estimatedTime: 2700, points: 1 },
        statistics: { totalAttempts: 280, correctAttempts: 140, averageScore: 50, averageTime: 2400 },
        systemDesign: {
          requirements: ['Real-time feed updates', 'Personalized content', 'Handle millions of users'],
          constraints: ['Low latency', 'High availability', 'Scalable architecture'],
          components: ['Feed service', 'Content recommendation engine', 'Real-time notification system']
        }
      },
      {
        title: 'Implement a Queue',
        content: 'Implement a queue data structure with enqueue, dequeue, and peek operations. Also implement a circular queue.',
        type: 'coding',
        category: 'data_structures',
        difficulty: 'medium',
        metadata: { estimatedTime: 900, points: 1 },
        statistics: { totalAttempts: 450, correctAttempts: 315, averageScore: 70, averageTime: 720 },
        coding: {
          problemDescription: 'Implement a queue data structure with enqueue, dequeue, and peek operations. Also implement a circular queue.',
          tags: ['Queue', 'Data Structures', 'Circular Buffer'],
          starterCode: [{ language: 'javascript', code: 'class Queue {\n    constructor() {\n        // Your code here\n    }\n    \n    enqueue(item) {\n        // Your code here\n    }\n    \n    dequeue() {\n        // Your code here\n    }\n    \n    peek() {\n        // Your code here\n    }\n}' }]
        }
      }
    ];

    for (const questionData of questions) {
      const existingQuestion = await Question.findOne({ title: questionData.title });
      if (!existingQuestion) {
        const question = new Question({
          ...questionData,
          createdBy: adminUser._id,
          status: { isActive: true, isApproved: true, isPublic: true }
        });
        await question.save();
        console.log(`✅ Created question: ${question.title}`);
      }
    }

    console.log('🎉 Data population completed successfully!');

  } catch (error) {
    console.error('❌ Error populating data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
if (require.main === module) {
  populateData();
}

module.exports = populateData; 