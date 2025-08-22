/**
 * Professional Sky Blue PDF Export Utility for Ascend Skills
 * Complete rewrite using @react-pdf/renderer for structured, elegant reports
 * Creates beautiful, vector-based PDFs with solid colors and clean layouts
 */

import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink,
  pdf
} from '@react-pdf/renderer';

// Professional Sky Blue Color Palette
const colors = {
  primary: '#0369a1',      // Deep sky blue
  secondary: '#0ea5e9',    // Bright sky blue
  accent: '#38bdf8',       // Light sky blue
  background: '#f0f9ff',   // Very light blue
  text: '#1e293b',         // Dark gray
  textLight: '#64748b',    // Light gray
  white: '#ffffff',
  success: '#059669',      // Green
  warning: '#d97706',      // Orange
  danger: '#dc2626',       // Red
  border: '#e0f2fe'        // Light blue border
};

// Professional typography and layout styles
const styles = StyleSheet.create({
  // Document and page styles
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.6,
    color: colors.text
  },
  
  // Header styles
  header: {
    backgroundColor: colors.primary,
    padding: 30,
    marginBottom: 0,
    position: 'relative'
  },
  headerAccent: {
    backgroundColor: colors.secondary,
    height: 4,
    width: '100%'
  },
  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  headerSubtitle: {
    color: colors.white,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9
  },
  brandSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  brandText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold'
  },
  brandSubtext: {
    color: colors.white,
    fontSize: 10,
    opacity: 0.8
  },
  
  // Content container
  content: {
    padding: 30,
    flex: 1
  },
  
  // Section styles
  section: {
    marginBottom: 30
  },
  sectionHeader: {
    backgroundColor: colors.background,
    padding: 15,
    marginBottom: 20,
    borderLeft: `4px solid ${colors.primary}`,
    borderRadius: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 0
  },
  
  // Card styles
  card: {
    backgroundColor: colors.white,
    border: `2px solid ${colors.border}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    position: 'relative'
  },
  cardHeader: {
    backgroundColor: colors.secondary,
    height: 4,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: '12px 12px 0 0'
  },
  
  // Typography
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 15,
    textAlign: 'center'
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12
  },
  heading3: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8
  },
  
  bodyText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 1.6,
    marginBottom: 8
  },
  smallText: {
    fontSize: 10,
    color: colors.textLight,
    lineHeight: 1.4
  },
  
  // Score and metrics styles
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15
  },
  scoreCard: {
    backgroundColor: colors.white,
    border: `3px solid ${colors.secondary}`,
    borderRadius: 16,
    padding: 20,
    flex: 1,
    alignItems: 'center',
    position: 'relative'
  },
  scoreCardHeader: {
    backgroundColor: colors.primary,
    height: 6,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: '16px 16px 0 0'
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  
  // Progress bar styles
  progressContainer: {
    backgroundColor: colors.border,
    height: 8,
    borderRadius: 4,
    marginVertical: 8,
    position: 'relative'
  },
  progressBar: {
    backgroundColor: colors.secondary,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 0,
    left: 0
  },
  
  // Question and answer styles
  questionCard: {
    backgroundColor: colors.background,
    border: `2px solid ${colors.secondary}`,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    position: 'relative'
  },
  questionBadge: {
    position: 'absolute',
    top: -8,
    left: 15,
    backgroundColor: colors.secondary,
    color: colors.white,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  questionBadgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  questionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    marginTop: 8
  },
  answerCard: {
    backgroundColor: colors.white,
    border: `1px solid ${colors.border}`,
    borderLeft: `4px solid ${colors.accent}`,
    borderRadius: 8,
    padding: 12,
    marginLeft: 15,
    marginTop: 8
  },
  answerText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 1.5
  },
  
  // Summary grid
  summaryGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.white,
    border: `2px solid ${colors.border}`,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  
  // Assessment breakdown
  assessmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottom: `1px solid ${colors.border}`
  },
  assessmentLabel: {
    fontSize: 12,
    color: colors.text,
    flex: 1
  },
  assessmentScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    minWidth: 50,
    textAlign: 'right'
  },
  
  // Footer styles
  footer: {
    borderTop: `1px solid ${colors.border}`,
    padding: 20,
    backgroundColor: '#f8fafc'
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  pageNumber: {
    backgroundColor: colors.background,
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    padding: '4 12',
    borderRadius: 4,
    border: `1px solid ${colors.secondary}`
  },
  footerText: {
    fontSize: 8,
    color: colors.textLight
  },
  
  // Utility styles
  row: {
    flexDirection: 'row'
  },
  spaceBetween: {
    justifyContent: 'space-between'
  }
});

// Interface definitions for report data
interface ScoreData {
  communication: number;
  technical: number;
  problemSolving: number;
  confidence: number;
  overall: number;
}

interface QuestionData {
  question: string;
  response: string;
  analysis?: string;
  score?: number;
}

interface InterviewReportData {
  title: string;
  userName: string;
  date: string;
  duration: string;
  scores: ScoreData;
  questions: QuestionData[];
  summary?: string;
  recommendations?: string[];
  strengths?: string[];
  improvements?: string[];
}

interface QuizReportData {
  title: string;
  userName: string;
  date: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: string;
  category: string;
  difficulty: string;
  questions: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
  breakdown: {
    [category: string]: {
      correct: number;
      total: number;
      percentage: number;
    };
  };
}

// Helper Components
const ReportHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <View style={styles.header}>
    <View style={styles.brandSection}>
      <View>
        <Text style={styles.brandText}>ASCEND SKILLS</Text>
        <Text style={styles.brandSubtext}>Professional Assessment Platform</Text>
      </View>
      <View>
        <Text style={[styles.brandSubtext, { textAlign: 'right' }]}>
          Generated: {new Date().toLocaleDateString()}
        </Text>
      </View>
    </View>
    <Text style={styles.headerTitle}>{title}</Text>
    {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    <View style={styles.headerAccent} />
  </View>
);

const ScoreCard: React.FC<{ label: string; value: number; suffix?: string }> = ({ 
  label, 
  value, 
  suffix = '%' 
}) => (
  <View style={styles.scoreCard}>
    <View style={styles.scoreCardHeader} />
    <Text style={styles.scoreValue}>{value}{suffix}</Text>
    <Text style={styles.scoreLabel}>{label}</Text>
  </View>
);

const ProgressBar: React.FC<{ percentage: number }> = ({ percentage }) => (
  <View style={styles.progressContainer}>
    <View style={[styles.progressBar, { width: `${percentage}%` }]} />
  </View>
);

const QuestionAnswer: React.FC<{ 
  questionNumber: number; 
  question: string; 
  answer: string;
  analysis?: string;
}> = ({ questionNumber, question, answer, analysis }) => (
  <View style={styles.questionCard}>
    <View style={styles.questionBadge}>
      <Text style={styles.questionBadgeText}>Q{questionNumber}</Text>
    </View>
    <Text style={styles.questionText}>{question}</Text>
    <View style={styles.answerCard}>
      <Text style={styles.answerText}>{answer}</Text>
    </View>
    {analysis && (
      <View style={[styles.answerCard, { borderLeft: `4px solid ${colors.warning}`, marginTop: 8 }]}>
        <Text style={[styles.answerText, { fontStyle: 'italic' }]}>
          Analysis: {analysis}
        </Text>
      </View>
    )}
  </View>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const ReportFooter: React.FC<{ pageNumber: number; totalPages: number }> = ({ 
  pageNumber, 
  totalPages 
}) => (
  <View style={styles.footer} fixed>
    <View style={styles.footerRow}>
      <Text style={styles.footerText}>
        Generated: {new Date().toLocaleDateString()} • Confidential Report
      </Text>
      <Text style={styles.pageNumber}>
        {pageNumber} / {totalPages}
      </Text>
      <Text style={styles.footerText}>
        © Ascend Skills Platform
      </Text>
    </View>
  </View>
);

// Comprehensive PDF Document Component
const InterviewReportDocument: React.FC<{ data: InterviewReportData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <ReportHeader 
        title="Interview Assessment Report" 
        subtitle={`${data.userName} • ${data.date}`}
      />
      
      <View style={styles.content}>
        {/* Summary Section */}
        <Section title="Assessment Summary">
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data.scores.overall}%</Text>
              <Text style={styles.summaryLabel}>Overall Score</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data.duration}</Text>
              <Text style={styles.summaryLabel}>Duration</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data.questions.length}</Text>
              <Text style={styles.summaryLabel}>Questions</Text>
            </View>
          </View>
        </Section>

        {/* Scores Section */}
        <Section title="Performance Breakdown">
          <View style={styles.scoreContainer}>
            <ScoreCard label="Communication" value={data.scores.communication} />
            <ScoreCard label="Technical" value={data.scores.technical} />
            <ScoreCard label="Problem Solving" value={data.scores.problemSolving} />
            <ScoreCard label="Confidence" value={data.scores.confidence} />
          </View>
          
          <View style={styles.card}>
            <View style={styles.cardHeader} />
            <View style={styles.assessmentItem}>
              <Text style={styles.assessmentLabel}>Communication Skills</Text>
              <Text style={styles.assessmentScore}>{data.scores.communication}%</Text>
            </View>
            <ProgressBar percentage={data.scores.communication} />
            
            <View style={styles.assessmentItem}>
              <Text style={styles.assessmentLabel}>Technical Knowledge</Text>
              <Text style={styles.assessmentScore}>{data.scores.technical}%</Text>
            </View>
            <ProgressBar percentage={data.scores.technical} />
            
            <View style={styles.assessmentItem}>
              <Text style={styles.assessmentLabel}>Problem Solving</Text>
              <Text style={styles.assessmentScore}>{data.scores.problemSolving}%</Text>
            </View>
            <ProgressBar percentage={data.scores.problemSolving} />
            
            <View style={styles.assessmentItem}>
              <Text style={styles.assessmentLabel}>Confidence Level</Text>
              <Text style={styles.assessmentScore}>{data.scores.confidence}%</Text>
            </View>
            <ProgressBar percentage={data.scores.confidence} />
          </View>
        </Section>

        {/* Strengths and Improvements */}
        {(data.strengths || data.improvements) && (
          <Section title="Key Insights">
            <View style={[styles.row, { gap: 15 }]}>
              {data.strengths && (
                <View style={[styles.card, { flex: 1 }]}>
                  <View style={[styles.cardHeader, { backgroundColor: colors.success }]} />
                  <Text style={[styles.heading3, { color: colors.success, marginBottom: 10 }]}>
                    Strengths
                  </Text>
                  {data.strengths.map((strength, index) => (
                    <Text key={index} style={styles.bodyText}>• {strength}</Text>
                  ))}
                </View>
              )}
              
              {data.improvements && (
                <View style={[styles.card, { flex: 1 }]}>
                  <View style={[styles.cardHeader, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.heading3, { color: colors.warning, marginBottom: 10 }]}>
                    Areas for Improvement
                  </Text>
                  {data.improvements.map((improvement, index) => (
                    <Text key={index} style={styles.bodyText}>• {improvement}</Text>
                  ))}
                </View>
              )}
            </View>
          </Section>
        )}
      </View>
      
      <ReportFooter pageNumber={1} totalPages={2} />
    </Page>

    {/* Second Page - Questions and Answers */}
    <Page size="A4" style={styles.page}>
      <View style={styles.content}>
        <Section title="Interview Questions & Responses">
          {data.questions.map((q, index) => (
            <QuestionAnswer
              key={index}
              questionNumber={index + 1}
              question={q.question}
              answer={q.response}
              analysis={q.analysis}
            />
          ))}
        </Section>

        {data.recommendations && (
          <Section title="Recommendations">
            <View style={styles.card}>
              <View style={styles.cardHeader} />
              {data.recommendations.map((recommendation, index) => (
                <Text key={index} style={styles.bodyText}>
                  {index + 1}. {recommendation}
                </Text>
              ))}
            </View>
          </Section>
        )}
      </View>
      
      <ReportFooter pageNumber={2} totalPages={2} />
    </Page>
  </Document>
);

// Quiz Report Document Component
const QuizReportDocument: React.FC<{ data: QuizReportData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <ReportHeader 
        title="Quiz Assessment Report" 
        subtitle={`${data.userName} • ${data.category} • ${data.difficulty}`}
      />
      
      <View style={styles.content}>
        {/* Summary Section */}
        <Section title="Quiz Summary">
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data.score}%</Text>
              <Text style={styles.summaryLabel}>Final Score</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data.correctAnswers}/{data.totalQuestions}</Text>
              <Text style={styles.summaryLabel}>Correct Answers</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data.timeSpent}</Text>
              <Text style={styles.summaryLabel}>Time Spent</Text>
            </View>
          </View>
        </Section>

        {/* Performance Breakdown */}
        <Section title="Performance Breakdown">
          <View style={styles.card}>
            <View style={styles.cardHeader} />
            {Object.entries(data.breakdown).map(([category, stats]) => (
              <View key={category}>
                <View style={styles.assessmentItem}>
                  <Text style={styles.assessmentLabel}>{category}</Text>
                  <Text style={styles.assessmentScore}>{stats.correct}/{stats.total} ({stats.percentage}%)</Text>
                </View>
                <ProgressBar percentage={stats.percentage} />
              </View>
            ))}
          </View>
        </Section>

        {/* Questions Review */}
        <Section title="Question Review">
          {data.questions.slice(0, 5).map((q, index) => (
            <View key={index} style={styles.questionCard}>
              <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>Q{index + 1}</Text>
              </View>
              <Text style={styles.questionText}>{q.question}</Text>
              
              <View style={[styles.answerCard, { 
                borderLeft: `4px solid ${q.isCorrect ? colors.success : colors.danger}` 
              }]}>
                <Text style={styles.answerText}>
                  Your Answer: {q.userAnswer} {q.isCorrect ? '✓' : '✗'}
                </Text>
                {!q.isCorrect && (
                  <Text style={[styles.answerText, { color: colors.success, marginTop: 4 }]}>
                    Correct Answer: {q.correctAnswer}
                  </Text>
                )}
              </View>
              
              {q.explanation && (
                <View style={[styles.answerCard, { borderLeft: `4px solid ${colors.accent}`, marginTop: 8 }]}>
                  <Text style={[styles.answerText, { fontStyle: 'italic' }]}>
                    Explanation: {q.explanation}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </Section>
      </View>
      
      <ReportFooter pageNumber={1} totalPages={1} />
    </Page>
  </Document>
);

// Export functions for generating and downloading PDFs
export const generateInterviewReportPDF = async (data: InterviewReportData): Promise<Blob> => {
  const doc = <InterviewReportDocument data={data} />;
  return await pdf(doc).toBlob();
};

export const generateQuizReportPDF = async (data: QuizReportData): Promise<Blob> => {
  const doc = <QuizReportDocument data={data} />;
  return await pdf(doc).toBlob();
};

export const downloadInterviewReport = async (data: InterviewReportData, filename?: string): Promise<void> => {
  try {
    const blob = await generateInterviewReportPDF(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `interview-report-${data.userName}-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading interview report:', error);
    throw new Error('Failed to download interview report');
  }
};

