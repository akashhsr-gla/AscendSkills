const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const Interview = require('../models/Interview');
const Company = require('../models/Company');
const Session = require('../models/Session');

// Test database setup
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ascend_skills_test';

describe('Ascend Skills API', () => {
  let server;
  let adminToken;
  let studentToken;
  let companyToken;
  let adminUser;
  let studentUser;
  let companyUser;
  let testCompany;
  let testQuestion;
  let testQuiz;
  let testInterview;
  let testSession;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Clear test database
    await User.deleteMany({});
    await Question.deleteMany({});
    await Quiz.deleteMany({});
    await Interview.deleteMany({});
    await Company.deleteMany({});
    await Session.deleteMany({});

    // Create test server
    server = app.listen(0);
  });

  afterAll(async () => {
    // Close server and database connection
    await server.close();
    await mongoose.connection.close();
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new student user', async () => {
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          role: 'student',
          phone: '+1234567890',
          college: 'Test University',
          degree: 'Computer Science',
          yearOfCompletion: 2025
        };

        const response = await request(server)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('userId');
        expect(response.body.data.email).toBe(userData.email);
      });

      it('should register a new admin user', async () => {
        const userData = {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'AdminPass123!',
          role: 'admin'
        };

        const response = await request(server)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        adminUser = await User.findOne({ email: userData.email });
        adminUser.status.isEmailVerified = true;
        await adminUser.save();
      });

      it('should register a new company user', async () => {
        const userData = {
          name: 'Company User',
          email: 'company@example.com',
          password: 'CompanyPass123!',
          role: 'company'
        };

        const response = await request(server)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        companyUser = await User.findOne({ email: userData.email });
        companyUser.status.isEmailVerified = true;
        await companyUser.save();
      });

      it('should reject registration with invalid email', async () => {
        const userData = {
          name: 'Invalid User',
          email: 'invalid-email',
          password: 'Password123!',
          role: 'student'
        };

        const response = await request(server)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });

      it('should reject registration with weak password', async () => {
        const userData = {
          name: 'Weak Password User',
          email: 'weak@example.com',
          password: 'weak',
          role: 'student'
        };

        const response = await request(server)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login admin user', async () => {
        const loginData = {
          email: 'admin@example.com',
          password: 'AdminPass123!'
        };

        const response = await request(server)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        adminToken = response.body.data.token;
      });

      it('should login student user', async () => {
        // First verify the student user
        studentUser = await User.findOne({ email: 'john@example.com' });
        studentUser.status.isEmailVerified = true;
        await studentUser.save();

        const loginData = {
          email: 'john@example.com',
          password: 'Password123!'
        };

        const response = await request(server)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        studentToken = response.body.data.token;
      });

      it('should login company user', async () => {
        const loginData = {
          email: 'company@example.com',
          password: 'CompanyPass123!'
        };

        const response = await request(server)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        companyToken = response.body.data.token;
      });

      it('should reject login with invalid credentials', async () => {
        const loginData = {
          email: 'john@example.com',
          password: 'WrongPassword'
        };

        const response = await request(server)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/auth/profile', () => {
      it('should get user profile', async () => {
        const response = await request(server)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('name');
        expect(response.body.data).toHaveProperty('email');
      });

      it('should reject request without token', async () => {
        const response = await request(server)
          .get('/api/auth/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout user', async () => {
        const response = await request(server)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Admin Endpoints', () => {
    describe('GET /api/admin/users', () => {
      it('should get all users for admin', async () => {
        const response = await request(server)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('users');
        expect(response.body.data).toHaveProperty('pagination');
      });

      it('should reject non-admin access', async () => {
        const response = await request(server)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/admin/users', () => {
      it('should create new user', async () => {
        const userData = {
          name: 'Created User',
          email: 'created@example.com',
          password: 'CreatedPass123!',
          role: 'student'
        };

        const response = await request(server)
          .post('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('name');
      });
    });

    describe('POST /api/admin/companies', () => {
      it('should create new company', async () => {
        const companyData = {
          name: 'Test Company',
          displayName: 'Test Company Ltd',
          industry: 'Technology',
          companySize: 'medium',
          contact: {
            email: 'contact@testcompany.com',
            phone: '+1234567890'
          }
        };

        const response = await request(server)
          .post('/api/admin/companies')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(companyData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('name');
        testCompany = response.body.data;
      });
    });

    describe('GET /api/admin/analytics/dashboard', () => {
      it('should get dashboard analytics', async () => {
        const response = await request(server)
          .get('/api/admin/analytics/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('overview');
        expect(response.body.data).toHaveProperty('charts');
      });
    });
  });

  describe('Question Management', () => {
    describe('POST /api/admin/questions', () => {
      it('should create MCQ question', async () => {
        const questionData = {
          title: 'JavaScript Basics',
          content: 'What is the correct way to declare a variable in JavaScript?',
          type: 'mcq',
          category: 'javascript',
          difficulty: 'easy',
          options: [
            { text: 'var x = 5;', isCorrect: false },
            { text: 'let x = 5;', isCorrect: true },
            { text: 'const x = 5;', isCorrect: false },
            { text: 'variable x = 5;', isCorrect: false }
          ],
          metadata: {
            estimatedTime: 30,
            points: 1,
            explanation: 'let is the modern way to declare variables'
          }
        };

        const response = await request(server)
          .post('/api/admin/questions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(questionData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('title');
        testQuestion = response.body.data;
      });

      it('should create coding question', async () => {
        const questionData = {
          title: 'Two Sum Problem',
          content: 'Given an array of integers and a target sum, return indices of two numbers that add up to the target.',
          type: 'coding',
          category: 'algorithms',
          difficulty: 'medium',
          coding: {
            problemDescription: 'Find indices of two numbers that add up to target',
            inputFormat: 'Array of integers and target integer',
            outputFormat: 'Array of two indices',
            constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
            examples: [
              {
                input: '[2,7,11,15], 9',
                output: '[0,1]',
                explanation: 'nums[0] + nums[1] = 2 + 7 = 9'
              }
            ],
            testCases: [
              {
                input: '[2,7,11,15], 9',
                expectedOutput: '[0,1]',
                isHidden: false,
                points: 1
              },
              {
                input: '[3,2,4], 6',
                expectedOutput: '[1,2]',
                isHidden: true,
                points: 1
              }
            ],
            starterCode: [
              {
                language: 'javascript',
                code: 'function twoSum(nums, target) {\n    // Your solution here\n}'
              }
            ]
          }
        };

        const response = await request(server)
          .post('/api/admin/questions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(questionData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe('coding');
      });
    });

    describe('GET /api/admin/questions', () => {
      it('should get all questions', async () => {
        const response = await request(server)
          .get('/api/admin/questions')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('questions');
        expect(Array.isArray(response.body.data.questions)).toBe(true);
      });
    });
  });

  describe('Quiz Endpoints', () => {
    describe('POST /api/quiz', () => {
      it('should create a new quiz', async () => {
        const quizData = {
          title: 'JavaScript Fundamentals Quiz',
          description: 'Test your JavaScript knowledge',
          category: 'javascript',
          difficulty: 'easy',
          timeLimit: 1800,
          questionCount: 2,
          questionTypes: ['mcq'],
          passingScore: 70,
          randomOrder: true,
          negativeMarking: false,
          showResults: true,
          allowRetakes: true,
          maxAttempts: 3
        };

        const response = await request(server)
          .post('/api/quiz')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(quizData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('quiz');
        expect(response.body.data).toHaveProperty('sessionId');
        testQuiz = response.body.data.quiz;
        testSession = response.body.data.sessionId;
      });
    });

    describe('POST /api/quiz/:id/start', () => {
      it('should start a quiz', async () => {
        const response = await request(server)
          .post(`/api/quiz/${testQuiz._id}/start`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ sessionId: testSession })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('quizId');
      });
    });

    describe('POST /api/quiz/:id/answer', () => {
      it('should submit quiz answer', async () => {
        const answerData = {
          questionIndex: 0,
          answer: 'let x = 5;',
          timeTaken: 30,
          sessionId: testSession
        };

        const response = await request(server)
          .post(`/api/quiz/${testQuiz._id}/answer`)
          .set('Authorization', `Bearer ${studentToken}`)
          .set('X-Session-ID', testSession)
          .send(answerData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('isCorrect');
        expect(response.body.data).toHaveProperty('score');
      });
    });

    describe('POST /api/quiz/:id/complete', () => {
      it('should complete quiz', async () => {
        const response = await request(server)
          .post(`/api/quiz/${testQuiz._id}/complete`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ sessionId: testSession })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('score');
        expect(response.body.data).toHaveProperty('percentage');
      });
    });

    describe('GET /api/quiz/:id/results', () => {
      it('should get quiz results', async () => {
        const response = await request(server)
          .get(`/api/quiz/${testQuiz._id}/results`)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('overview');
        expect(response.body.data).toHaveProperty('questions');
      });
    });
  });

  describe('Interview Endpoints', () => {
    describe('POST /api/interview', () => {
      it('should create a new interview', async () => {
        const interviewData = {
          title: 'JavaScript Technical Interview',
          type: 'technical',
          timeLimit: 3600,
          questionCount: 3,
          difficulty: 'medium',
          enableVideo: true,
          enableAudio: true,
          enableProctoring: true,
          jobRole: 'Software Engineer',
          department: 'Engineering',
          experienceLevel: 'mid'
        };

        const response = await request(server)
          .post('/api/interview')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(interviewData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('interview');
        testInterview = response.body.data.interview;
      });
    });

    describe('POST /api/interview/:id/start', () => {
      it('should start interview', async () => {
        const response = await request(server)
          .post(`/api/interview/${testInterview._id}/start`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ sessionId: testSession })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('interviewId');
      });
    });

    describe('GET /api/interview/:id/question', () => {
      it('should get current question', async () => {
        const response = await request(server)
          .get(`/api/interview/${testInterview._id}/question`)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('question');
      });
    });
  });

  describe('Coding Endpoints', () => {
    describe('POST /api/coding/run', () => {
      it('should run JavaScript code', async () => {
        const codeData = {
          code: 'function solution(nums, target) {\n    for (let i = 0; i < nums.length; i++) {\n        for (let j = i + 1; j < nums.length; j++) {\n            if (nums[i] + nums[j] === target) {\n                return [i, j];\n            }\n        }\n    }\n    return [];\n}',
          language: 'javascript',
          questionId: testQuestion._id,
          sessionId: testSession
        };

        const response = await request(server)
          .post('/api/coding/run')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(codeData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('results');
        expect(response.body.data).toHaveProperty('summary');
      });
    });

    describe('POST /api/coding/submit', () => {
      it('should submit code solution', async () => {
        const codeData = {
          code: 'function solution(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}',
          language: 'javascript',
          questionId: testQuestion._id,
          sessionId: testSession
        };

        const response = await request(server)
          .post('/api/coding/submit')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(codeData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('score');
        expect(response.body.data).toHaveProperty('allTestsPassed');
      });
    });
  });

  describe('Security and Error Handling', () => {
    describe('Rate Limiting', () => {
      it('should apply rate limiting to auth endpoints', async () => {
        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(
            request(server)
              .post('/api/auth/login')
              .send({ email: 'test@example.com', password: 'wrongpassword' })
          );
        }

        const responses = await Promise.all(promises);
        const rateLimitedResponses = responses.filter(res => res.status === 429);
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });
    });

    describe('Input Validation', () => {
      it('should validate required fields', async () => {
        const response = await request(server)
          .post('/api/auth/register')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
      });
    });

    describe('Authentication', () => {
      it('should reject requests without valid token', async () => {
        const response = await request(server)
          .get('/api/admin/users')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Authorization', () => {
      it('should reject non-admin access to admin endpoints', async () => {
        const response = await request(server)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Health Checks', () => {
    it('should return health status for auth service', async () => {
      const response = await request(server)
        .get('/api/auth/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Auth service is healthy');
    });

    it('should return health status for admin service', async () => {
      const response = await request(server)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin service is healthy');
    });

    it('should return health status for quiz service', async () => {
      const response = await request(server)
        .get('/api/quiz/health')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Quiz service is healthy');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle non-existent resource', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(server)
        .get(`/api/quiz/${nonExistentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed MongoDB ObjectId', async () => {
      const response = await request(server)
        .get('/api/quiz/invalid-id')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle server errors gracefully', async () => {
      // This would test error handling, but requires mocking database errors
      // Implementation depends on specific error scenarios
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent requests', async () => {
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(server)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${studentToken}`)
        );
      }

      const responses = await Promise.all(promises);
      const successfulResponses = responses.filter(res => res.status === 200);
      expect(successfulResponses.length).toBe(50);
    });
  });
});

// Helper functions for testing
const createTestData = async () => {
  // Create test questions
  const questions = [
    {
      title: 'Test Question 1',
      content: 'What is JavaScript?',
      type: 'mcq',
      category: 'javascript',
      difficulty: 'easy',
      options: [
        { text: 'A programming language', isCorrect: true },
        { text: 'A markup language', isCorrect: false },
        { text: 'A styling language', isCorrect: false }
      ],
      createdBy: adminUser._id,
      status: { isActive: true, isApproved: true }
    },
    {
      title: 'Test Question 2',
      content: 'What is React?',
      type: 'mcq',
      category: 'javascript',
      difficulty: 'medium',
      options: [
        { text: 'A library', isCorrect: true },
        { text: 'A framework', isCorrect: false },
        { text: 'A language', isCorrect: false }
      ],
      createdBy: adminUser._id,
      status: { isActive: true, isApproved: true }
    }
  ];

  await Question.insertMany(questions);
};

const generateTestJWT = (userId, role) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

const cleanup = async () => {
  // Clean up test data
  await User.deleteMany({});
  await Question.deleteMany({});
  await Quiz.deleteMany({});
  await Interview.deleteMany({});
  await Company.deleteMany({});
  await Session.deleteMany({});
};

module.exports = {
  createTestData,
  generateTestJWT,
  cleanup
}; 