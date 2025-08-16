const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-token-here'; // You'll need to get a real token

// Test data
const testCodingQuestion = {
  questionId: 'test-question-id',
  sourceCode: `def twoSum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []`,
  language: 'python'
};

// Test functions
async function testCodingSubmission() {
  try {
    console.log('🧪 Testing Coding Submission API...');
    
    const response = await axios.post(`${API_BASE_URL}/coding/submit`, {
      questionId: testCodingQuestion.questionId,
      sourceCode: testCodingQuestion.sourceCode,
      language: testCodingQuestion.language
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Coding submission successful:', response.data);
    return response.data.data.submissionId;
  } catch (error) {
    console.error('❌ Coding submission failed:', error.response?.data || error.message);
    return null;
  }
}

async function testSubmissionStatus(submissionId) {
  try {
    console.log('🧪 Testing Submission Status API...');
    
    const response = await axios.get(`${API_BASE_URL}/coding/submission/${submissionId}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('✅ Submission status retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Submission status failed:', error.response?.data || error.message);
    return null;
  }
}

async function testQuizCodingSubmission() {
  try {
    console.log('🧪 Testing Quiz Coding Submission API...');
    
    const response = await axios.post(`${API_BASE_URL}/quiz/test-question-id/submit-code`, {
      sourceCode: testCodingQuestion.sourceCode,
      language: testCodingQuestion.language
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Quiz coding submission successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Quiz coding submission failed:', error.response?.data || error.message);
    return null;
  }
}

async function testQuizStatistics() {
  try {
    console.log('🧪 Testing Quiz Statistics API...');
    
    const response = await axios.get(`${API_BASE_URL}/quiz/statistics`);
    
    console.log('✅ Quiz statistics retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Quiz statistics failed:', error.response?.data || error.message);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Coding API Tests...\n');
  
  // Test quiz statistics (no auth required)
  await testQuizStatistics();
  
  // Note: These tests require authentication
  console.log('\n⚠️  Note: The following tests require valid authentication tokens:');
  console.log('- testCodingSubmission()');
  console.log('- testSubmissionStatus()');
  console.log('- testQuizCodingSubmission()');
  
  console.log('\n📝 To run these tests:');
  console.log('1. Create a user account');
  console.log('2. Get an authentication token');
  console.log('3. Update TEST_TOKEN in this file');
  console.log('4. Run: node test-coding-api.js');
}

runTests(); 