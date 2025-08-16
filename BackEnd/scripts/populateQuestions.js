const mongoose = require('mongoose');
const Question = require('../models/Question');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ascend_skills', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const defaultQuestions = [
  // ==================== BEHAVIORAL QUESTIONS ====================
  {
    title: "Tell me about yourself and your background",
    content: "Give me a brief overview of your professional background, education, and what brings you to this role.",
    type: "behavioral",
    category: "behavioral",
    subcategory: "introduction",
    difficulty: "easy",
    interview: {
      expectedDuration: 120,
      followUpQuestions: [
        "What specific aspect of your background makes you most qualified for this role?",
        "How do your past experiences align with our company's mission?",
        "What's the most important lesson you've learned in your career so far?"
      ],
      evaluationCriteria: [
        { criterion: "Clarity of communication", weight: 3, description: "How well the candidate articulates their background" },
        { criterion: "Relevance to role", weight: 4, description: "How well their background matches the position" },
        { criterion: "Professional presentation", weight: 3, description: "Overall professional demeanor" }
      ],
      sampleAnswers: [
        { 
          answer: "I'm a software engineer with 3 years of experience in full-stack development. I graduated with a CS degree and have worked primarily with React and Node.js. I'm passionate about creating user-focused applications and am looking to join a team where I can contribute to meaningful projects while continuing to grow my skills.",
          score: 8,
          feedback: "Good structure, mentions relevant experience and shows enthusiasm for growth"
        }
      ],
      isVoiceBased: true,
      requiresVideo: true
    }
  },
  {
    title: "Describe a challenging project you worked on",
    content: "Tell me about a particularly challenging project you've worked on. What made it challenging, and how did you overcome those challenges?",
    type: "behavioral",
    category: "behavioral",
    subcategory: "problem_solving",
    difficulty: "medium",
    interview: {
      expectedDuration: 180,
      followUpQuestions: [
        "What specific actions did you take to address the challenges?",
        "How did you measure the success of your solution?",
        "What would you do differently if you faced this challenge again?"
      ],
      evaluationCriteria: [
        { criterion: "Problem identification", weight: 3, description: "Ability to clearly identify the core challenges" },
        { criterion: "Solution approach", weight: 4, description: "Quality and creativity of the solution" },
        { criterion: "Results achieved", weight: 3, description: "Tangible outcomes and impact" }
      ],
      isVoiceBased: true,
      requiresVideo: true
    }
  },
  {
    title: "Why are you interested in this position and our company?",
    content: "What specifically interests you about this role and our company? How does it align with your career goals?",
    type: "behavioral",
    category: "behavioral",
    subcategory: "motivation",
    difficulty: "easy",
    interview: {
      expectedDuration: 120,
      followUpQuestions: [
        "What research have you done about our company?",
        "How do you see yourself contributing to our team's goals?",
        "What aspects of our company culture appeal to you most?"
      ],
      evaluationCriteria: [
        { criterion: "Company knowledge", weight: 4, description: "Understanding of company and role" },
        { criterion: "Alignment with goals", weight: 3, description: "How well the role fits their career aspirations" },
        { criterion: "Genuine interest", weight: 3, description: "Authenticity of their motivation" }
      ],
      isVoiceBased: true,
      requiresVideo: true
    }
  },
  {
    title: "Tell me about a time you had to work with a difficult team member",
    content: "Describe a situation where you had to collaborate with someone who was difficult to work with. How did you handle it?",
    type: "behavioral",
    category: "behavioral",
    subcategory: "teamwork",
    difficulty: "medium",
    interview: {
      expectedDuration: 180,
      followUpQuestions: [
        "What specific strategies did you use to improve the working relationship?",
        "How did you ensure the project's success despite the challenges?",
        "What did you learn from this experience?"
      ],
      evaluationCriteria: [
        { criterion: "Conflict resolution", weight: 4, description: "Ability to handle interpersonal conflicts" },
        { criterion: "Professional approach", weight: 3, description: "Maintaining professionalism under pressure" },
        { criterion: "Team collaboration", weight: 3, description: "Focus on team success over individual conflicts" }
      ],
      isVoiceBased: true,
      requiresVideo: true
    }
  },
  {
    title: "Describe a time when you had to learn something new quickly",
    content: "Tell me about a situation where you had to quickly learn a new skill, technology, or process. How did you approach it?",
    type: "behavioral",
    category: "behavioral",
    subcategory: "adaptability",
    difficulty: "medium",
    interview: {
      expectedDuration: 150,
      followUpQuestions: [
        "What specific learning strategies did you use?",
        "How quickly were you able to become proficient?",
        "How do you typically approach learning new technologies?"
      ],
      evaluationCriteria: [
        { criterion: "Learning agility", weight: 4, description: "Speed and effectiveness of learning new concepts" },
        { criterion: "Resource utilization", weight: 3, description: "Ability to find and use learning resources" },
        { criterion: "Application", weight: 3, description: "Successfully applying newly learned skills" }
      ],
      isVoiceBased: true,
      requiresVideo: true
    }
  },

  // ==================== TECHNICAL QUESTIONS ====================
  {
    title: "Explain the concept of RESTful APIs",
    content: "What are RESTful APIs? Explain the key principles and benefits of REST architecture.",
    type: "open_ended",
    category: "technical_aptitude",
    subcategory: "web_development",
    difficulty: "medium",
    interview: {
      expectedDuration: 180,
      followUpQuestions: [
        "What are the different HTTP methods and when would you use each?",
        "How would you handle authentication in a RESTful API?",
        "What's the difference between REST and GraphQL?"
      ],
      evaluationCriteria: [
        { criterion: "Technical accuracy", weight: 4, description: "Correctness of technical explanations" },
        { criterion: "Depth of knowledge", weight: 3, description: "Understanding of underlying concepts" },
        { criterion: "Real-world application", weight: 3, description: "Ability to relate to practical scenarios" }
      ],
      isVoiceBased: true,
      requiresVideo: false
    }
  },
  {
    title: "What is the difference between SQL and NoSQL databases?",
    content: "Compare and contrast SQL and NoSQL databases. When would you choose one over the other?",
    type: "open_ended",
    category: "database",
    subcategory: "database_design",
    difficulty: "medium",
    interview: {
      expectedDuration: 200,
      followUpQuestions: [
        "Can you give examples of specific SQL and NoSQL databases?",
        "How would you handle data consistency in NoSQL databases?",
        "What factors would influence your choice between SQL and NoSQL for a project?"
      ],
      evaluationCriteria: [
        { criterion: "Understanding of concepts", weight: 4, description: "Clear understanding of both database types" },
        { criterion: "Use case knowledge", weight: 3, description: "Knowing when to use each type" },
        { criterion: "Practical examples", weight: 3, description: "Providing relevant examples" }
      ],
      isVoiceBased: true,
      requiresVideo: false
    }
  },
  {
    title: "Explain JavaScript closures with an example",
    content: "What are closures in JavaScript? Provide an example and explain how they work.",
    type: "open_ended",
    category: "javascript",
    subcategory: "core_concepts",
    difficulty: "medium",
    interview: {
      expectedDuration: 180,
      followUpQuestions: [
        "What are some practical use cases for closures?",
        "How do closures relate to scope in JavaScript?",
        "Can you explain the concept of lexical scoping?"
      ],
      evaluationCriteria: [
        { criterion: "Concept understanding", weight: 4, description: "Clear understanding of closures" },
        { criterion: "Code examples", weight: 3, description: "Ability to provide working examples" },
        { criterion: "Use cases", weight: 3, description: "Understanding practical applications" }
      ],
      isVoiceBased: true,
      requiresVideo: false
    }
  },

  // ==================== SYSTEM DESIGN QUESTIONS ====================
  {
    title: "Design a URL shortener like bit.ly",
    content: "Design a URL shortening service similar to bit.ly. Consider scalability, performance, and key features.",
    type: "system_design",
    category: "system_design",
    subcategory: "distributed_systems",
    difficulty: "hard",
    systemDesign: {
      requirements: [
        "Shorten long URLs to unique short URLs",
        "Redirect short URLs to original URLs",
        "Handle high traffic (millions of requests per day)",
        "Provide analytics on link usage",
        "Custom short URLs for premium users"
      ],
      constraints: [
        "Handle 100 million URLs per day",
        "Read-heavy system (100:1 read/write ratio)",
        "Links should not be easily guessable",
        "Service should be highly available"
      ],
      estimations: [
        "Storage: Estimate data storage requirements",
        "Bandwidth: Calculate network bandwidth needs",
        "Memory: Estimate caching requirements"
      ],
      evaluationPoints: [
        { point: "Database design", weight: 4 },
        { point: "Scalability approach", weight: 4 },
        { point: "Caching strategy", weight: 3 },
        { point: "Security considerations", weight: 3 }
      ]
    },
    interview: {
      expectedDuration: 2700, // 45 minutes
      followUpQuestions: [
        "How would you handle cache invalidation?",
        "What would you do if a short URL becomes viral?",
        "How would you implement analytics without affecting performance?"
      ],
      isVoiceBased: true,
      requiresVideo: true
    }
  },
  {
    title: "Design a chat application like WhatsApp",
    content: "Design a real-time chat application that supports one-on-one and group messaging. Consider scalability and real-time features.",
    type: "system_design",
    category: "system_design",
    subcategory: "real_time_systems",
    difficulty: "hard",
    systemDesign: {
      requirements: [
        "One-on-one messaging",
        "Group chat functionality",
        "Real-time message delivery",
        "Message history storage",
        "Online/offline status",
        "Push notifications"
      ],
      constraints: [
        "Support 1 billion users",
        "Handle 50 billion messages per day",
        "Messages should be delivered within 100ms",
        "System should be highly available"
      ],
      estimations: [
        "Storage: Message and user data requirements",
        "Bandwidth: Real-time messaging traffic",
        "Connections: Concurrent WebSocket connections"
      ],
      evaluationPoints: [
        { point: "Real-time communication", weight: 4 },
        { point: "Database design", weight: 3 },
        { point: "Scalability approach", weight: 4 },
        { point: "Push notification system", weight: 3 }
      ]
    },
    interview: {
      expectedDuration: 2700, // 45 minutes
      followUpQuestions: [
        "How would you ensure message delivery in case of network failures?",
        "How would you implement end-to-end encryption?",
        "How would you handle message ordering in group chats?"
      ],
      isVoiceBased: true,
      requiresVideo: true
    }
  },

  // ==================== CODING QUESTIONS ====================
  {
    title: "Two Sum Problem",
    content: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    type: "coding",
    category: "algorithms",
    subcategory: "array_problems",
    difficulty: "easy",
    coding: {
      problemDescription: "Find two numbers in an array that add up to a target value and return their indices.",
      inputFormat: "nums: array of integers, target: integer",
      outputFormat: "Array of two indices",
      constraints: [
        "2 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9",
        "-10^9 <= target <= 10^9",
        "Only one valid answer exists"
      ],
      examples: [
        {
          input: "nums = [2,7,11,15], target = 9",
          output: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]"
        },
        {
          input: "nums = [3,2,4], target = 6",
          output: "[1,2]",
          explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]"
        }
      ],
      testCases: [
        { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isHidden: false, points: 1 },
        { input: "[3,2,4], 6", expectedOutput: "[1,2]", isHidden: false, points: 1 },
        { input: "[3,3], 6", expectedOutput: "[0,1]", isHidden: true, points: 2 }
      ],
      starterCode: [
        {
          language: "javascript",
          code: "function twoSum(nums, target) {\n    // Your code here\n    \n}"
        },
        {
          language: "python",
          code: "def two_sum(nums, target):\n    # Your code here\n    pass"
        }
      ],
      solution: [
        {
          language: "javascript",
          code: "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}",
          explanation: "Use a hash map to store numbers and their indices. For each number, check if its complement exists in the map.",
          complexity: { time: "O(n)", space: "O(n)" }
        }
      ],
      tags: ["Array", "Hash Table"],
      hints: [
        "Think about what complement you need for each number",
        "Consider using a hash map to store previously seen numbers",
        "You only need to iterate through the array once"
      ],
      timeLimit: 5000,
      memoryLimit: 256
    },
    interview: {
      expectedDuration: 900, // 15 minutes
      followUpQuestions: [
        "What's the time and space complexity of your solution?",
        "How would you modify this for three sum?",
        "What if the array was sorted?"
      ],
      isVoiceBased: true,
      requiresVideo: false
    }
  },
  {
    title: "Reverse a Linked List",
    content: "Given the head of a singly linked list, reverse the list and return the reversed list.",
    type: "coding",
    category: "data_structures",
    subcategory: "linked_lists",
    difficulty: "easy",
    coding: {
      problemDescription: "Reverse a singly linked list iteratively or recursively.",
      inputFormat: "head: ListNode - head of the linked list",
      outputFormat: "ListNode - head of the reversed linked list",
      constraints: [
        "The number of nodes in the list is in the range [0, 5000]",
        "-5000 <= Node.val <= 5000"
      ],
      examples: [
        {
          input: "head = [1,2,3,4,5]",
          output: "[5,4,3,2,1]",
          explanation: "The linked list is reversed"
        },
        {
          input: "head = [1,2]",
          output: "[2,1]",
          explanation: "Simple two-node reversal"
        }
      ],
      testCases: [
        { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]", isHidden: false, points: 2 },
        { input: "[]", expectedOutput: "[]", isHidden: true, points: 1 },
        { input: "[1]", expectedOutput: "[1]", isHidden: true, points: 1 }
      ],
      starterCode: [
        {
          language: "javascript",
          code: "function reverseList(head) {\n    // Your code here\n    \n}"
        }
      ],
      tags: ["Linked List", "Recursion"],
      hints: [
        "Keep track of the previous, current, and next nodes",
        "Think about what happens to the pointers",
        "Consider both iterative and recursive approaches"
      ],
      timeLimit: 3000,
      memoryLimit: 256
    },
    interview: {
      expectedDuration: 900,
      followUpQuestions: [
        "Can you implement this recursively?",
        "What's the space complexity of each approach?",
        "How would you reverse only a portion of the list?"
      ],
      isVoiceBased: true,
      requiresVideo: false
    }
  }
];