export const downloadQuizReport = async (data: QuizReportData, filename?: string): Promise<void> => {
  try {
    const blob = await generateQuizReportPDF(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `quiz-report-${data.userName}-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading quiz report:', error);
    throw new Error('Failed to download quiz report');
  }
};

// React component for PDF download link
export const InterviewReportDownloadLink: React.FC<{
  data: InterviewReportData;
  filename?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ data, filename, children, className }) => (
  <PDFDownloadLink
    document={<InterviewReportDocument data={data} />}
    fileName={filename || `interview-report-${data.userName}-${Date.now()}.pdf`}
    className={className}
  >
    {children}
  </PDFDownloadLink>
);

export const QuizReportDownloadLink: React.FC<{
  data: QuizReportData;
  filename?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ data, filename, children, className }) => (
  <PDFDownloadLink
    document={<QuizReportDocument data={data} />}
    fileName={filename || `quiz-report-${data.userName}-${Date.now()}.pdf`}
    className={className}
  >
    {children}
  </PDFDownloadLink>
);

// Legacy compatibility function - temporarily restored for smooth transition
export async function downloadElementAsPDF(
  element: HTMLElement,
  filename: string,
  options: any = {}
): Promise<void> {
  console.warn('downloadElementAsPDF is deprecated. Please use the new react-pdf based functions.');
  
  // For now, we'll use a simple approach to maintain compatibility
  try {
    // Create a simple PDF using the new react-pdf system
    // This is a temporary bridge until components are updated
    
    // Extract basic data from the element for now
    const title = options.title || 'Report';
    const userName = 'User'; // This should be extracted from the element
    
    // Create a basic report structure
    const basicData = {
      title,
      userName,
      date: new Date().toLocaleDateString(),
      duration: 'N/A',
      scores: {
        communication: 0,
        technical: 0,
        problemSolving: 0,
        confidence: 0,
        overall: 0
      },
      questions: []
    };
    
    // Use the new system for now
    await downloadInterviewReport(basicData, filename);
    
  } catch (error) {
    console.error('Error in legacy downloadElementAsPDF:', error);
    // Fallback: create a simple text-based download
    const textContent = element.textContent || 'Report content';
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace('.pdf', '.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Type exports for convenience
export type { InterviewReportData, QuizReportData, ScoreData, QuestionData };
