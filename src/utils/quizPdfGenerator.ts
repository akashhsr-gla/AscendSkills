/**
 * Quiz Results PDF Generator
 * Creates structured PDFs for quiz results using backend data
 */

import StructuredPDFGenerator from './structuredPdf';

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

interface QuizResultsData {
  questions: Question[];
  userAnswers: {[key: string]: any};
  quizTitle: string;
  totalTime: number;
  flaggedQuestions?: number[];
}

export const generateQuizResultsPDF = async (data: QuizResultsData): Promise<Blob> => {
  const { questions, userAnswers, quizTitle, totalTime, flaggedQuestions = [] } = data;

  const pdf = new StructuredPDFGenerator({
    title: `Quiz Results - ${quizTitle}`,
    author: 'Ascend Skills',
    subject: 'Quiz Assessment Report'
  });

  // Add header to first page
  pdf.addHeader();

  // Main title
  pdf.addTitle(
    'Quiz Results Report',
    quizTitle
  );

  // Calculate results
  const results = calculateResults(questions, userAnswers);

  // Overall score section
  pdf.addSection('Overall Performance');
  
  // Grade display
  const grade = getGrade(results.score);
  pdf.addText(`Final Grade: ${grade.grade}`, {
    fontSize: 18,
    fontStyle: 'bold',
    align: 'center'
  });
  
  pdf.addText(`Score: ${results.score}%`, {
    fontSize: 16,
    fontStyle: 'bold',
    align: 'center'
  });

  pdf.addSpace(10);

  // Score summary cards
  const startY = pdf.currentY;
  pdf.addScoreCard('Score', results.score, 20, startY, 35);
  pdf.addScoreCard('Accuracy', results.accuracy, 65, startY, 35);
  pdf.addScoreCard('Correct', results.correct, 110, startY, 35);
  pdf.addScoreCard('Wrong', results.incorrect, 155, startY, 35);
  
  pdf.currentY = startY + 35;

  // Performance metrics
  pdf.addSection('Performance Summary');
  
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Questions', `${questions.length}`],
    ['Correct Answers', `${results.correct}`],
    ['Incorrect Answers', `${results.incorrect}`],
    ['Unanswered', `${results.unanswered}`],
    ['Accuracy Rate', `${results.accuracy}%`],
    ['Total Time', formatTime(totalTime)],
    ['Average Time per Question', formatTime(Math.round(totalTime / questions.length))],
    ['Grade', grade.grade]
  ];
  
  pdf.addTable(summaryData[0], summaryData.slice(1));
  pdf.addSpace(10);

  // Performance by difficulty
  pdf.addSection('Performance by Difficulty Level');
  
  const difficultyData = [
    ['Difficulty', 'Correct', 'Total', 'Percentage']
  ];
  
  Object.entries(results.difficultyStats).forEach(([difficulty, stats]) => {
    const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    difficultyData.push([difficulty, `${stats.correct}`, `${stats.total}`, `${percentage}%`]);
  });
  
  pdf.addTable(difficultyData[0], difficultyData.slice(1));
  pdf.addSpace(10);

  // Performance by question type
  pdf.addSection('Performance by Question Type');
  
  const typeData = [
    ['Question Type', 'Correct', 'Total', 'Percentage']
  ];
  
  Object.entries(results.typeStats).forEach(([type, stats]) => {
    const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    const typeName = type === 'mcq' ? 'Multiple Choice' : 
                    type === 'fill' ? 'Fill in Blanks' : 'Coding';
    typeData.push([typeName, `${stats.correct}`, `${stats.total}`, `${percentage}%`]);
  });
  
  pdf.addTable(typeData[0], typeData.slice(1));
  pdf.addSpace(10);

  // Detailed question review
  pdf.addSection('Detailed Question Review');
  
  questions.forEach((question, index) => {
    const userAnswer = userAnswers[question.id];
    const isCorrect = checkAnswer(question, userAnswer);
    const isAttempted = userAnswer !== undefined && userAnswer !== '';
    const isFlagged = flaggedQuestions.includes(index);
    
    // Question header
    pdf.addText(`Question ${index + 1}: ${question.question}`, {
      fontSize: 12,
      fontStyle: 'bold'
    });
    
    // Question metadata
    const statusText = isCorrect ? '✓ Correct' : isAttempted ? '✗ Incorrect' : '- Unanswered';
    const statusColor = isCorrect ? '#059669' : isAttempted ? '#dc2626' : '#6b7280';
    
    pdf.addText(`Difficulty: ${question.difficulty} | Type: ${getQuestionTypeName(question.type)} | Status: ${statusText}${isFlagged ? ' | 🏁 Flagged' : ''}`, {
      fontSize: 9,
      color: statusColor
    });
    
    pdf.addSpace(3);
    
    // Multiple choice options
    if (question.type === 'mcq' && question.options) {
      pdf.addText('Options:', { fontSize: 10, fontStyle: 'bold' });
      question.options.forEach((option, optionIndex) => {
        const letter = String.fromCharCode(65 + optionIndex);
        const isSelected = userAnswer === optionIndex;
        const isCorrectOption = question.correctAnswer === optionIndex;
        
        let optionText = `${letter}. ${option}`;
        let optionColor = '#6b7280';
        
        if (isSelected && isCorrectOption) {
          optionText += ' ✓ (Your answer - Correct)';
          optionColor = '#059669';
        } else if (isSelected) {
          optionText += ' ✗ (Your answer - Incorrect)';
          optionColor = '#dc2626';
        } else if (isCorrectOption) {
          optionText += ' ✓ (Correct answer)';
          optionColor = '#059669';
        }
        
        pdf.addText(optionText, { 
          fontSize: 9, 
          indent: 5,
          color: optionColor
        });
      });
    }
    
    // Fill in the blank answer
    if (question.type === 'fill') {
      pdf.addText(`Your Answer: ${userAnswer || 'Not answered'}`, { 
        fontSize: 10,
        color: isCorrect ? '#059669' : '#dc2626'
      });
      pdf.addText(`Correct Answer: ${question.correctAnswer}`, { 
        fontSize: 10,
        color: '#059669'
      });
    }
    
    // Coding question
    if (question.type === 'coding') {
      if (userAnswer?.code) {
        pdf.addText('Your Code:', { fontSize: 10, fontStyle: 'bold' });
        pdf.addText(userAnswer.code, { 
          fontSize: 8,
          indent: 5,
          color: '#1f2937'
        });
        
        if (userAnswer.language) {
          pdf.addText(`Language: ${userAnswer.language}`, { 
            fontSize: 9,
            color: '#6b7280'
          });
        }
        
        if (userAnswer.points) {
          pdf.addText(`Points Earned: ${userAnswer.points}`, { 
            fontSize: 9,
            color: '#0369a1'
          });
        }
      } else {
        pdf.addText('No code submitted', { 
          fontSize: 10,
          color: '#dc2626'
        });
      }
    }
    
    // Explanation
    if (question.explanation) {
      pdf.addText('Explanation:', { fontSize: 10, fontStyle: 'bold' });
      pdf.addText(question.explanation, { 
        fontSize: 9,
        indent: 5,
        color: '#374151'
      });
    }
    
    pdf.addSpace(8);
  });

  // Performance insights
  pdf.addSection('Performance Insights');
  
  const insights = generateInsights(results);
  pdf.addList(insights);
  
  pdf.addSpace(10);

  // Study recommendations
  pdf.addSection('Study Recommendations');
  
  const recommendations = generateRecommendations(results);
  pdf.addList(recommendations);

  // Quiz metadata
  pdf.addSection('Quiz Information');
  pdf.addText(`Quiz Title: ${quizTitle}`, { fontSize: 9 });
  pdf.addText(`Total Questions: ${questions.length}`, { fontSize: 9 });
  pdf.addText(`Total Time: ${formatTime(totalTime)}`, { fontSize: 9 });
  pdf.addText(`Generated: ${new Date().toLocaleString()}`, { fontSize: 9 });
  pdf.addText('Report Type: Quiz Assessment Results', { fontSize: 9 });

  return pdf.getBlob();
};

