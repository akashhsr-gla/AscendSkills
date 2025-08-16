'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Target,
  Clock,
  TrendingUp,
  BarChart3,
  Share2,
  RotateCcw,
  Home,
  Star,
  Award,
  CheckCircle,
  XCircle,
  Zap,
  Brain,
  Eye,
  Flag,
  Calendar,
  Users,
  Code,
  FileText,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Download
} from 'lucide-react';
import { downloadElementAsPDF } from '@/utils/pdf';

interface Question {
  id: string;
  type: 'mcq' | 'fill' | 'coding';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;
  tags?: string[];
}

interface QuizResultsProps {
  questions: Question[];
  userAnswers: {[key: string]: any};
  quizTitle: string;
  totalTime: number;
  onRetake: () => void;
  onHome: () => void;
  flaggedQuestions?: number[];
}

const QuizResults: React.FC<QuizResultsProps> = ({
  questions,
  userAnswers,
  quizTitle,
  totalTime,
  onRetake,
  onHome,
  flaggedQuestions = []
}) => {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'review'>('overview');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!containerRef.current) return;
    const fileName = `AscendSkills_Quiz_Results_${quizTitle.replace(/\s+/g, '_')}.pdf`;
    await downloadElementAsPDF(containerRef.current, fileName, {
      title: `Quiz Results - ${quizTitle}`,
      fileName,
    });
  }, [quizTitle]);

  // Calculate results
  const calculateResults = () => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const difficultyStats = { Easy: { correct: 0, total: 0 }, Medium: { correct: 0, total: 0 }, Hard: { correct: 0, total: 0 } };
    const typeStats = { mcq: { correct: 0, total: 0 }, fill: { correct: 0, total: 0 }, coding: { correct: 0, total: 0 } };

    questions.forEach((question) => {
      const userAnswer = userAnswers[question.id];
      let isCorrect = false;

      if (userAnswer !== undefined && userAnswer !== '') {
        if (question.type === 'mcq') {
          isCorrect = userAnswer === question.correctAnswer;
        } else if (question.type === 'fill') {
          isCorrect = userAnswer.toString().toLowerCase().trim() === question.correctAnswer?.toString().toLowerCase().trim();
        }

        if (isCorrect) {
          correct++;
          difficultyStats[question.difficulty].correct++;
          typeStats[question.type].correct++;
        } else {
          incorrect++;
        }
      } else {
        unanswered++;
      }

      difficultyStats[question.difficulty].total++;
      typeStats[question.type].total++;
    });

    const score = Math.round((correct / questions.length) * 100);
    const accuracy = questions.length > 0 ? Math.round((correct / (correct + incorrect || 1)) * 100) : 0;

    return {
      correct,
      incorrect,
      unanswered,
      score,
      accuracy,
      difficultyStats,
      typeStats
    };
  };

  const results = calculateResults();

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'bg-green-500' };
    if (score >= 80) return { grade: 'A', color: 'bg-green-400' };
    if (score >= 70) return { grade: 'B+', color: 'bg-blue-500' };
    if (score >= 60) return { grade: 'B', color: 'bg-blue-400' };
    if (score >= 50) return { grade: 'C', color: 'bg-yellow-500' };
    return { grade: 'F', color: 'bg-red-500' };
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const grade = getGrade(results.score);

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
      {/* Header */}
      <div className="backdrop-blur bg-white/80 shadow-lg border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight drop-shadow">Quiz Results</h1>
            <p className="text-black mt-1 text-lg font-semibold">{quizTitle}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onHome}
              className="flex items-center px-5 py-3 border-2 border-gray-300 rounded-xl text-black font-bold hover:bg-gray-50 transition"
            >
              <Home className="w-5 h-5 mr-2" />
              Home
            </button>
            <button
              onClick={onRetake}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-100 to-blue-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${grade.color} text-white mb-8 shadow-2xl border-4 border-white/60`}> 
              <span className="text-5xl font-extrabold drop-shadow-lg">{grade.grade}</span>
            </div>
            <h2 className="text-5xl font-extrabold text-black mb-4 drop-shadow">Congratulations!</h2>
            <p className="text-2xl text-black mb-8 font-semibold">
              You scored <span className={`font-extrabold ${getScoreColor(results.score)}`}>{results.score}%</span> on this quiz
            </p>
            <div className="flex items-center justify-center space-x-12">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-green-600">{results.correct}</div>
                <div className="text-lg text-black font-semibold">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-red-600">{results.incorrect}</div>
                <div className="text-lg text-black font-semibold">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-black">{results.unanswered}</div>
                <div className="text-lg text-black font-semibold">Unanswered</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-blue-600">{formatTime(totalTime)}</div>
                <div className="text-lg text-black font-semibold">Total Time</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Navigation Tabs */}
      <div className="bg-white/90 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex space-x-12">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'performance', label: 'Performance', icon: TrendingUp },
              { id: 'review', label: 'Review Questions', icon: Eye }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-6 py-5 border-b-4 text-xl font-bold transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 bg-gradient-to-r from-blue-100 to-blue-50'
                      : 'border-transparent text-black hover:text-blue-700'
                  }`}
                >
                  <Icon className="w-6 h-6 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-12">
              {/* Score Breakdown */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 rounded-2xl p-8 shadow-2xl border-2 border-blue-100 flex flex-col items-center"
                >
                  <Trophy className="w-10 h-10 text-yellow-500 mb-3" />
                  <span className={`text-4xl font-extrabold ${getScoreColor(results.score)}`}>{results.score}%</span>
                  <h3 className="font-bold text-black mt-4">Overall Score</h3>
                  <p className="text-base text-black">Your performance rating</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/90 rounded-2xl p-8 shadow-2xl border-2 border-blue-100 flex flex-col items-center"
                >
                  <Target className="w-10 h-10 text-blue-500 mb-3" />
                  <span className="text-4xl font-extrabold text-blue-600">{results.accuracy}%</span>
                  <h3 className="font-bold text-black mt-4">Accuracy</h3>
                  <p className="text-base text-black">Attempted questions correct</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/90 rounded-2xl p-8 shadow-2xl border-2 border-blue-100 flex flex-col items-center"
                >
                  <Clock className="w-10 h-10 text-green-500 mb-3" />
                  <span className="text-4xl font-extrabold text-green-600">{Math.round(totalTime / questions.length)}s</span>
                  <h3 className="font-bold text-black mt-4">Avg. Time</h3>
                  <p className="text-base text-black">Per question</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/90 rounded-2xl p-8 shadow-2xl border-2 border-blue-100 flex flex-col items-center"
                >
                  <Star className="w-10 h-10 text-purple-500 mb-3" />
                  <span className="text-4xl font-extrabold text-purple-600">{grade.grade}</span>
                  <h3 className="font-bold text-black mt-4">Grade</h3>
                  <p className="text-base text-black">Performance grade</p>
                </motion.div>
              </div>
              {/* Detailed Breakdown */}
              <div className="grid lg:grid-cols-2 gap-10">
                {/* Difficulty Analysis */}
                <div className="bg-white/90 rounded-2xl p-8 shadow-xl border-2 border-blue-100">
                  <h3 className="text-2xl font-bold text-black mb-6">Performance by Difficulty</h3>
                  <div className="space-y-6">
                    {Object.entries(results.difficultyStats).map(([difficulty, stats]) => {
                      const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                      return (
                        <div key={difficulty}>
                          <div className="flex justify-between mb-2">
                            <span className="font-semibold text-black">{difficulty}</span>
                            <span className="text-base text-black">{stats.correct}/{stats.total} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-1000 ${
                                difficulty === 'Easy' ? 'bg-green-500' :
                                difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Question Type Analysis */}
                <div className="bg-white/90 rounded-2xl p-8 shadow-xl border-2 border-blue-100">
                  <h3 className="text-2xl font-bold text-black mb-6">Performance by Question Type</h3>
                  <div className="space-y-6">
                    {Object.entries(results.typeStats).map(([type, stats]) => {
                      const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                      const icon = type === 'mcq' ? BookOpen : type === 'fill' ? FileText : Code;
                      const Icon = icon;
                      return (
                        <div key={type} className="flex items-center space-x-6">
                          <Icon className="w-8 h-8 text-primary-500" />
                          <div className="flex-1">
                            <div className="flex justify-between mb-2">
                              <span className="font-semibold text-black capitalize">
                                {type === 'mcq' ? 'Multiple Choice' : type === 'fill' ? 'Fill in Blanks' : 'Coding'}
                              </span>
                              <span className="text-base text-black">{stats.correct}/{stats.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-primary-500 h-3 rounded-full transition-all duration-1000"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-12">
              <div className="bg-white/90 rounded-2xl p-10 shadow-2xl border-2 border-blue-100">
                <h3 className="text-2xl font-bold text-black mb-8">Performance Analysis</h3>
                <div className="grid md:grid-cols-3 gap-10">
                  <div className="text-center">
                    <Clock className="w-14 h-14 text-blue-500 mx-auto mb-4" />
                    <div className="text-3xl font-extrabold text-black">{formatTime(totalTime)}</div>
                    <div className="text-lg text-black font-semibold">Total Time</div>
                  </div>
                  <div className="text-center">
                    <Target className="w-14 h-14 text-green-500 mx-auto mb-4" />
                    <div className="text-3xl font-extrabold text-black">{results.accuracy}%</div>
                    <div className="text-lg text-black font-semibold">Accuracy Rate</div>
                  </div>
                  <div className="text-center">
                    <Star className="w-14 h-14 text-purple-500 mx-auto mb-4" />
                    <div className="text-3xl font-extrabold text-black">{grade.grade}</div>
                    <div className="text-lg text-black font-semibold">Final Grade</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Review Tab */}
          {activeTab === 'review' && (
            <div className="space-y-10">
              <div className="bg-white/90 rounded-2xl p-10 shadow-2xl border-2 border-blue-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-black">Question Review</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setCurrentReviewIndex(Math.max(0, currentReviewIndex - 1))}
                      disabled={currentReviewIndex === 0}
                      className="p-3 border-2 border-gray-300 rounded-xl disabled:opacity-50 bg-white font-bold"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-lg text-black font-semibold">
                      {currentReviewIndex + 1} of {questions.length}
                    </span>
                    <button
                      onClick={() => setCurrentReviewIndex(Math.min(questions.length - 1, currentReviewIndex + 1))}
                      disabled={currentReviewIndex === questions.length - 1}
                      className="p-3 border-2 border-gray-300 rounded-xl disabled:opacity-50 bg-white font-bold"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-10 gap-3 mb-8">
                  {questions.map((question, index) => {
                    const userAnswer = userAnswers[question.id];
                    const isCorrect = userAnswer === question.correctAnswer;
                    const isAttempted = userAnswer !== undefined && userAnswer !== '';
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentReviewIndex(index)}
                        className={`w-12 h-12 rounded-xl text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          index === currentReviewIndex
                            ? 'bg-primary-500 text-white'
                            : isCorrect
                            ? 'bg-green-100 text-green-600'
                            : isAttempted
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-black'
                        }`}
                        aria-label={`Review question ${index + 1}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                {/* Current Question Review */}
                {questions[currentReviewIndex] && (
                  <div className="border-t pt-8 mt-8">
                    <h4 className="text-2xl font-bold text-black mb-6">
                      {questions[currentReviewIndex].question}
                    </h4>
                    <div className="flex flex-col gap-6">
                      {questions[currentReviewIndex].type === 'mcq' && (
                        <div className="flex flex-col gap-2">
                          <span className="font-semibold text-black">Your Answer: <span className="text-blue-700 font-bold">{userAnswers[questions[currentReviewIndex].id] !== undefined ? String.fromCharCode(65 + userAnswers[questions[currentReviewIndex].id]) : '—'}</span></span>
                          <span className="font-semibold text-black">Correct Answer: <span className="text-green-700 font-bold">{questions[currentReviewIndex].correctAnswer !== undefined ? String.fromCharCode(65 + (questions[currentReviewIndex].correctAnswer as number)) : '—'}</span></span>
                        </div>
                      )}
                      {questions[currentReviewIndex].type === 'fill' && (
                        <div className="flex flex-col gap-2">
                          <span className="font-semibold text-black">Your Answer: <span className="text-blue-700 font-bold">{userAnswers[questions[currentReviewIndex].id] || '—'}</span></span>
                          <span className="font-semibold text-black">Correct Answer: <span className="text-green-700 font-bold">{questions[currentReviewIndex].correctAnswer || '—'}</span></span>
                        </div>
                      )}
                      {questions[currentReviewIndex].type === 'coding' && (
                        <div className="flex flex-col gap-4">
                          <div>
                            <span className="font-semibold text-black">Your Code:</span>
                            <pre className="bg-gray-900 text-green-400 rounded-xl p-4 overflow-x-auto text-sm font-mono mt-2">
                              {userAnswers[questions[currentReviewIndex].id]?.code || '// No code submitted'}
                            </pre>
                          </div>
                          {userAnswers[questions[currentReviewIndex].id]?.language && (
                            <div>
                              <span className="font-semibold text-black">Language: </span>
                              <span className="text-blue-700 font-bold">{userAnswers[questions[currentReviewIndex].id].language}</span>
                            </div>
                          )}
                          {userAnswers[questions[currentReviewIndex].id]?.submission && (
                            <div>
                              <span className="font-semibold text-black">Status: </span>
                              <span className="text-green-700 font-bold">Submitted successfully</span>
                            </div>
                          )}
                          {userAnswers[questions[currentReviewIndex].id]?.points && (
                            <div>
                              <span className="font-semibold text-black">Points: </span>
                              <span className="text-purple-700 font-bold">{userAnswers[questions[currentReviewIndex].id].points}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {questions[currentReviewIndex].explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-4">
                          <div className="flex items-center mb-2">
                            <Lightbulb className="w-6 h-6 text-blue-600 mr-2" />
                            <span className="font-bold text-blue-800 text-lg">Explanation</span>
                          </div>
                          <p className="text-blue-800 text-base font-medium">{questions[currentReviewIndex].explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            <button
              onClick={onRetake}
              className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-2xl font-bold text-xl hover:scale-105 shadow-lg transition"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Retake Quiz
            </button>
            <button onClick={handleDownload} className="flex items-center px-8 py-4 border-2 border-gray-300 text-black rounded-2xl font-bold text-xl hover:bg-gray-50 transition">
              <Download className="w-6 h-6 mr-2" />
              Download PDF
            </button>
            <button className="flex items-center px-8 py-4 border-2 border-gray-300 text-black rounded-2xl font-bold text-xl hover:bg-gray-50 transition">
              <Share2 className="w-6 h-6 mr-2" />
              Share Results
            </button>
            <button
              onClick={onHome}
              className="flex items-center px-8 py-4 border-2 border-gray-300 text-black rounded-2xl font-bold text-xl hover:bg-gray-50 transition"
            >
              <Home className="w-6 h-6 mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults; 