const mongoose = require('mongoose');
const InterviewCategory = require('../models/InterviewCategory');
const Question = require('../models/Question');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ascendskills';

const sampleCategories = [
  {
    name: 'general-interview',
    displayName: 'General Interview',
    description: 'Comprehensive interview covering behavioral, technical, and system design questions',
    icon: 'BookOpen',
    color: 'blue',
    type: 'main',
    statistics: {
      totalQuestions: 25,
      easyQuestions: 8,
      mediumQuestions: 12,
      hardQuestions: 5,
      averageDifficulty: 2.8
    },
    interviewConfig: {
      defaultDuration: 300,
      questionCount: 5,
      allowFollowUps: true,
      enableVoiceRecording: true,
      enableVideoRecording: false
    },
    status: {
      isActive: true,
      isPublic: true,
      isFeatured: true,
      sortOrder: 1
    },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    name: 'behavioral',
    displayName: 'Behavioral Questions',
    description: 'Questions about your experience, leadership, and problem-solving approach',
    icon: 'Users',
    color: 'blue',
    type: 'subjective',
    statistics: {
      totalQuestions: 15,
      easyQuestions: 5,
      mediumQuestions: 7,
      hardQuestions: 3,
      averageDifficulty: 2.5
    },
    interviewConfig: {
      defaultDuration: 300,
      questionCount: 5,
      allowFollowUps: true,
      enableVoiceRecording: true,
      enableVideoRecording: false
    },
    status: {
      isActive: true,
      isPublic: true,
      isFeatured: true,
      sortOrder: 2
    },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    name: 'technical',
    displayName: 'Technical Questions',
    description: 'Programming concepts, algorithms, and system design questions',
    icon: 'Code',
    color: 'green',
    type: 'subjective',
    statistics: {
      totalQuestions: 20,
      easyQuestions: 6,
      mediumQuestions: 10,
      hardQuestions: 4,
      averageDifficulty: 3.0
    },
    interviewConfig: {
      defaultDuration: 300,
      questionCount: 5,
      allowFollowUps: true,
      enableVoiceRecording: true,
      enableVideoRecording: false
    },
    status: {
      isActive: true,
      isPublic: true,
      isFeatured: true,
      sortOrder: 3
    },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    name: 'system-design',
    displayName: 'System Design',
    description: 'Design scalable systems and architecture questions',
    icon: 'Brain',
    color: 'purple',
    type: 'subjective',
    statistics: {
      totalQuestions: 10,
      easyQuestions: 2,
      mediumQuestions: 5,
      hardQuestions: 3,
      averageDifficulty: 3.5
    },
    interviewConfig: {
      defaultDuration: 600,
      questionCount: 3,
      allowFollowUps: true,
      enableVoiceRecording: true,
      enableVideoRecording: false
    },
    status: {
      isActive: true,
      isPublic: true,
      isFeatured: true,
      sortOrder: 4
    },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    name: 'javascript',
    displayName: 'JavaScript Fundamentals',
    description: 'Core JavaScript concepts, ES6+, and modern development practices',
    icon: 'Code',
    color: 'yellow',
    type: 'individual',
    statistics: {
      totalQuestions: 12,
      easyQuestions: 4,
      mediumQuestions: 6,
      hardQuestions: 2,
      averageDifficulty: 2.8
    },
    interviewConfig: {
      defaultDuration: 300,
      questionCount: 5,
      allowFollowUps: true,
      enableVoiceRecording: true,
      enableVideoRecording: false
    },
    status: {
      isActive: true,
      isPublic: true,
      isFeatured: false,
      sortOrder: 5
    },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    name: 'react',
    displayName: 'React Development',
    description: 'React hooks, components, state management, and best practices',
    icon: 'Code',
    color: 'blue',
    type: 'individual',
    statistics: {
      totalQuestions: 10,
      easyQuestions: 3,
      mediumQuestions: 5,
      hardQuestions: 2,
      averageDifficulty: 3.2
    },
    interviewConfig: {
      defaultDuration: 300,
      questionCount: 5,
      allowFollowUps: true,
      enableVoiceRecording: true,
      enableVideoRecording: false
    },
    status: {
      isActive: true,
      isPublic: true,
      isFeatured: false,
      sortOrder: 6
    },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    name: 'google-interview',
    displayName: 'Google Interview Prep',
    description: 'Google-specific interview questions and preparation',
    icon: 'Building2',
    color: 'red',
    type: 'company',
    company: {
      companyId: null,
      isCompanySpecific: true,
      companyName: 'Google',
      companyLogo: '🟢',
      difficulty: 'Hard'
    },
    statistics: {
      totalQuestions: 18,
      easyQuestions: 3,
      mediumQuestions: 8,
      hardQuestions: 7,
      averageDifficulty: 3.8
    },
    interviewConfig: {
      defaultDuration: 300,
      questionCount: 5,
      allowFollowUps: true,
      enableVoiceRecording: true,
      enableVideoRecording: false
    },
    status: {
      isActive: true,
      isPublic: true,
      isFeatured: true,
      sortOrder: 7
    },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    name: 'microsoft-interview',
    displayName: 'Microsoft Interview Prep',
    description: 'Microsoft-specific interview questions and preparation',
    icon: 'Building2',
    color: 'blue',
    type: 'company',
    company: {
      companyId: null,
      isCompanySpecific: true,
      companyName: 'Microsoft',
      companyLogo: '🔵',
      difficulty: 'Medium'
    },
    statistics: {
      totalQuestions: 15,
      easyQuestions: 4,
      mediumQuestions: 8,
      hardQuestions: 3,
      averageDifficulty: 3.2
    },
    interviewConfig: {
      defaultDuration: 300,
      questionCount: 5,
      allowFollowUps: true,
      enableVoiceRecording: true,
      enableVideoRecording: false
    },
    status: {
      isActive: true,
      isPublic: true,
      isFeatured: true,
      sortOrder: 8
    },
    createdBy: new mongoose.Types.ObjectId()
  }
];

