'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Timer,
  Info,
  ArrowLeft,
  ArrowRight,
  Eye
} from 'lucide-react';
import CodingInterface from './CodingInterface';
import { quizService } from '@/services/quizService';
import { calculateFrontendQuizResult, type QuizResult } from '@/utils/quizResultCalculator';
import { useAuth } from '@/contexts/AuthContext';

interface Question {
  id: string;
  type: 'mcq' | 'fill' | 'coding';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;
  markingScheme?: string;
  section?: string;
  code?: string;
  originalType?: string; // Store original backend type for reference
}

interface QuizInterfaceProps {
  questions: Question[];
  onComplete: (results: any) => void;
  onExit: () => void;
  quizTitle: string;
  testDuration?: number;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({
  questions,
  onComplete,
  onExit,
  quizTitle,
  testDuration = 3600
}) => {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(testDuration); // Universal timer for entire quiz
  const [userAnswers, setUserAnswers] = useState<{[key: string]: any}>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | number>('');
  const [fillAnswer, setFillAnswer] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCoding, setShowCoding] = useState(false);
  const [codingDraft, setCodingDraft] = useState<{ [key: string]: { code: string; language: string } }>({});
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now());
  const [showTimeWarning, setShowTimeWarning] = useState<boolean>(false);

  const currentQuestion = questions[currentQuestionIndex];
  const currentSection = currentQuestion?.section || 'Section 1';
  

  


  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = userAnswers[currentQuestion.id];
      if (currentQuestion.type === 'mcq') {
        const newAnswer = existingAnswer !== undefined ? existingAnswer : '';
        if (selectedAnswer !== newAnswer) {
          setSelectedAnswer(newAnswer);
        }
      } else if (currentQuestion.type === 'fill') {
        const newAnswer = existingAnswer || '';
        if (fillAnswer !== newAnswer) {
          setFillAnswer(newAnswer);
        }
      }
    }
  }, [currentQuestionIndex, currentQuestion.id]); // Only depend on question index and ID, not the entire userAnswers object

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          // Show warning when 5 minutes left
          if (prev === 300) {
            setShowTimeWarning(true);
          }
          
          if (prev <= 1) {
            // Use setTimeout to avoid state update during render
            setTimeout(() => {
              handleQuizTimeout();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    if (currentQuestion && currentQuestion.type === 'coding') {
      setShowCoding(true);
    } else {
      setShowCoding(false);
    }
  }, [currentQuestionIndex, currentQuestion, userAnswers]);

  // Save current answer when component unmounts or user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentQuestionAnswer();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveCurrentQuestionAnswer();
    };
  }, []); // Remove dependencies to prevent infinite re-renders

  const handleAutoSubmit = () => {
    // Save current question answer before submitting
    saveCurrentQuestionAnswer();
    
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    const quizResult = calculateFrontendQuizResult(questions, userAnswers, timeTaken);
    onComplete({ 
      userAnswers,
      quizResult,
      timeTaken,
      completedAt: new Date()
    });
  };

  const handleQuizTimeout = () => {
    // Auto-submit entire quiz when time runs out
    // Save current question answer before submitting
    saveCurrentQuestionAnswer();
    
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    const quizResult = calculateFrontendQuizResult(questions, userAnswers, timeTaken);
    onComplete({ 
      userAnswers,
      quizResult,
      timeTaken,
      completedAt: new Date()
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = useMemo(() => {
    return (index: number) => {
      const question = questions[index];
      const hasAnswer = userAnswers[question.id] !== undefined && userAnswers[question.id] !== '';
      
      if (hasAnswer) return 'answered';
      return 'not-answered';
    };
  }, [questions, userAnswers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-green-500 text-white';
      case 'not-answered': return 'bg-white border border-gray-300 text-gray-700';
      default: return 'bg-white border border-gray-300 text-gray-700';
    }
  };

  const handleAnswerChange = (answer: string | number) => {
    // Only update if the answer has actually changed
    if (currentQuestion.type === 'mcq') {
      if (selectedAnswer !== answer) {
        setSelectedAnswer(answer);
      }
    } else if (currentQuestion.type === 'fill') {
      if (fillAnswer !== answer) {
        setFillAnswer(answer as string);
      }
    }
    
    // Only update userAnswers if the answer is different
    if (userAnswers[currentQuestion.id] !== answer) {
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answer
      }));
    }
  };

  const handleQuestionNavigation = (index: number) => {
    // Only save if we're actually changing questions
    if (index !== currentQuestionIndex) {
      saveCurrentQuestionAnswer(); // Use immediate save for navigation
      setCurrentQuestionIndex(index);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      handleQuestionNavigation(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      handleQuestionNavigation(currentQuestionIndex - 1);
    }
  };

  const handleMarkForReview = () => {
    // Review functionality removed - simplified interface
  };

  const counts = useMemo(() => {
    const answered = questions.filter((q) => {
      const hasAnswer = userAnswers[q.id] !== undefined && userAnswers[q.id] !== '';
      return hasAnswer;
    }).length;
    
    const notAnswered = questions.length - answered;

    return { answered, notAnswered };
  }, [questions, userAnswers]);

  const handleCodingSubmit = async (code: string, language: string) => {
    try {
      // Submit coding answer to the backend
      const response = await quizService.submitCodingAnswer(currentQuestion.id, code, language);
      
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: { 
          code, 
          language, 
          submission: response.data.submission,
          points: response.data.points 
        }
      }));
      
      setCodingDraft(prev => ({
        ...prev,
        [currentQuestion.id]: { code, language }
      }));
      
      setShowCoding(false);
      handleNext();
      
    } catch (error) {
      console.error('Error submitting coding answer:', error);
      // Still save locally even if backend fails
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: { code, language }
      }));
      setShowCoding(false);
      handleNext();
    }
  };

  const saveCurrentQuestionAnswer = () => {
    if (currentQuestion) {
      let currentAnswer: any;
      if (currentQuestion.type === 'mcq') {
        currentAnswer = selectedAnswer;
      } else if (currentQuestion.type === 'fill') {
        currentAnswer = fillAnswer;
      } else if (currentQuestion.type === 'coding') {
        currentAnswer = codingDraft[currentQuestion.id] || { code: '', language: 'python' };
      }
      
      // Only update if we have a valid answer and it's different from what's already saved
      if (currentAnswer !== undefined && currentAnswer !== '' && 
          JSON.stringify(userAnswers[currentQuestion.id]) !== JSON.stringify(currentAnswer)) {
        setUserAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: currentAnswer
        }));
      }
    }
  };

  // Debounced version to prevent rapid successive calls
  const debouncedSaveCurrentQuestionAnswer = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveCurrentQuestionAnswer, 100);
    };
  }, []);

  const handleCodingBack = () => {
    setShowCoding(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
      {/* Header */}
      <div className="backdrop-blur bg-white/80 shadow-lg border-b sticky top-0 z-30">
        <div className="max-w-full px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight drop-shadow">{quizTitle}</h1>
            <button
              onClick={() => setShowInstructions(true)}
              className="flex items-center px-4 py-2 text-base text-blue-700 bg-blue-100 rounded-xl hover:bg-blue-200 font-semibold shadow-sm transition"
            >
              <Info className="w-5 h-5 mr-2" />
              Test Instructions
            </button>
          </div>
          <div className="flex items-center space-x-8">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 font-medium">Time Remaining</span>
              <span className={`text-2xl font-bold tracking-widest tabular-nums ${
                timeLeft <= 300 ? 'text-red-600' : 
                timeLeft <= 600 ? 'text-orange-600' : 'text-blue-600'
              }`}>{formatTime(timeLeft)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 font-medium">Time Elapsed</span>
              <span className="text-lg font-bold text-gray-700 tracking-widest tabular-nums">
                {formatTime(Math.floor((Date.now() - quizStartTime) / 1000))}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-400 px-4 py-2 rounded-full shadow text-white font-bold">
              <span className="text-lg">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              <span className="font-semibold">{user?.name || 'User'}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Section Navigation */}
      <div className="bg-gradient-to-r from-blue-100 to-blue-50 border-b">
        <div className="max-w-full px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
            <span className="text-lg font-bold text-gray-900">{currentSection}</span>
            <ArrowRight className="w-5 h-5 text-gray-500" />
          </div>
          <button
            onClick={() => setShowInstructions(true)}
            className="flex items-center text-blue-700 hover:text-blue-900 font-semibold"
          >
            <Info className="w-4 h-4 mr-1" />
            Section Instructions
          </button>
        </div>
      </div>
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-10">
          {showCoding && currentQuestion?.type === 'coding' ? (
            <CodingInterface
              problem={{
                id: currentQuestion.id,
                title: currentQuestion.question,
                difficulty: currentQuestion.difficulty,
                description: currentQuestion.explanation || '',
                examples: [],
                constraints: [],
                tags: [],
                starterCode: { python: currentQuestion.code || '' },
                timeLimit: currentQuestion.timeLimit,
                coding: {
                  problemDescription: currentQuestion.explanation || '',
                  examples: [],
                  constraints: [],
                  starterCode: currentQuestion.code || ''
                }
              }}
              onSubmit={handleCodingSubmit}
              onBack={handleCodingBack}
              questionId={currentQuestion.id}
              isQuizMode={true}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 rounded-3xl shadow-2xl border p-12 md:p-16 max-w-4xl min-h-[540px] w-full mx-auto backdrop-blur-lg flex flex-col justify-between"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-6">
                  <h2 className="text-2xl font-bold text-gray-900">Question {currentQuestionIndex + 1}</h2>
                  <div className="text-base text-gray-700 font-semibold">
                    <span className="text-green-700 font-bold">Marking:</span> {currentQuestion?.markingScheme || '+1'}
                  </div>
                  <div className="flex items-center text-base text-gray-700">
                    <Timer className="w-5 h-5 mr-1 text-blue-500" />
                    {formatTime(currentQuestion?.timeLimit || 0)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleMarkForReview}
                    className="flex items-center px-4 py-2 text-base rounded-xl font-semibold transition shadow-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Mark for review
                  </button>

                </div>
              </div>
              {/* Question Content */}
              <div className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
                  {currentQuestion?.question}
                </h3>
                {/* MCQ Options */}
                {currentQuestion?.type === 'mcq' && currentQuestion?.options && (
                  <div className="space-y-4">

                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-4 p-5 border-2 rounded-xl cursor-pointer transition group ${
                          selectedAnswer === index 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:bg-blue-50'
                        }`}
                        onClick={() => {
                          handleAnswerChange(index);
                        }}

                      >
                        <div 
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                            selectedAnswer === index 
                              ? 'border-blue-600 bg-blue-600' 
                              : 'border-gray-300 bg-white'
                          }`}
                          onClick={() => {
                            handleAnswerChange(index);
                          }}
                        >
                          {selectedAnswer === index && (
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900 text-lg group-hover:text-blue-700 transition">
                          {String.fromCharCode(65 + index)}. {option}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Fill in the Blank */}
                {currentQuestion?.type === 'fill' && (
                  <div className="space-y-4">
                    <label className="block text-base font-semibold text-gray-800">Your Answer:</label>
                    <input
                      type="text"
                      value={fillAnswer}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white text-black"
                    />
                  </div>
                )}
              </div>
              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-8 border-t mt-8">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center px-6 py-3 text-lg font-semibold text-gray-700 bg.white border-2 border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Previous
                </button>
                {currentQuestionIndex < questions.length - 1 && (
                  <button
                    onClick={handleNext}
                    className="flex items-center px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg"
                  >
                    Next
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
        {/* Right Sidebar */}
        <div className="w-96 bg-white/90 border-l p-8 flex flex-col gap-8 shadow-xl min-h-screen">
          {/* Question Count Legend */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Questions: {questions.length}</h3>
            <div className="space-y-3 text-base">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-white border-2 border-gray-300 rounded"></div>
                  <span className="font-semibold text-gray-800">Not Answered</span>
                </div>
                <span className="font-bold">{counts.notAnswered}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded"></div>
                  <span className="font-semibold text-gray-800">Answered</span>
                </div>
                <span className="font-bold">{counts.answered}</span>
              </div>
            </div>
          </div>
          {/* Section Info */}
          <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-6 rounded-2xl shadow">
            <h4 className="font-bold text-blue-900 mb-2">{currentSection}</h4>
            <div className="text-base text-blue-800">
              <div className="flex justify-between">
                <span>Questions:</span>
                <span>{questions.length}</span>
              </div>
            </div>
          </div>
          {/* Question Grid */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Question Navigation</h4>
            <div className="grid grid-cols-5 gap-3">
              {questions.map((_, index) => {
                const status = getQuestionStatus(index);
                return (
                  <button
                    key={index}
                    onClick={() => handleQuestionNavigation(index)}
                    className={`w-12 h-12 text-lg font-bold rounded-xl shadow transition ring-2 ring-offset-2 focus:outline-none focus:ring-blue-500 ${
                      index === currentQuestionIndex ? 'ring-blue-500' : ''
                    } ${getStatusColor(status)}`}
                    aria-label={`Go to question ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Submit Section */}
          <div className="border-t pt-8 mt-8">
            <button
              onClick={() => {
                // Save current question answer before submitting
                saveCurrentQuestionAnswer();
                
                const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
                const quizResult = calculateFrontendQuizResult(questions, userAnswers, timeTaken);
                onComplete({ 
                  userAnswers,
                  quizResult,
                  timeTaken
                });
              }}
              className="w-full py-4 px-6 text-xl font-bold text-white bg-green-600 rounded-2xl hover:bg-green-700 shadow-lg transition"
            >
              Submit Test
            </button>
            <p className="text-sm text-gray-600 mt-4 text-center font-medium">
              Make sure to review all questions before submitting
            </p>
          </div>
        </div>
      </div>
      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Test Instructions</h2>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-blue-800 space-y-2">
                <p className="font-medium">Key Points:</p>
                <ul className="space-y-1">
                  <li>• Read each question carefully before answering</li>
                  <li>• Navigate between questions using the sidebar</li>
                  <li>• The timer shows remaining time for the entire test</li>
                  <li>• Click "Submit Test" when you're ready to finish</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full bg-gradient-primary text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
            >
              Got it
            </button>
          </motion.div>
        </div>
      )}
      
      {/* Time Warning Modal */}
      {showTimeWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Timer className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Time Warning!</h3>
            <p className="text-gray-600 mb-6">
              You have less than 5 minutes remaining for the entire quiz. Please review your answers and submit soon.
            </p>
            <button
              onClick={() => setShowTimeWarning(false)}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizInterface; 