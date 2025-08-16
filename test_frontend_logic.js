// Test script to simulate frontend follow-up question logic

// Simulate React state
let isFollowUpMode = false;
let currentFollowUpIndex = 0;
let followUpQuestions = [];
let currentQuestionIndex = 0;
let questions = [
  {
    question: "Tell me about a particularly challenging project you've worked on. What made it challenging, and how did you overcome those challenges?",
    type: "behavioral"
  },
  {
    question: "Describe a situation where you had to collaborate with someone who was difficult to work with. How did you handle it?",
    type: "behavioral"
  }
];

// Simulate API response
const mockApiResponse = {
  data: {
    transcription: "This is a fallback transcription for testing purposes.",
    confidence: 0.8,
    followUpQuestions: [
      "Can you provide a specific example of a challenging project you've faced?",
      "What were the main obstacles you encountered during that project?",
      "How did you specifically overcome those challenges to succeed in the project?"
    ],
    securityStatus: {
      faceCount: 1,
      violations: [],
      isSecure: true
    },
    nextQuestionIndex: 1
  }
};

console.log('🧪 Testing Frontend Follow-up Logic...\n');

// Simulate the handleSubmitResponse function
function simulateHandleSubmitResponse() {
  console.log('📡 API Response received:', mockApiResponse);
  
  // Log follow-up questions for debugging
  if (mockApiResponse.data.followUpQuestions && mockApiResponse.data.followUpQuestions.length > 0) {
    console.log('📝 Follow-up questions in response:', mockApiResponse.data.followUpQuestions);
  } else {
    console.log('📝 No follow-up questions in response');
  }
  
  // Handle follow-up questions flow
  if (isFollowUpMode) {
    console.log('🔄 Currently in follow-up mode');
    // Handle follow-up question flow
    if (currentFollowUpIndex < followUpQuestions.length - 1) {
      console.log('⏭️ Moving to next follow-up question');
      currentFollowUpIndex++;
      console.log('📊 New follow-up index:', currentFollowUpIndex);
    } else {
      console.log('✅ All follow-up questions completed');
      if (mockApiResponse.data.nextQuestionIndex !== null) {
        console.log('⏭️ Moving to next main question');
        currentQuestionIndex = mockApiResponse.data.nextQuestionIndex;
        isFollowUpMode = false;
        currentFollowUpIndex = 0;
        followUpQuestions = [];
      } else {
        console.log('🏁 Interview completed');
      }
    }
  } else {
    console.log('🔄 Currently in main question mode');
    // Handle main question flow - use response data directly
    if (mockApiResponse.data.followUpQuestions && mockApiResponse.data.followUpQuestions.length > 0) {
      console.log('🔄 Entering follow-up mode with questions:', mockApiResponse.data.followUpQuestions);
      // Enter follow-up mode
      isFollowUpMode = true;
      currentFollowUpIndex = 0;
      // Set follow-up questions immediately
      followUpQuestions = mockApiResponse.data.followUpQuestions;
      console.log('✅ Follow-up mode activated');
    } else {
      console.log('⏭️ No follow-up questions, moving to next main question');
      if (mockApiResponse.data.nextQuestionIndex !== null) {
        currentQuestionIndex = mockApiResponse.data.nextQuestionIndex;
      } else {
        console.log('🏁 Interview completed');
      }
    }
  }
  
  // Display current state
  displayCurrentState();
}

function displayCurrentState() {
  const currentQuestion = questions[currentQuestionIndex];
  const currentFollowUpQuestion = isFollowUpMode && followUpQuestions[currentFollowUpIndex];
  const displayQuestion = isFollowUpMode ? currentFollowUpQuestion : currentQuestion?.question;
  
  console.log('\n🎯 Current State:');
  console.log('   isFollowUpMode:', isFollowUpMode);
  console.log('   currentFollowUpIndex:', currentFollowUpIndex);
  console.log('   followUpQuestions.length:', followUpQuestions.length);
  console.log('   currentFollowUpQuestion:', currentFollowUpQuestion);
  console.log('   displayQuestion:', displayQuestion);
  console.log('   currentQuestionIndex:', currentQuestionIndex);
  
  if (isFollowUpMode) {
    console.log('\n📝 Current Question Display:');
    console.log('   Type: Follow-up Question');
    console.log('   Progress: ' + (currentFollowUpIndex + 1) + ' of ' + followUpQuestions.length);
    console.log('   Question: ' + displayQuestion);
    console.log('   Original: ' + currentQuestion?.question);
  } else {
    console.log('\n📝 Current Question Display:');
    console.log('   Type: ' + (currentQuestion?.type || 'behavioral').charAt(0).toUpperCase() + (currentQuestion?.type || 'behavioral').slice(1) + ' Question');
    console.log('   Question: ' + displayQuestion);
  }
}

// Test the logic
console.log('1️⃣ Initial state:');
displayCurrentState();

console.log('\n2️⃣ Simulating first response submission:');
simulateHandleSubmitResponse();

console.log('\n3️⃣ Simulating follow-up response submission:');
simulateHandleSubmitResponse();

console.log('\n4️⃣ Simulating second follow-up response submission:');
simulateHandleSubmitResponse();

console.log('\n5️⃣ Simulating third follow-up response submission:');
simulateHandleSubmitResponse();

console.log('\n�� Test completed!'); 