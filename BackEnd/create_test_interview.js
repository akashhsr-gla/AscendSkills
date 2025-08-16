const mongoose = require('mongoose');
const Interview = require('./models/Interview');
const Question = require('./models/Question');

async function createTestInterview() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ascend-skills');
    console.log('✅ Connected to MongoDB');
    
    // Get some questions
    const questions = await Question.find().limit(3);
    console.log('📝 Found questions:', questions.length);
    
    // Create test interview
    const interview = new Interview({
      user: '687f3f2e12766fbe51a87baa', // Test user ID
      title: 'Test AI Interview',
      type: 'behavioral',
      configuration: {
        timeLimit: 3600,
        questionCount: questions.length,
        difficulty: 'medium',
        enableVideo: true,
        enableAudio: true,
        aiAssessment: true,
        proctoring: {
          enabled: true,
          strictMode: true,
          allowPause: false,
          maxViolations: 3
        }
      },
      questions: questions.map(q => ({
        questionId: q._id,
        question: q.content,
        type: q.type,
        category: q.category,
        difficulty: q.difficulty,
        expectedDuration: q.interview?.expectedDuration || 300,
        response: {
          isAnswered: false,
          isSkipped: false,
          attemptCount: 0
        }
      })),
      status: 'active',
      startTime: new Date()
    });
    
    await interview.save();
    console.log('✅ Test interview created with ID:', interview._id);
    
    // Test the submit endpoint with this interview
    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path');
    
    // Create test files
    const testAudioPath = path.join(__dirname, 'test_audio.webm');
    const testImagePath = path.join(__dirname, 'test_image.jpg');
    fs.writeFileSync(testAudioPath, 'test audio data');
    fs.writeFileSync(testImagePath, 'test image data');
    
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(testAudioPath), 'test_audio.webm');
    formData.append('image', fs.createReadStream(testImagePath), 'test_image.jpg');
    formData.append('textResponse', 'This is a test response');
    
    console.log('📤 Testing submit endpoint...');
    
    const response = await fetch(`http://localhost:5000/api/interview/ai/${interview._id}/submit/0`, {
      method: 'POST',
      body: formData
    });
    
    console.log('📡 Response status:', response.status);
    const responseText = await response.text();
    console.log('📡 Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Submit endpoint test successful!');
    } else {
      console.log('❌ Submit endpoint test failed!');
    }
    
    // Clean up
    fs.unlinkSync(testAudioPath);
    fs.unlinkSync(testImagePath);
    
    mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
  }
}

createTestInterview(); 