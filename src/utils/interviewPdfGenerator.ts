/**
 * Interview Report PDF Generator
 * Creates structured PDFs for interview reports using backend data
 */

import StructuredPDFGenerator from './structuredPdf';
import { DetailedInterviewReport } from '@/services/interviewService';

interface AssessmentReport {
  overallScore: number;
  breakdown: {
    communication: number;
    technical: number;
    problemSolving: number;
    confidence: number;
  };
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  feedback: string;
  metrics?: {
    averageConfidence: number;
    totalViolations: number;
    completionRate: number;
    averageWordCount?: number;
    questionsWithAI?: number;
    totalQuestions?: number;
    totalResponses?: number;
  };
  detailedScores?: {
    clarity: number;
    relevance: number;
    depth: number;
    structure: number;
  };
  responseMetrics?: {
    totalWords: number;
    avgWordsPerResponse: number;
    avgComplexity: number;
    avgRelevance: number;
  };
}

export const generateInterviewReportPDF = async (
  report: AssessmentReport,
  interviewId?: string,
  detailedReport?: DetailedInterviewReport
): Promise<Blob> => {
  const pdf = new StructuredPDFGenerator({
    title: 'Interview Assessment Report',
    author: 'Ascend Skills',
    subject: 'AI-Powered Interview Assessment'
  });

  // Add header to first page
  pdf.addHeader();

  // Main title
  pdf.addTitle(
    'Interview Assessment Report',
    'Comprehensive AI-Powered Analysis'
  );

  // Overall score section
  pdf.addSection('Overall Performance Score');
  
  // Create overall score display
  const scoreLabel = getScoreLabel(report.overallScore);
  pdf.addText(`Overall Score: ${report.overallScore}% - ${scoreLabel}`, {
    fontSize: 16,
    fontStyle: 'bold',
    align: 'center'
  });
  
  pdf.addSpace(10);

  // Score breakdown cards
  pdf.addSection('Detailed Score Breakdown');
  
  // Add score cards in a grid
  const startY = pdf.currentY;
  pdf.addScoreCard('Communication', report.breakdown.communication, 20, startY, 40);
  pdf.addScoreCard('Technical', report.breakdown.technical, 70, startY, 40);
  pdf.addScoreCard('Problem Solving', report.breakdown.problemSolving, 120, startY, 40);
  pdf.addScoreCard('Confidence', report.breakdown.confidence, 170, startY, 40);
  
  pdf.currentY = startY + 35;

  // Strengths section
  if (report.strengths && report.strengths.length > 0) {
    pdf.addSection('Key Strengths');
    pdf.addList(report.strengths);
    pdf.addSpace(5);
  }

  // Areas for improvement
  if (report.improvements && report.improvements.length > 0) {
    pdf.addSection('Areas for Improvement');
    pdf.addList(report.improvements);
    pdf.addSpace(5);
  }

  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    pdf.addSection('Recommendations');
    pdf.addList(report.recommendations);
    pdf.addSpace(5);
  }

  // Feedback
  if (report.feedback) {
    pdf.addSection('AI Feedback');
    pdf.addText(report.feedback);
    pdf.addSpace(5);
  }

  // Performance metrics
  if (report.metrics) {
    pdf.addSection('Performance Metrics');
    
    const metricsData = [
      ['Metric', 'Value'],
      ['Completion Rate', `${report.metrics.completionRate}%`],
      ['Average Confidence', `${report.metrics.averageConfidence}%`],
      ['Total Violations', `${report.metrics.totalViolations}`],
      ['Questions with AI Analysis', `${report.metrics.questionsWithAI || 0}/${report.metrics.totalQuestions || 0}`],
      ['Average Word Count', `${report.metrics.averageWordCount || 0} words`]
    ];
    
    pdf.addTable(metricsData[0], metricsData.slice(1));
    pdf.addSpace(5);
  }

  // Detailed scores breakdown
  if (report.detailedScores) {
    pdf.addSection('Detailed Assessment Scores');
    
    const detailedScoresData = [
      ['Assessment Criteria', 'Score'],
      ['Clarity of Response', `${report.detailedScores.clarity}%`],
      ['Relevance to Question', `${report.detailedScores.relevance}%`],
      ['Depth of Analysis', `${report.detailedScores.depth}%`],
      ['Response Structure', `${report.detailedScores.structure}%`]
    ];
    
    pdf.addTable(detailedScoresData[0], detailedScoresData.slice(1));
    pdf.addSpace(5);
  }

  // Response metrics
  if (report.responseMetrics) {
    pdf.addSection('Response Analysis Metrics');
    
    const responseMetricsData = [
      ['Metric', 'Value'],
      ['Total Words', `${report.responseMetrics.totalWords}`],
      ['Average Words per Response', `${report.responseMetrics.avgWordsPerResponse}`],
      ['Average Complexity Score', `${report.responseMetrics.avgComplexity}`],
      ['Average Relevance Score', `${report.responseMetrics.avgRelevance}`]
    ];
    
    pdf.addTable(responseMetricsData[0], responseMetricsData.slice(1));
    pdf.addSpace(5);
  }

  // Detailed interview report if available
  if (detailedReport) {
    pdf.addSection('Detailed Interview Analysis');
    
    // Interview overview
    if (detailedReport.candidate) {
      pdf.addText(`Candidate: ${detailedReport.candidate.name} (${detailedReport.candidate.email})`, {
        fontSize: 12,
        fontStyle: 'bold'
      });
    }
    
    if (detailedReport.interviewDetails) {
      pdf.addText(`Category: ${detailedReport.interviewDetails.category}`, { fontSize: 10 });
      pdf.addText(`Duration: ${Math.round((detailedReport.interviewDetails.duration || 0) / 60)} minutes`, { fontSize: 10 });
      pdf.addSpace(10);
    }

    // Questions and responses
    if (detailedReport.questions && detailedReport.questions.length > 0) {
      pdf.addSection('Questions & Responses Analysis');
      
      detailedReport.questions.forEach((question, index) => {
        // Question header
        pdf.addText(`Question ${question.questionIndex}: ${question.question}`, {
          fontSize: 12,
          fontStyle: 'bold'
        });
        
        pdf.addText(`Type: ${question.type} | Category: ${question.category}`, {
          fontSize: 9,
          color: '#6b7280'
        });
        
        pdf.addSpace(3);
        
        // Response
        if (question.response?.transcription) {
          pdf.addText('Your Response:', { fontSize: 10, fontStyle: 'bold' });
          pdf.addText(question.response.transcription, { 
            fontSize: 9,
            indent: 5
          });
          pdf.addSpace(3);
        }
        
        // AI Assessment
        if (question.aiAssessment) {
          pdf.addText('AI Analysis:', { fontSize: 10, fontStyle: 'bold' });
          
          if (question.aiAssessment.analysis) {
            pdf.addText(question.aiAssessment.analysis, { 
              fontSize: 9,
              indent: 5
            });
          }
          
          // AI Scores
          if (question.aiAssessment.scores) {
            const scores = question.aiAssessment.scores;
            const scoreText = [
              scores.clarity !== null && scores.clarity !== undefined ? `Clarity: ${scores.clarity}%` : null,
              scores.relevance !== null && scores.relevance !== undefined ? `Relevance: ${scores.relevance}%` : null,
              scores.depth !== null && scores.depth !== undefined ? `Depth: ${scores.depth}%` : null,
              scores.structure !== null && scores.structure !== undefined ? `Structure: ${scores.structure}%` : null
            ].filter(Boolean).join(' | ');
            
            if (scoreText) {
              pdf.addText(`Scores: ${scoreText}`, { 
                fontSize: 9,
                indent: 5,
                color: '#0369a1'
              });
            }
          }
          
          // AI Suggestions
          if (question.aiAssessment.suggestions && question.aiAssessment.suggestions.length > 0) {
            pdf.addText('Suggestions:', { fontSize: 9, fontStyle: 'bold', indent: 5 });
            question.aiAssessment.suggestions.forEach(suggestion => {
              pdf.addText(`• ${suggestion}`, { fontSize: 8, indent: 10 });
            });
          }
          
          pdf.addSpace(3);
        }
        
        // Follow-up questions
        if (question.followUpQuestions && question.followUpQuestions.length > 0) {
          pdf.addText('Follow-up Questions:', { fontSize: 10, fontStyle: 'bold' });
          
          question.followUpQuestions.forEach((followUp, followUpIndex) => {
            pdf.addText(`${followUpIndex + 1}. ${followUp}`, { 
              fontSize: 9,
              indent: 5
            });
            
            // Follow-up response
            if (question.followUpResponses && question.followUpResponses[followUpIndex]) {
              pdf.addText(`Response: ${question.followUpResponses[followUpIndex].transcription}`, { 
                fontSize: 8,
                indent: 10,
                color: '#6b7280'
              });
            }
          });
          pdf.addSpace(3);
        }
        
        pdf.addSpace(8);
      });
    }
  }

  // Interview metadata
  pdf.addSection('Report Information');
  pdf.addText(`Interview ID: ${interviewId || 'N/A'}`, { fontSize: 9 });
  pdf.addText(`Generated: ${new Date().toLocaleString()}`, { fontSize: 9 });
  pdf.addText('Report Type: AI-Powered Interview Assessment', { fontSize: 9 });
  
  return pdf.getBlob();
};

// Helper function to get score label
const getScoreLabel = (score: number): string => {
  if (score >= 90) return "Outstanding";
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  return "Needs Improvement";
};

export default generateInterviewReportPDF;
