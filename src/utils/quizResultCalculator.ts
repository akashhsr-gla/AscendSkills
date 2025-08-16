import { QuizQuestion } from '@/services/quizService';

// Interface for frontend questions
export interface FrontendQuestion {
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
}

export interface QuizResult {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  score: number;
  percentage: number;
  grade: string;
  gradeColor: string;
  timeTaken: number; // in seconds
  averageTimePerQuestion: number;
  performanceByType: {
    mcq: { correct: number; total: number; percentage: number };
    fill: { correct: number; total: number; percentage: number };
    coding: { correct: number; total: number; percentage: number };
  };
  performanceByDifficulty: {
    easy: { correct: number; total: number; percentage: number };
    medium: { correct: number; total: number; percentage: number };
    hard: { correct: number; total: number; percentage: number };
  };
  questionAnalysis: Array<{
    id: string;
    type: string;
    difficulty: string;
    isCorrect: boolean;
    timeSpent: number;
    points: number;
    userAnswer: any;
    correctAnswer: any;
    explanation?: string;
  }>;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

export function calculateQuizResult(
  questions: QuizQuestion[],
  userAnswers: { [key: string]: any },
  timeTaken: number
): QuizResult {
  const totalQuestions = questions.length;
  let answeredQuestions = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let unansweredQuestions = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  const performanceByType = {
    mcq: { correct: 0, total: 0, percentage: 0 },
    fill: { correct: 0, total: 0, percentage: 0 },
    coding: { correct: 0, total: 0, percentage: 0 }
  };

  const performanceByDifficulty = {
    easy: { correct: 0, total: 0, percentage: 0 },
    medium: { correct: 0, total: 0, percentage: 0 },
    hard: { correct: 0, total: 0, percentage: 0 }
  };

  const questionAnalysis: QuizResult['questionAnalysis'] = [];

  // Analyze each question
  questions.forEach((question) => {
    const userAnswer = userAnswers[question._id];
    const hasAnswer = userAnswer !== undefined && userAnswer !== '';
    const questionType = question.type === 'mcqs' ? 'mcq' : 
                        question.type === 'fill_in_blanks' ? 'fill' : 'coding';
    
    // Count questions by type
    performanceByType[questionType].total++;
    
    // Count questions by difficulty
    performanceByDifficulty[question.difficulty].total++;
    
    if (hasAnswer) {
      answeredQuestions++;
      totalPoints += question.points || 1;
      
      let isCorrect = false;
      
      // Check if answer is correct based on question type
      switch (question.type) {
        case 'mcqs':
          isCorrect = userAnswer === question.mcqs?.correctOptionIndex;
          break;
        case 'fill_in_blanks':
          // Case-insensitive comparison for fill-in-blanks
          const normalizedUserAnswer = userAnswer.toString().toLowerCase().trim();
          const normalizedCorrectAnswer = question.correctAnswer.toString().toLowerCase().trim();
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
          break;
        case 'true_false':
          isCorrect = userAnswer === question.trueFalse?.correctAnswer;
          break;
        case 'coding':
          // For coding questions, check if submission exists and has points
          isCorrect = userAnswer?.submission && userAnswer?.points > 0;
          break;
        default:
          isCorrect = userAnswer === question.correctAnswer;
      }
      
      if (isCorrect) {
        correctAnswers++;
        earnedPoints += question.points || 1;
        performanceByType[questionType].correct++;
        performanceByDifficulty[question.difficulty].correct++;
      } else {
        incorrectAnswers++;
      }
      
      // Add to question analysis
      questionAnalysis.push({
        id: question._id,
        type: questionType,
        difficulty: question.difficulty,
        isCorrect,
        timeSpent: question.timeLimit || 60, // Default time limit
        points: isCorrect ? (question.points || 1) : 0,
        userAnswer: userAnswer,
        correctAnswer: getCorrectAnswer(question),
        explanation: question.explanation
      });
    } else {
      unansweredQuestions++;
      
      // Add unanswered question to analysis
      questionAnalysis.push({
        id: question._id,
        type: questionType,
        difficulty: question.difficulty,
        isCorrect: false,
        timeSpent: 0,
        points: 0,
        userAnswer: null,
        correctAnswer: getCorrectAnswer(question),
        explanation: question.explanation
      });
    }
  });

  // Calculate percentages
  Object.keys(performanceByType).forEach(type => {
    const typeData = performanceByType[type as keyof typeof performanceByType];
    typeData.percentage = typeData.total > 0 ? Math.round((typeData.correct / typeData.total) * 100) : 0;
  });

  Object.keys(performanceByDifficulty).forEach(difficulty => {
    const diffData = performanceByDifficulty[difficulty as keyof typeof performanceByDifficulty];
    diffData.percentage = diffData.total > 0 ? Math.round((diffData.correct / diffData.total) * 100) : 0;
  });

  // Calculate overall score
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // Calculate grade
  const { grade, gradeColor } = calculateGrade(score);

  // Calculate average time per question
  const averageTimePerQuestion = answeredQuestions > 0 ? Math.round(timeTaken / answeredQuestions) : 0;

  // Generate recommendations and analysis
  const { recommendations, strengths, weaknesses } = generateAnalysis(
    performanceByType,
    performanceByDifficulty,
    questionAnalysis,
    score
  );

  return {
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    incorrectAnswers,
    unansweredQuestions,
    score,
    percentage,
    grade,
    gradeColor,
    timeTaken,
    averageTimePerQuestion,
    performanceByType,
    performanceByDifficulty,
    questionAnalysis,
    recommendations,
    strengths,
    weaknesses
  };
}

function getCorrectAnswer(question: QuizQuestion): any {
  switch (question.type) {
    case 'mcqs':
      return question.mcqs?.options?.[question.mcqs.correctOptionIndex || 0];
    case 'fill_in_blanks':
      return question.correctAnswer;
    case 'true_false':
      return question.trueFalse?.correctAnswer;
    case 'coding':
      return 'Code submission required';
    default:
      return question.correctAnswer;
  }
}

function calculateGrade(score: number): { grade: string; gradeColor: string } {
  if (score >= 90) return { grade: 'A+', gradeColor: 'text-green-600' };
  if (score >= 80) return { grade: 'A', gradeColor: 'text-green-500' };
  if (score >= 70) return { grade: 'B+', gradeColor: 'text-blue-600' };
  if (score >= 60) return { grade: 'B', gradeColor: 'text-blue-500' };
  if (score >= 50) return { grade: 'C+', gradeColor: 'text-yellow-600' };
  if (score >= 40) return { grade: 'C', gradeColor: 'text-yellow-500' };
  if (score >= 30) return { grade: 'D', gradeColor: 'text-orange-500' };
  return { grade: 'F', gradeColor: 'text-red-500' };
}

function generateAnalysis(
  performanceByType: any,
  performanceByDifficulty: any,
  questionAnalysis: any[],
  score: number
): { recommendations: string[]; strengths: string[]; weaknesses: string[] } {
  const recommendations: string[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Analyze performance by type
  Object.entries(performanceByType).forEach(([type, data]: [string, any]) => {
    if (data.percentage >= 80) {
      strengths.push(`Strong performance in ${type.toUpperCase()} questions (${data.percentage}%)`);
    } else if (data.percentage < 50) {
      weaknesses.push(`Needs improvement in ${type.toUpperCase()} questions (${data.percentage}%)`);
      recommendations.push(`Practice more ${type.toUpperCase()} questions to improve your score`);
    }
  });

  // Analyze performance by difficulty
  Object.entries(performanceByDifficulty).forEach(([difficulty, data]: [string, any]) => {
    if (data.total > 0) {
      if (data.percentage >= 80) {
        strengths.push(`Excellent in ${difficulty} difficulty questions (${data.percentage}%)`);
      } else if (data.percentage < 50) {
        weaknesses.push(`Struggles with ${difficulty} difficulty questions (${data.percentage}%)`);
        recommendations.push(`Focus on practicing ${difficulty} level questions`);
      }
    }
  });

  // Overall score analysis
  if (score >= 80) {
    strengths.push('Excellent overall performance');
    recommendations.push('Maintain this level of preparation');
  } else if (score >= 60) {
    strengths.push('Good foundation');
    recommendations.push('Focus on weak areas to improve further');
  } else {
    weaknesses.push('Overall score needs improvement');
    recommendations.push('Consider reviewing fundamental concepts');
  }

  // Time management analysis
  const slowQuestions = questionAnalysis.filter(q => q.timeSpent > (q.difficulty === 'easy' ? 30 : q.difficulty === 'medium' ? 60 : 90));
  if (slowQuestions.length > 0) {
    weaknesses.push(`Time management issues on ${slowQuestions.length} questions`);
    recommendations.push('Practice time management and quick problem-solving');
  }

  // Unanswered questions analysis
  const unansweredCount = questionAnalysis.filter(q => q.userAnswer === null).length;
  if (unansweredCount > 0) {
    weaknesses.push(`${unansweredCount} questions left unanswered`);
    recommendations.push('Try to attempt all questions, even if unsure');
  }

  return { recommendations, strengths, weaknesses };
}

// Function for frontend questions
export function calculateFrontendQuizResult(
  questions: FrontendQuestion[],
  userAnswers: { [key: string]: any },
  timeTaken: number
): QuizResult {
  const totalQuestions = questions.length;
  let answeredQuestions = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let unansweredQuestions = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  const performanceByType = {
    mcq: { correct: 0, total: 0, percentage: 0 },
    fill: { correct: 0, total: 0, percentage: 0 },
    coding: { correct: 0, total: 0, percentage: 0 }
  };

  const performanceByDifficulty = {
    easy: { correct: 0, total: 0, percentage: 0 },
    medium: { correct: 0, total: 0, percentage: 0 },
    hard: { correct: 0, total: 0, percentage: 0 }
  };

  const questionAnalysis: QuizResult['questionAnalysis'] = [];

  // Analyze each question
  questions.forEach((question) => {
    const userAnswer = userAnswers[question.id];
    const hasAnswer = userAnswer !== undefined && userAnswer !== '';
    const questionType = question.type;
    
    // Count questions by type
    performanceByType[questionType].total++;
    
    // Count questions by difficulty (convert to lowercase)
    const difficulty = question.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
    performanceByDifficulty[difficulty].total++;
    
    if (hasAnswer) {
      answeredQuestions++;
      totalPoints += 1; // Default 1 point per question
      
      let isCorrect = false;
      
      // Check if answer is correct based on question type
      switch (question.type) {
        case 'mcq':
          isCorrect = userAnswer === question.correctAnswer;
          break;
        case 'fill':
          // Case-insensitive comparison for fill-in-blanks
          const normalizedUserAnswer = userAnswer.toString().toLowerCase().trim();
          const normalizedCorrectAnswer = question.correctAnswer?.toString().toLowerCase().trim();
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
          break;
        case 'coding':
          // For coding questions, check if submission exists
          isCorrect = userAnswer?.code && userAnswer?.language;
          break;
        default:
          isCorrect = userAnswer === question.correctAnswer;
      }
      
      if (isCorrect) {
        correctAnswers++;
        earnedPoints += 1;
        performanceByType[questionType].correct++;
        performanceByDifficulty[difficulty].correct++;
      } else {
        incorrectAnswers++;
      }
      
      // Add to question analysis
      questionAnalysis.push({
        id: question.id,
        type: questionType,
        difficulty: difficulty,
        isCorrect,
        timeSpent: question.timeLimit || 60,
        points: isCorrect ? 1 : 0,
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      });
    } else {
      unansweredQuestions++;
      
      // Add unanswered question to analysis
      questionAnalysis.push({
        id: question.id,
        type: questionType,
        difficulty: difficulty,
        isCorrect: false,
        timeSpent: 0,
        points: 0,
        userAnswer: null,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      });
    }
  });

  // Calculate percentages
  Object.keys(performanceByType).forEach(type => {
    const typeData = performanceByType[type as keyof typeof performanceByType];
    typeData.percentage = typeData.total > 0 ? Math.round((typeData.correct / typeData.total) * 100) : 0;
  });

  Object.keys(performanceByDifficulty).forEach(difficulty => {
    const diffData = performanceByDifficulty[difficulty as keyof typeof performanceByDifficulty];
    diffData.percentage = diffData.total > 0 ? Math.round((diffData.correct / diffData.total) * 100) : 0;
  });

  // Calculate overall score
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // Calculate grade
  const { grade, gradeColor } = calculateGrade(score);

  // Calculate average time per question
  const averageTimePerQuestion = answeredQuestions > 0 ? Math.round(timeTaken / answeredQuestions) : 0;

  // Generate recommendations and analysis
  const { recommendations, strengths, weaknesses } = generateAnalysis(
    performanceByType,
    performanceByDifficulty,
    questionAnalysis,
    score
  );

  return {
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    incorrectAnswers,
    unansweredQuestions,
    score,
    percentage,
    grade,
    gradeColor,
    timeTaken,
    averageTimePerQuestion,
    performanceByType,
    performanceByDifficulty,
    questionAnalysis,
    recommendations,
    strengths,
    weaknesses
  };
}

// Helper function to format time
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Helper function to get performance color
export function getPerformanceColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-blue-600';
  if (percentage >= 40) return 'text-yellow-600';
  return 'text-red-600';
} 