const sampleQuestions = [
  // Behavioral Questions
  {
    title: 'Tell me about yourself',
    content: 'Walk me through your background and what brings you to this role.',
    type: 'behavioral',
    category: 'behavioral',
    difficulty: 'easy',
    expectedDuration: 300,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    title: 'Describe a challenging project',
    content: 'Tell me about a time when you had to work on a challenging project. How did you approach it?',
    type: 'behavioral',
    category: 'behavioral',
    difficulty: 'medium',
    expectedDuration: 300,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    title: 'Leadership experience',
    content: 'Describe a situation where you had to lead a team through a difficult situation.',
    type: 'behavioral',
    category: 'behavioral',
    difficulty: 'medium',
    expectedDuration: 300,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    title: 'Conflict resolution',
    content: 'Tell me about a time when you had a conflict with a team member. How did you resolve it?',
    type: 'behavioral',
    category: 'behavioral',
    difficulty: 'medium',
    expectedDuration: 300,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    title: 'Greatest weakness',
    content: 'What would you say is your greatest weakness and how are you working to improve it?',
    type: 'behavioral',
    category: 'behavioral',
    difficulty: 'hard',
    expectedDuration: 300,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  },

  // Technical Questions
  {
    title: 'Explain closures in JavaScript',
    content: 'What are closures in JavaScript and how do they work? Provide an example.',
    type: 'technical',
    category: 'technical',
    difficulty: 'medium',
    expectedDuration: 300,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    title: 'Binary search implementation',
    content: 'Implement binary search algorithm and explain its time complexity.',
    type: 'technical',
    category: 'technical',
    difficulty: 'medium',
    expectedDuration: 300,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    title: 'React component lifecycle',
    content: 'Explain the React component lifecycle methods and when you would use each.',
    type: 'technical',
    category: 'technical',
    difficulty: 'medium',
    expectedDuration: 300,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    title: 'Database normalization',
    content: 'Explain database normalization and the different normal forms.',
    type: 'technical',
    category: 'technical',
    difficulty: 'hard',
    expectedDuration: 300,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    title: 'API design principles',
    content: 'What are the key principles of good REST API design?',
    type: 'technical',
    category: 'technical',
    difficulty: 'medium',
    expectedDuration: 300,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  },

  // System Design Questions
  {
    title: 'Design a URL shortener',
    content: 'Design a URL shortening service like bit.ly. Consider scalability, reliability, and performance.',
    type: 'system_design',
    category: 'system-design',
    difficulty: 'hard',
    expectedDuration: 600,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    title: 'Design a chat application',
    content: 'Design a real-time chat application that can support millions of users.',
    type: 'system_design',
    category: 'system-design',
    difficulty: 'hard',
    expectedDuration: 600,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    title: 'Design a caching system',
    content: 'Design a distributed caching system. Discuss cache eviction policies and consistency.',
    type: 'system_design',
    category: 'system-design',
    difficulty: 'hard',
    expectedDuration: 600,
    status: { isActive: true },
    createdBy: new mongoose.Types.ObjectId()
  }
];

async function populateData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await InterviewCategory.deleteMany({});
    await Question.deleteMany({});
    console.log('Cleared existing data');

    // Insert categories
    const insertedCategories = await InterviewCategory.insertMany(sampleCategories);
    console.log(`Inserted ${insertedCategories.length} categories`);

    // Insert questions
    const insertedQuestions = await Question.insertMany(sampleQuestions);
    console.log(`Inserted ${insertedQuestions.length} questions`);

    console.log('Sample data populated successfully!');
  } catch (error) {
    console.error('Error populating data:', error);
  } finally {
    await mongoose.connection.close();
  }
}

populateData();