async function populateQuestions() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Create or find a default admin user for createdBy field
    console.log('Creating/finding admin user...');
    let adminUser = await User.findOne({ email: 'admin@ascendskills.com' });
    
    if (!adminUser) {
      adminUser = new User({
        name: 'System Admin',
        email: 'admin@ascendskills.com',
        password: '$2a$12$defaultHashedPassword', // This should be properly hashed in production
        role: 'admin',
        isVerified: true,
        status: 'active'
      });
      await adminUser.save();
      console.log('Created admin user for question creation');
    }
    
    // Add createdBy field to all questions
    const questionsWithCreator = defaultQuestions.map(question => ({
      ...question,
      createdBy: adminUser._id,
      status: {
        isActive: true,
        isApproved: true,
        isPublic: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      }
    }));
    
    // Clear existing questions (optional - comment out to keep existing)
    console.log('Clearing existing questions...');
    await Question.deleteMany({});
    
    console.log('Inserting default questions...');
    const insertedQuestions = await Question.insertMany(questionsWithCreator);
    
    console.log(`Successfully inserted ${insertedQuestions.length} questions:`);
    insertedQuestions.forEach((q, index) => {
      console.log(`${index + 1}. ${q.title} (${q.category}/${q.type})`);
    });
    
    // Create indexes for better performance
    console.log('Creating indexes...');
    await Question.createIndexes();
    
    console.log('Question population completed successfully!');
    
  } catch (error) {
    console.error('Error populating questions:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the script
if (require.main === module) {
  populateQuestions();
}

module.exports = { populateQuestions, defaultQuestions }; 