// Helper functions
const calculateResults = (questions: Question[], userAnswers: {[key: string]: any}) => {
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  const difficultyStats = { 
    Easy: { correct: 0, total: 0 }, 
    Medium: { correct: 0, total: 0 }, 
    Hard: { correct: 0, total: 0 } 
  };
  const typeStats = { 
    mcq: { correct: 0, total: 0 }, 
    fill: { correct: 0, total: 0 }, 
    coding: { correct: 0, total: 0 } 
  };

  questions.forEach((question) => {
    const userAnswer = userAnswers[question.id];
    const isCorrect = checkAnswer(question, userAnswer);

    if (userAnswer !== undefined && userAnswer !== '') {
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

const checkAnswer = (question: Question, userAnswer: any): boolean => {
  if (userAnswer === undefined || userAnswer === '') return false;
  
  if (question.type === 'mcq') {
    return userAnswer === question.correctAnswer;
  } else if (question.type === 'fill') {
    return userAnswer.toString().toLowerCase().trim() === 
           question.correctAnswer?.toString().toLowerCase().trim();
  }
  // For coding questions, we assume they're correct if submitted (simplified)
  return question.type === 'coding' && userAnswer.code;
};

const getGrade = (score: number) => {
  if (score >= 90) return { grade: 'A+', color: '#059669' };
  if (score >= 80) return { grade: 'A', color: '#059669' };
  if (score >= 70) return { grade: 'B+', color: '#0369a1' };
  if (score >= 60) return { grade: 'B', color: '#0369a1' };
  if (score >= 50) return { grade: 'C', color: '#d97706' };
  return { grade: 'F', color: '#dc2626' };
};

const getQuestionTypeName = (type: string): string => {
  switch (type) {
    case 'mcq': return 'Multiple Choice';
    case 'fill': return 'Fill in Blanks';
    case 'coding': return 'Coding';
    default: return type;
  }
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
};

const generateInsights = (results: any): string[] => {
  const insights = [];
  
  if (results.score >= 80) {
    insights.push('Excellent performance! You demonstrated strong understanding of the concepts.');
  } else if (results.score >= 60) {
    insights.push('Good performance with room for improvement in some areas.');
  } else {
    insights.push('Consider reviewing the material and practicing more before retaking.');
  }
  
  if (results.accuracy > results.score) {
    insights.push('You have good accuracy on attempted questions. Try to answer more questions next time.');
  }
  
  // Difficulty analysis
  const hardStats = results.difficultyStats.Hard;
  const easyStats = results.difficultyStats.Easy;
  
  if (hardStats.total > 0 && (hardStats.correct / hardStats.total) > 0.7) {
    insights.push('Strong performance on difficult questions shows deep understanding.');
  }
  
  if (easyStats.total > 0 && (easyStats.correct / easyStats.total) < 0.8) {
    insights.push('Focus on mastering fundamental concepts to improve performance on easier questions.');
  }
  
  return insights;
};

const generateRecommendations = (results: any): string[] => {
  const recommendations = [];
  
  // Type-specific recommendations
  Object.entries(results.typeStats).forEach(([type, stats]: [string, any]) => {
    const percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    
    if (percentage < 60) {
      switch (type) {
        case 'mcq':
          recommendations.push('Practice multiple choice questions to improve elimination strategies and concept recognition.');
          break;
        case 'fill':
          recommendations.push('Review key terms and concepts to improve performance on fill-in-the-blank questions.');
          break;
        case 'coding':
          recommendations.push('Practice coding problems and review programming fundamentals.');
          break;
      }
    }
  });
  
  // Difficulty-specific recommendations
  Object.entries(results.difficultyStats).forEach(([difficulty, stats]: [string, any]) => {
    const percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    
    if (percentage < 60) {
      switch (difficulty) {
        case 'Easy':
          recommendations.push('Focus on fundamental concepts and basic problem-solving techniques.');
          break;
        case 'Medium':
          recommendations.push('Practice intermediate-level problems to build confidence.');
          break;
        case 'Hard':
          recommendations.push('Challenge yourself with advanced topics and complex problem-solving scenarios.');
          break;
      }
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push('Continue practicing to maintain your excellent performance!');
    recommendations.push('Consider challenging yourself with more advanced topics.');
  }
  
  return recommendations;
};

export default generateQuizResultsPDF;
