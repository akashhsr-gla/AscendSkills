const mongoose = require('mongoose');
const InterviewCategory = require('./models/InterviewCategory');
const Question = require('./models/Question');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ascend-skills')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function createInterviewCategories() {
  try {
    // Get admin user
    const adminUser = await User.findOne({ email: 'admin@ascendskills.com' });
    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }

    console.log('Creating interview categories...');

    // 1. MAIN CATEGORIES (already exist, but let's update them)
    const mainCategories = [
      {
        name: 'technical',
        displayName: 'Technical Interview',
        description: 'Comprehensive technical programming and coding questions',
        icon: 'Code',
        type: 'main',
        color: 'blue',
        sortOrder: 1
      },
      {
        name: 'behavioral',
        displayName: 'Behavioral Interview',
        description: 'Behavioral and situational questions to assess soft skills',
        icon: 'Users',
        type: 'main',
        color: 'green',
        sortOrder: 2
      },
      {
        name: 'system-design',
        displayName: 'System Design',
        description: 'System architecture and design questions',
        icon: 'Brain',
        type: 'main',
        color: 'purple',
        sortOrder: 3
      }
    ];

    // 2. SUBJECTIVE CATEGORIES
    const subjectiveCategories = [
      {
        name: 'data-structures-subjective',
        displayName: 'Data Structures & Algorithms',
        description: 'In-depth questions on data structures and algorithmic thinking',
        icon: 'Target',
        type: 'subjective',
        color: 'orange',
        sortOrder: 4
      },
      {
        name: 'database-subjective',
        displayName: 'Database Systems',
        description: 'Database design, SQL, and data modeling questions',
        icon: 'BarChart3',
        type: 'subjective',
        color: 'indigo',
        sortOrder: 5
      },
      {
        name: 'networking-subjective',
        displayName: 'Computer Networking',
        description: 'Network protocols, architecture, and communication',
        icon: 'Zap',
        type: 'subjective',
        color: 'cyan',
        sortOrder: 6
      },
      {
        name: 'operating-systems-subjective',
        displayName: 'Operating Systems',
        description: 'OS concepts, processes, memory management',
        icon: 'Settings',
        type: 'subjective',
        color: 'gray',
        sortOrder: 7
      },
      {
        name: 'software-engineering-subjective',
        displayName: 'Software Engineering',
        description: 'Software development practices and methodologies',
        icon: 'Code',
        type: 'subjective',
        color: 'blue',
        sortOrder: 8
      }
    ];

    // 3. INDIVIDUAL CATEGORIES
    const individualCategories = [
      {
        name: 'arrays-individual',
        displayName: 'Arrays & Strings',
        description: 'Array manipulation and string processing problems',
        icon: 'Target',
        type: 'individual',
        color: 'red',
        sortOrder: 9
      },
      {
        name: 'linked-lists-individual',
        displayName: 'Linked Lists',
        description: 'Linked list operations and algorithms',
        icon: 'Link',
        type: 'individual',
        color: 'blue',
        sortOrder: 10
      },
      {
        name: 'trees-individual',
        displayName: 'Trees & Graphs',
        description: 'Tree and graph traversal algorithms',
        icon: 'GitBranch',
        type: 'individual',
        color: 'green',
        sortOrder: 11
      },
      {
        name: 'dynamic-programming-individual',
        displayName: 'Dynamic Programming',
        description: 'DP problems and optimization techniques',
        icon: 'TrendingUp',
        type: 'individual',
        color: 'purple',
        sortOrder: 12
      },
      {
        name: 'sorting-individual',
        displayName: 'Sorting & Searching',
        description: 'Sorting algorithms and search techniques',
        icon: 'ArrowUpDown',
        type: 'individual',
        color: 'yellow',
        sortOrder: 13
      }
    ];

    // 4. COMPANY CATEGORIES
    const companyCategories = [
      {
        name: 'google-company',
        displayName: 'Google Interview Prep',
        description: 'Google-specific interview questions and patterns',
        icon: 'Building2',
        type: 'company',
        color: 'red',
        sortOrder: 14,
        company: {
          isCompanySpecific: true,
          companyName: 'Google',
          difficulty: 'Hard'
        }
      },
      {
        name: 'microsoft-company',
        displayName: 'Microsoft Interview Prep',
        description: 'Microsoft-specific technical and behavioral questions',
        icon: 'Building2',
        type: 'company',
        color: 'blue',
        sortOrder: 15,
        company: {
          isCompanySpecific: true,
          companyName: 'Microsoft',
          difficulty: 'Medium'
        }
      },
      {
        name: 'amazon-company',
        displayName: 'Amazon Interview Prep',
        description: 'Amazon leadership principles and technical questions',
        icon: 'Building2',
        type: 'company',
        color: 'orange',
        sortOrder: 16,
        company: {
          isCompanySpecific: true,
          companyName: 'Amazon',
          difficulty: 'Hard'
        }
      },
      {
        name: 'meta-company',
        displayName: 'Meta Interview Prep',
        description: 'Meta/Facebook interview questions and system design',
        icon: 'Building2',
        type: 'company',
        color: 'blue',
        sortOrder: 17,
        company: {
          isCompanySpecific: true,
          companyName: 'Meta',
          difficulty: 'Hard'
        }
      },
      {
        name: 'apple-company',
        displayName: 'Apple Interview Prep',
        description: 'Apple-specific technical and design questions',
        icon: 'Building2',
        type: 'company',
        color: 'gray',
        sortOrder: 18,
        company: {
          isCompanySpecific: true,
          companyName: 'Apple',
          difficulty: 'Medium'
        }
      }
    ];

    // Combine all categories
    const allCategories = [
      ...mainCategories,
      ...subjectiveCategories,
      ...individualCategories,
      ...companyCategories
    ];

    // Create or update categories
    for (const categoryData of allCategories) {
      const existingCategory = await InterviewCategory.findOne({ name: categoryData.name });
      
      if (existingCategory) {
        console.log(`Updating existing category: ${categoryData.name}`);
        Object.assign(existingCategory, categoryData, { createdBy: adminUser._id });
        await existingCategory.save();
      } else {
        console.log(`Creating new category: ${categoryData.name}`);
        const newCategory = new InterviewCategory({
          ...categoryData,
          createdBy: adminUser._id
        });
        await newCategory.save();
      }
    }

    // Create sample questions for each category
    console.log('Creating sample questions...');

    const sampleQuestions = [
      // Technical Questions
      {
        title: 'Reverse a String',
        content: 'Write a function to reverse a string in-place.',
        type: 'technical',
        category: 'technical',
        difficulty: 'easy',
        expectedDuration: 300
      },
      {
        title: 'Find Missing Number',
        content: 'Given an array containing n distinct numbers taken from 0, 1, 2, ..., n, find the one that is missing from the array.',
        type: 'technical',
        category: 'technical',
        difficulty: 'medium',
        expectedDuration: 600
      },
      {
        title: 'Valid Parentheses',
        content: 'Given a string containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
        type: 'technical',
        category: 'technical',
        difficulty: 'easy',
        expectedDuration: 450
      },

      // Behavioral Questions
      {
        title: 'Tell me about yourself',
        content: 'Walk me through your background and experience.',
        type: 'behavioral',
        category: 'behavioral',
        difficulty: 'easy',
        expectedDuration: 300
      },
      {
        title: 'Handle a difficult situation',
        content: 'Describe a challenging situation you faced at work and how you resolved it.',
        type: 'behavioral',
        category: 'behavioral',
        difficulty: 'medium',
        expectedDuration: 600
      },
      {
        title: 'Team conflict resolution',
        content: 'Tell me about a time when you had a conflict with a team member and how you resolved it.',
        type: 'behavioral',
        category: 'behavioral',
        difficulty: 'medium',
        expectedDuration: 600
      },

      // System Design Questions
      {
        title: 'Design a URL Shortener',
        content: 'Design a URL shortening service like bit.ly.',
        type: 'system_design',
        category: 'system-design',
        difficulty: 'medium',
        expectedDuration: 1800
      },
      {
        title: 'Design a Chat System',
        content: 'Design a real-time chat system like WhatsApp or Slack.',
        type: 'system_design',
        category: 'system-design',
        difficulty: 'hard',
        expectedDuration: 2400
      },

      // Data Structures Questions
      {
        title: 'Implement Stack',
        content: 'Implement a stack data structure with push, pop, and peek operations.',
        type: 'technical',
        category: 'data-structures-subjective',
        difficulty: 'easy',
        expectedDuration: 450
      },
      {
        title: 'Binary Tree Traversal',
        content: 'Implement inorder, preorder, and postorder traversal of a binary tree.',
        type: 'technical',
        category: 'data-structures-subjective',
        difficulty: 'medium',
        expectedDuration: 900
      },

      // Database Questions
      {
        title: 'Database Normalization',
        content: 'Explain the different normal forms in database design and when to use them.',
        type: 'technical',
        category: 'database-subjective',
        difficulty: 'medium',
        expectedDuration: 600
      },
      {
        title: 'SQL Joins',
        content: 'Explain the different types of SQL joins with examples.',
        type: 'technical',
        category: 'database-subjective',
        difficulty: 'easy',
        expectedDuration: 450
      },

      // Individual Topic Questions
      {
        title: 'Two Sum',
        content: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        type: 'technical',
        category: 'arrays-individual',
        difficulty: 'easy',
        expectedDuration: 600
      },
      {
        title: 'Reverse Linked List',
        content: 'Reverse a singly linked list.',
        type: 'technical',
        category: 'linked-lists-individual',
        difficulty: 'easy',
        expectedDuration: 450
      },

      // Company-specific Questions
      {
        title: 'Google: Design Search Engine',
        content: 'Design a search engine like Google. Consider scalability, indexing, and ranking algorithms.',
        type: 'system_design',
        category: 'google-company',
        difficulty: 'hard',
        expectedDuration: 2400
      },
      {
        title: 'Microsoft: Implement Word',
        content: 'Design a word processor like Microsoft Word. Focus on document editing and formatting.',
        type: 'system_design',
        category: 'microsoft-company',
        difficulty: 'hard',
        expectedDuration: 2400
      },
      {
        title: 'Amazon: Leadership Principle',
        content: 'Tell me about a time when you demonstrated the leadership principle "Customer Obsession".',
        type: 'behavioral',
        category: 'amazon-company',
        difficulty: 'medium',
        expectedDuration: 600
      }
    ];

    // Create questions
    for (const questionData of sampleQuestions) {
      const existingQuestion = await Question.findOne({ 
        title: questionData.title,
        category: questionData.category
      });
      
      if (!existingQuestion) {
        console.log(`Creating question: ${questionData.title}`);
        const newQuestion = new Question({
          ...questionData,
          createdBy: adminUser._id
        });
        await newQuestion.save();
      }
    }

    // Update statistics for all categories
    console.log('Updating category statistics...');
    const categories = await InterviewCategory.find({});
    for (const category of categories) {
      await category.updateStatistics();
    }

    console.log('Interview categories and questions created successfully!');
    
    // Display summary
    const categorySummary = await InterviewCategory.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    console.log('\nCategory Summary:');
    categorySummary.forEach(summary => {
      console.log(`${summary._id}: ${summary.count} categories`);
    });

    const questionSummary = await Question.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    console.log('\nQuestions per category:');
    questionSummary.forEach(summary => {
      console.log(`${summary._id}: ${summary.count} questions`);
    });

  } catch (error) {
    console.error('Error creating interview categories:', error);
  } finally {
    mongoose.connection.close();
  }
}

createInterviewCategories(); 