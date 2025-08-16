"use client";
import React, { useState } from 'react';

const FollowUpTest: React.FC = () => {
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const [currentFollowUpIndex, setCurrentFollowUpIndex] = useState(0);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [currentQuestion] = useState({
    question: "Tell me about a particularly challenging project you've worked on.",
    type: "behavioral"
  });

  const simulateApiResponse = () => {
    const mockResponse = {
      data: {
        followUpQuestions: [
          "Can you provide a specific example of a challenging project you've faced?",
          "What were the main obstacles you encountered during that project?",
          "How did you specifically overcome those challenges to succeed in the project?"
        ]
      }
    };

    console.log('📡 Simulating API response:', mockResponse);
    
    if (mockResponse.data.followUpQuestions && mockResponse.data.followUpQuestions.length > 0) {
      console.log('🔄 Entering follow-up mode');
      setIsFollowUpMode(true);
      setCurrentFollowUpIndex(0);
      setFollowUpQuestions(mockResponse.data.followUpQuestions);
    }
  };

  const nextFollowUp = () => {
    if (currentFollowUpIndex < followUpQuestions.length - 1) {
      setCurrentFollowUpIndex(currentFollowUpIndex + 1);
    } else {
      setIsFollowUpMode(false);
      setCurrentFollowUpIndex(0);
      setFollowUpQuestions([]);
    }
  };

  const currentFollowUpQuestion = isFollowUpMode && followUpQuestions[currentFollowUpIndex];
  const displayQuestion = isFollowUpMode ? currentFollowUpQuestion : currentQuestion.question;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Follow-up Question Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-lg font-semibold mb-4">Current Question</h2>
        <div className="mb-2">
          <span className="text-blue-600 text-sm font-medium">
            {isFollowUpMode ? (
              <span className="flex items-center gap-2">
                <span>Follow-up Question</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {currentFollowUpIndex + 1} of {followUpQuestions.length}
                </span>
              </span>
            ) : (
              `${currentQuestion.type.charAt(0).toUpperCase() + currentQuestion.type.slice(1)} Question`
            )}
          </span>
        </div>
        <p className="text-gray-900 text-lg leading-relaxed">
          {displayQuestion}
        </p>
        {isFollowUpMode && (
          <div className="mt-2 text-sm text-gray-600">
            Original question: {currentQuestion.question}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-lg font-semibold mb-4">Debug Info</h2>
        <pre className="text-sm bg-gray-100 p-4 rounded">
          {JSON.stringify({
            isFollowUpMode,
            currentFollowUpIndex,
            followUpQuestionsLength: followUpQuestions.length,
            currentFollowUpQuestion,
            displayQuestion
          }, null, 2)}
        </pre>
      </div>

      <div className="space-x-4">
        <button
          onClick={simulateApiResponse}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Simulate API Response
        </button>
        <button
          onClick={nextFollowUp}
          disabled={!isFollowUpMode}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Next Follow-up
        </button>
        <button
          onClick={() => {
            setIsFollowUpMode(false);
            setCurrentFollowUpIndex(0);
            setFollowUpQuestions([]);
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Reset
        </button>
      </div>

      {followUpQuestions.length > 0 && !isFollowUpMode && (
        <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">AI Follow-up Questions:</h3>
          <ul className="space-y-1">
            {followUpQuestions.map((question, index) => (
              <li key={index} className="text-yellow-800 text-sm">
                • {question}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isFollowUpMode && (
        <div className="mt-4 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">🔄 Follow-up Mode Active:</h3>
          <p className="text-blue-800 text-sm">
            You are now answering follow-up question {currentFollowUpIndex + 1} of {followUpQuestions.length}
          </p>
        </div>
      )}
    </div>
  );
};

export default FollowUpTest; 