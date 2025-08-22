'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Building, 
  Clock, 
  Star, 
  Play, 
  Award, 
  Target,
  BarChart3,
  Trophy,
  Lock,
  CheckCircle,
  XCircle,
  Timer,
  Users,
  Download,
  Eye,
  Zap,
  Code,
  FileText,
  Edit3,
  Monitor,
  Smartphone,
  ChevronRight,
  Home,
  ArrowLeft,
  Send,
  Save,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  Brain,
  TrendingUp,
  Video,
  Camera,
  Headphones,
  Settings,
  Filter,
  Search,
  Calendar,
  Medal,
  Lightbulb,
  Flag,
  Loader2,
  AlertCircle,
  Info,
  Check
} from 'lucide-react';
import Header from '@/components/Header';
import QuizInterface from '@/components/QuizInterface';
import QuizResults from '@/components/QuizResults';
import CodingInterface from '@/components/CodingInterface';
import { quizService, QuizQuestion } from '@/services/quizService';
import { calculateFrontendQuizResult } from '@/utils/quizResultCalculator';
import { downloadQuizReport } from '@/utils/pdf';
import { isAuthenticated } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import { subscriptionService, type UserSubscription, type SubscriptionPlan } from '@/services/subscriptionService';
import SubscriptionModal from '@/components/SubscriptionModal';

interface QuizCard {
  id: string;
  title: string;
  description: string;
  questions: number;
  duration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  icon: any;
  category: 'topic' | 'company';
  isPremium?: boolean;
  categoryType: 'company' | 'subjective';
  totalTimeLimit?: number; // Backend calculated total time in seconds
}

interface Question {
  id: string;
  type: 'mcq' | 'fill' | 'coding';
  question: string;
  options?: string[];
  code?: string;
  language?: string;
  correctAnswer?: string | number;
  explanation?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;
  originalType?: string; // Store original backend type for reference
}

// Dynamic quiz data will be loaded from backend
const quizData: QuizCard[] = [];

// Sample questions for different types
const sampleQuestions: Question[] = [
  {
    id: 'mcq1',
    type: 'mcq',
    question: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
    correctAnswer: 1,
    explanation: 'Binary search divides the search space in half with each comparison, resulting in O(log n) time complexity.',
    difficulty: 'Medium',
    timeLimit: 60
  },
  {
    id: 'fill1',
    type: 'fill',
    question: 'The _______ data structure follows the Last In First Out (LIFO) principle.',
    correctAnswer: 'stack',
    explanation: 'A stack is a linear data structure that follows the LIFO principle.',
    difficulty: 'Easy',
    timeLimit: 45
  },
  {
    id: 'code1',
    type: 'coding',
    question: 'Write a function to reverse a string.',
    code: `def reverse_string(s):
    # Write your code here
    pass`,
    language: 'python',
    correctAnswer: 'return s[::-1]',
    explanation: 'Using Python slicing with [::-1] reverses the string.',
    difficulty: 'Easy',
    timeLimit: 300
  }
];

const QuizPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'topic' | 'company' | 'pastpapers'>('topic');
  const [showRules, setShowRules] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizCard | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'quiz' | 'result'>('home');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{[key: string]: any}>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | number>('');
  const [fillAnswer, setFillAnswer] = useState('');
  const [codeAnswer, setCodeAnswer] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>(sampleQuestions);

  // Backend integration states
  const [quizCards, setQuizCards] = useState<QuizCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuizQuestions, setSelectedQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);

  // Subscription state
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  // Authentication check
  useEffect(() => {
    // Don't redirect automatically - let users see the page
    // Authentication will be checked when they try to interact
  }, [router]);

  // Fetch quiz data from backend
  useEffect(() => {
    const fetchQuizData = async () => {
      // Allow data loading even for unauthenticated users to show available content
      try {
        setLoading(true);
        setError(null);
        
        // Get statistics to understand available categories
        const statsResponse = await quizService.getQuizStatistics();
        const stats = statsResponse.data;
        
        // Get questions by category type
        const companyResponse = await quizService.getQuizQuestionsByCategoryType('company');
        const subjectiveResponse = await quizService.getQuizQuestionsByCategoryType('subjective');
        
        // Fetch subscription plans for premium features
        try {
          const plansResponse = await subscriptionService.getAvailablePlans();
          if (plansResponse.success && plansResponse.data) {
            setSubscriptionPlans(plansResponse.data);
          }
        } catch (error) {
          console.error('Error fetching subscription plans:', error);
        }
        
        // Debug: Log the API responses
        console.log('=== QUIZ PAGE API RESPONSES ===');
        console.log('Company questions:', companyResponse.data?.length || 0);
        console.log('Subjective questions:', subjectiveResponse.data?.length || 0);
        console.log('Subjective questions data:', subjectiveResponse.data);
        
        // Group questions by category
        const companyQuestions = companyResponse.data || [];
        const subjectiveQuestions = subjectiveResponse.data || [];
        
        // Create quiz cards from backend data
        const cards: QuizCard[] = [];
        
        // Company categories
        const companyCategories = [...new Set(companyQuestions.map((q: QuizQuestion) => q.category))] as string[];
        companyCategories.forEach((category: string) => {
          const categoryQuestions = companyQuestions.filter((q: QuizQuestion) => q.category === category);
          const totalTimeLimit = categoryQuestions.reduce((sum: number, q: QuizQuestion) => sum + q.timeLimit, 0);
          
          cards.push({
            id: category.toLowerCase().replace(/\s+/g, '-'),
            title: category,
            description: `${category} specific questions covering technical and domain knowledge`,
            questions: categoryQuestions.length,
            duration: Math.round(totalTimeLimit / 60), // Total time for all questions in minutes
            difficulty: getDifficultyFromBackend(categoryQuestions),
            tags: getTagsFromQuestions(categoryQuestions),
            icon: Building,
            category: 'company',
            categoryType: 'company',
            isPremium: categoryQuestions.length > 10 // Premium if more than 10 questions
          });
        });
        
        // Subjective categories
        const subjectiveCategories = [...new Set(subjectiveQuestions.map((q: QuizQuestion) => q.category))] as string[];
        subjectiveCategories.forEach((category: string) => {
          const categoryQuestions = subjectiveQuestions.filter((q: QuizQuestion) => q.category === category);
          const totalTimeLimit = categoryQuestions.reduce((sum: number, q: QuizQuestion) => sum + q.timeLimit, 0);
          
          cards.push({
            id: category.toLowerCase().replace(/\s+/g, '-'),
            title: category,
            description: `${category} fundamentals and concepts for practice`,
            questions: categoryQuestions.length,
            duration: Math.round(totalTimeLimit / 60), // Total time for all questions in minutes
            difficulty: getDifficultyFromBackend(categoryQuestions),
            tags: getTagsFromQuestions(categoryQuestions),
            icon: BookOpen,
            category: 'topic',
            categoryType: 'subjective'
          });
        });
        
        setQuizCards(cards);
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError('Failed to load quiz data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizData();
  }, [router]);

  // Check user subscription when authenticated
  useEffect(() => {
    const checkUserSubscription = async () => {
      if (!isAuthenticated()) return;
      
      setCheckingSubscription(true);
      try {
        const response = await subscriptionService.getUserSubscription();
        if (response.success && response.data) {
          setUserSubscription(response.data);
        }
      } catch (error) {
        console.error('Error fetching user subscription:', error);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkUserSubscription();
  }, []);

  // Helper functions
  const getDifficultyFromBackend = (questions: QuizQuestion[]): 'Easy' | 'Medium' | 'Hard' => {
    const difficulties = questions.map(q => q.difficulty);
    const easyCount = difficulties.filter(d => d === 'easy').length;
    const mediumCount = difficulties.filter(d => d === 'medium').length;
    const hardCount = difficulties.filter(d => d === 'hard').length;
    
    if (hardCount > easyCount && hardCount > mediumCount) return 'Hard';
    if (mediumCount > easyCount) return 'Medium';
    return 'Easy';
  };

  const getTagsFromQuestions = (questions: QuizQuestion[]): string[] => {
    const allTags = questions.flatMap(q => q.tags);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.slice(0, 5); // Limit to 5 tags
  };

  const filteredQuizzes = quizCards.filter(quiz => {
    if (activeTab === 'pastpapers') return false;
    return quiz.category === activeTab;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleStartQuiz = async (quiz: QuizCard) => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      setError('Please log in to start a quiz. Click the login button below to continue.');
      return;
    }

    // Check if user has active subscription (free plan is not allowed for quizzes)
    if (!userSubscription?.isActive || userSubscription?.type === 'free') {
      setShowSubscriptionModal(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch questions for the selected quiz category type
      const response = await quizService.getQuizQuestionsByCategoryType(quiz.categoryType);
      const allQuestions = response.data || [];
      
      // Filter questions by the specific category (quiz.title)
      const questions = allQuestions.filter((q: QuizQuestion) => q.category === quiz.title);
      
      if (questions.length === 0) {
        setError('No questions available for this category.');
        return;
      }
      
      // Fetch timer information for this specific category
      const timerResponse = await quizService.getCategoryTimer(quiz.title, quiz.categoryType);
      const timerInfo = timerResponse.data;
      
      // Update quiz with backend timer information
      const updatedQuiz = {
        ...quiz,
        duration: timerInfo.totalTimeMinutes, // Use backend calculated duration
        totalTimeLimit: timerInfo.totalTimeLimit // Store total time in seconds
      };
      
      setSelectedQuizQuestions(questions);
      setSelectedQuiz(updatedQuiz);
      setShowRules(true);
    } catch (err) {
      console.error('Error fetching quiz questions:', err);
      setError('Failed to load quiz questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startQuizSession = () => {
          // Convert backend questions to frontend format
      const convertedQuestions: Question[] = selectedQuizQuestions.map((q: QuizQuestion) => {
        let frontendType: 'mcq' | 'fill' | 'coding';
        
        switch (q.type) {
          case 'mcqs':
            frontendType = 'mcq';
            break;
          case 'fill_in_blanks':
            frontendType = 'fill';
            break;
          case 'true_false':
            frontendType = 'mcq'; // Treat true/false as MCQ with 2 options
            break;
          default:
            frontendType = 'coding';
        }
        

        
        return {
         id: q._id,
         type: frontendType,
         question: q.content,
         options: q.type === 'true_false' ? ['True', 'False'] : q.mcqs?.options || [],
         correctAnswer: q.type === 'mcqs' ? q.mcqs?.correctOptionIndex : 
                       q.type === 'true_false' ? (q.trueFalse?.correctAnswer === true ? 0 : 1) : q.correctAnswer,
         explanation: q.explanation,
         difficulty: q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) as 'Easy' | 'Medium' | 'Hard',
         timeLimit: q.timeLimit,
         code: q.coding?.starterCode || '',
         language: 'javascript', // Default language
         originalType: q.type // Store original backend type
       };
    });
    
    setQuizQuestions(convertedQuestions);
    setShowRules(false);
    setCurrentView('quiz');
    setCurrentQuestionIndex(0);
    setTimeLeft(convertedQuestions[0]?.timeLimit || 60);
    setUserAnswers({});
    setSelectedAnswer('');
    setFillAnswer('');
    setCodeAnswer('');
    setQuizStartTime(new Date());
  };

  const handleAnswerSubmit = () => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    let answer: string | number = '';
    
    if (currentQuestion.type === 'mcq') {
      answer = selectedAnswer;
    } else if (currentQuestion.type === 'fill') {
      answer = fillAnswer.trim().toLowerCase();
    } else if (currentQuestion.type === 'coding') {
      answer = codeAnswer;
    }

    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));

    // Move to next question or finish
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
      setFillAnswer('');
      setCodeAnswer('');
      setTimeLeft(quizQuestions[currentQuestionIndex + 1]?.timeLimit || 60);
    } else {
      setCurrentView('result');
    }
  };

  const handleQuizComplete = (results: any) => {
    setUserAnswers(results.userAnswers);
    
    // Save quiz result to backend here instead of in QuizResult component
    const saveResult = async () => {
      try {
        const actualTimeTaken = quizStartTime ? Math.floor((Date.now() - quizStartTime.getTime()) / 1000) : 0;
        const quizResult = calculateFrontendQuizResult(quizQuestions, results.userAnswers, actualTimeTaken);
        
        const resultData = {
          quizTitle: selectedQuiz?.title || 'Quiz',
          quizCategory: selectedQuiz?.title || 'General',
          quizCategoryType: selectedQuiz?.categoryType || 'subjective',
          totalQuestions: quizResult.totalQuestions,
          answeredQuestions: quizResult.answeredQuestions,
          correctAnswers: quizResult.correctAnswers,
          incorrectAnswers: quizResult.incorrectAnswers,
          unansweredQuestions: quizResult.unansweredQuestions,
          score: quizResult.score,
          percentage: quizResult.percentage,
          grade: quizResult.grade,
          gradeColor: quizResult.gradeColor,
          timeTaken: actualTimeTaken,
          averageTimePerQuestion: quizResult.averageTimePerQuestion,
          performanceByType: quizResult.performanceByType,
          performanceByDifficulty: quizResult.performanceByDifficulty,
          questionAnalysis: quizResult.questionAnalysis,
          userAnswers: results.userAnswers,
          recommendations: quizResult.recommendations,
          strengths: quizResult.strengths,
          weaknesses: quizResult.weaknesses,
          startedAt: quizStartTime || new Date(),
          completedAt: new Date(),
          status: 'completed'
        };

        await quizService.saveQuizResult(resultData);
      } catch (error) {
        console.error('Failed to save quiz result:', error);
        // Don't show error to user, just log it
      }
    };

    saveResult();
    setCurrentView('result');
  };

  // Handle subscription modal close
  const handleSubscriptionModalClose = () => {
    setShowSubscriptionModal(false);
  };

  const QuizRulesModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Quiz Instructions</h2>
          <p className="text-gray-600 mt-2">{selectedQuiz?.title}</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">Questions</span>
            <span className="font-semibold text-gray-900">{selectedQuiz?.questions}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">Question Types</span>
            <span className="font-semibold text-gray-900">True-False, Fill in the Blanks and MCQs</span>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-1 mt-0.5">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium">Important Notes:</p>
              <ul className="mt-1 space-y-1">
                <li>• Read questions carefully before answering</li>
                <li>• Each question has individual time limits</li>
                <li>• You can navigate between questions</li>
                <li>• Submit when you're ready to finish</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowRules(false)}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={startQuizSession}
            className="flex-1 bg-gradient-primary text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Start Quiz
          </button>
        </div>
      </motion.div>
    </div>
  );

  const QuizResult = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Calculate actual time taken
    const actualTimeTaken = quizStartTime ? Math.floor((Date.now() - quizStartTime.getTime()) / 1000) : 0;
    
    // Use the proper quiz result calculator with actual time
    const quizResult = calculateFrontendQuizResult(quizQuestions, userAnswers, actualTimeTaken);
    const { correctAnswers, score, performanceByType, timeTaken, averageTimePerQuestion } = quizResult;

      const handleDownload = useCallback(async () => {
    if (!containerRef.current) return;
    
    // Create quiz data for the new PDF system
    const quizData = {
      title: selectedQuiz?.title || 'Quiz',
      userName: 'User', // This should come from user context
      date: new Date().toLocaleDateString(),
      totalQuestions: quizQuestions.length,
      correctAnswers,
      score,
      timeSpent: `${Math.floor(timeTaken / 60)} min ${timeTaken % 60} sec`,
      category: selectedQuiz?.category || 'General',
      difficulty: selectedQuiz?.difficulty || 'Medium',
              questions: quizQuestions.map((q, i) => ({
          question: q.question,
          userAnswer: String(userAnswers[i] || ''),
          correctAnswer: String(q.correctAnswer || ''),
          isCorrect: String(userAnswers[i] || '') === String(q.correctAnswer || ''),
          explanation: q.explanation || undefined
        })),
      breakdown: {
        'MCQ Questions': {
          correct: performanceByType.mcq.correct,
          total: performanceByType.mcq.total,
          percentage: performanceByType.mcq.total > 0 ? Math.round((performanceByType.mcq.correct / performanceByType.mcq.total) * 100) : 0
        },
        'Fill in the Blanks': {
          correct: performanceByType.fill.correct,
          total: performanceByType.fill.total,
          percentage: performanceByType.fill.total > 0 ? Math.round((performanceByType.fill.correct / performanceByType.fill.total) * 100) : 0
        },
        'Coding Questions': {
          correct: performanceByType.coding.correct,
          total: performanceByType.coding.total,
          percentage: performanceByType.coding.total > 0 ? Math.round((performanceByType.coding.correct / performanceByType.coding.total) * 100) : 0
        }
      }
    };
    
    const fileName = `AscendSkills_Quiz_Results_${selectedQuiz?.title?.replace(/\s+/g, '_') || 'Quiz'}.pdf`;
    await downloadQuizReport(quizData, fileName);
  }, [selectedQuiz?.title, quizQuestions, userAnswers, correctAnswers, score, timeTaken, performanceByType]);

    return (
      <div ref={containerRef} className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Trophy className="w-16 h-16 text-white" />
              </motion.div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Quiz Completed!
              </h1>
              <p className="text-xl text-gray-600">
                Great job on completing the {selectedQuiz?.title} quiz
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary-600">{score}%</div>
                  <div className="text-gray-600">Overall Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
                  <div className="text-gray-600">Correct Answers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600">{quizQuestions.length - correctAnswers}</div>
                  <div className="text-gray-600">Incorrect Answers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">{quizResult.grade}</div>
                  <div className="text-gray-600">Grade</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-black mb-4">Performance Analysis</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-black">MCQ Questions</span>
                    <span className="font-semibold text-black">{performanceByType.mcq.total > 0 ? Math.round((performanceByType.mcq.correct / performanceByType.mcq.total) * 100) : 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Fill in the Blanks</span>
                    <span className="font-semibold text-black">{performanceByType.fill.total > 0 ? Math.round((performanceByType.fill.correct / performanceByType.fill.total) * 100) : 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Coding Questions</span>
                    <span className="font-semibold text-black">{performanceByType.coding.total > 0 ? Math.round((performanceByType.coding.correct / performanceByType.coding.total) * 100) : 0}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-black mb-4">Time Analysis</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-black">Total Time Taken</span>
                    <span className="font-semibold text-black">{Math.floor(timeTaken / 60)} min {timeTaken % 60} sec</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Average per Question</span>
                    <span className="font-semibold text-black">{Math.floor(averageTimePerQuestion / 60)} min {averageTimePerQuestion % 60} sec</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Time Efficiency</span>
                    <span className="font-semibold text-green-600">
                      {averageTimePerQuestion < 60 ? 'Excellent' : 
                       averageTimePerQuestion < 120 ? 'Good' : 
                       averageTimePerQuestion < 180 ? 'Average' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setCurrentView('home')}
                className="flex items-center px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (currentView === 'quiz') {
    return (
      <QuizInterface
        questions={quizQuestions}
        onComplete={handleQuizComplete}
        onExit={() => setCurrentView('home')}
        quizTitle={selectedQuiz?.title || 'Quiz'}
        testDuration={selectedQuiz?.totalTimeLimit || 3600} // Use backend calculated total time in seconds
      />
    );
  }

  if (currentView === 'result') {
    return <QuizResult />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header/>
      {/* Hero Section */}
      <section className="bg-gradient-hero py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Practice with{' '}
              <span className="text-gradient-primary">Smart Quizzes</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive quiz platform with MCQs, coding challenges, and fill-in-the-blanks.
              Practice like the real exam with detailed analytics!
            </p>
            
            {/* Subscription Status for logged-in users */}
            {isAuthenticated() && userSubscription && (
              <div className="mt-6">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  userSubscription.isActive && userSubscription.type !== 'free'
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {userSubscription.isActive && userSubscription.type !== 'free' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Active Subscription - {userSubscription.type.charAt(0).toUpperCase() + userSubscription.type.slice(1)} Plan
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {userSubscription.type === 'free' ? 'Free Plan - Upgrade Required for Quizzes' : 'Subscription Required - Choose a plan to start practicing'}
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Quiz Mode Selector - 2 column split */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-12">
            <div className="w-full max-w-xl grid grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
              {[
                { id: 'topic', label: 'Topic-Based', icon: BookOpen },
                { id: 'company', label: 'Company-Wise', icon: Building }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center justify-center px-0 py-5 text-lg font-bold transition-all duration-300 w-full
                      ${isActive ? 'bg-gradient-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-r border-gray-200'}
                      ${tab.id === 'company' ? '' : ''}
                    `}
                    style={{ borderRight: tab.id === 'topic' ? '1px solid #e5e7eb' : undefined }}
                  >
                    <Icon className="w-6 h-6 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Only show the cards for the selected tab */}
          <div>
            {(loading || checkingSubscription) && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 mr-3" />
                <span className="text-lg font-semibold text-gray-700">
                  {loading ? 'Loading quiz categories...' : 'Checking subscription...'}
                </span>
              </div>
            )}
            {error && (
              <div className="text-center py-16">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
                  <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Authentication Required</h3>
                  <p className="text-blue-600 mb-4">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => router.push('/auth/login')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Login to Continue
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="border border-blue-300 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!loading && !error && filteredQuizzes.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-md mx-auto">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Quizzes Available</h3>
                  <p className="text-gray-600">No quizzes found for the selected category.</p>
                </div>
              </div>
            )}
            {!loading && !error && filteredQuizzes.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {filteredQuizzes.map((quiz, index) => {
                      const Icon = quiz.icon;
                      return (
                        <motion.div
                          key={quiz.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden card-hover h-full flex flex-col"
                        >
                          {(!userSubscription?.isActive || userSubscription?.type === 'free') && (
                            <div className="absolute top-4 right-4 z-10">
                              <div className="bg-gradient-secondary text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                                <Lock className="w-3 h-3 mr-1" />
                                Pro
                              </div>
                            </div>
                          )}
                          
                          {/* Quiz Card Content */}
                          <div className="p-6 flex-1 flex flex-col">
                            {/* Header with Icon and Title */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer truncate" title={quiz.title}>
                                    {quiz.title}
                                  </h3>
                                  <p className="text-gray-600 truncate">{quiz.description.substring(0, 50)}...</p>
                                </div>
                              </div>
                            </div>

                            {/* Quiz Details Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center text-gray-600 min-w-0">
                                <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="text-sm truncate" title={`${quiz.questions} questions`}>
                                  {quiz.questions} questions
                                </span>
                              </div>
                              <div className="flex items-center text-gray-600 min-w-0">
                                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="text-sm truncate" title={`${quiz.duration} minutes`}>
                                  {quiz.duration} min
                                </span>
                              </div>
                              <div className="flex items-center text-gray-600 min-w-0">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)} whitespace-nowrap`}>
                                  {quiz.difficulty}
                                </span>
                              </div>
                              <div className="flex items-center justify-end">
                                {(!userSubscription?.isActive || userSubscription?.type === 'free') && (
                                  <span className="px-2 py-1 bg-gradient-secondary text-white rounded-full text-xs font-medium whitespace-nowrap">
                                    Premium
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Skills/Tags Section */}
                            <div className="mb-4 flex-1">
                              <div className="flex flex-wrap gap-2">
                                {quiz.tags.slice(0, 4).map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs whitespace-nowrap"
                                    title={tag}
                                  >
                                    {tag.length > 12 ? `${tag.substring(0, 12)}...` : tag}
                                  </span>
                                ))}
                                {quiz.tags.length > 4 && (
                                  <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs whitespace-nowrap">
                                    +{quiz.tags.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Footer with Button */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                              <div className="flex items-center space-x-4 text-sm text-gray-500 min-w-0">
                                <div className="flex items-center min-w-0">
                                  <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                                  <span className="truncate">Available Now</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <button
                                  onClick={() => handleStartQuiz(quiz)}
                                  className={`px-4 py-2 text-sm whitespace-nowrap rounded-lg font-medium transition-all duration-300 ${
                                    (!userSubscription?.isActive || userSubscription?.type === 'free')
                                      ? 'bg-gradient-secondary text-white hover:shadow-lg transform hover:scale-105'
                                      : 'bg-gradient-primary text-white hover:shadow-lg transform hover:scale-105'
                                  }`}
                                >
                                  <Play className="w-4 h-4 mr-1 inline" />
                                  {(!userSubscription?.isActive || userSubscription?.type === 'free') ? 'Upgrade' : 'Start Quiz'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
              })}
            </div>
          )}
              </div>
        </div>
      </section>
      {/* Quiz Rules Modal */}
      {showRules && <QuizRulesModal />}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={handleSubscriptionModalClose}
        subscriptionPlans={subscriptionPlans}
      />
    </div>
  );
};

export default QuizPage; 