import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  User, 
  Target, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  BarChart3,
  Activity,
  Shield,
  Star,
  Calendar,
  Award,
  FileText,
  Play,
  Pause,
  Volume2,
  Eye,
  Zap,
  ChevronDown,
  ChevronUp,
  Download,
  Trophy
} from 'lucide-react';
import { DetailedInterviewReport } from '@/services/interviewService';
import { downloadElementAsPDF } from '@/utils/pdf';

interface DetailedInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId: string;
}

export default function DetailedInterviewModal({ 
  isOpen, 
  onClose, 
  interviewId 
}: DetailedInterviewModalProps) {
  const [report, setReport] = useState<DetailedInterviewReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && interviewId) {
      fetchDetailedReport();
    }
  }, [isOpen, interviewId]);

  const fetchDetailedReport = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching detailed report for interview ID:', interviewId);
      const { interviewService } = await import('@/services/interviewService');
      const data = await interviewService.getDetailedReport(interviewId);
      console.log('Detailed report data received:', data);
      
      // Validate the data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format received');
      }
      
      // Check if we have the minimum required data
      if (!data.interviewId) {
        throw new Error('Missing interview ID in response');
      }
      
      if (!data.questions || !Array.isArray(data.questions)) {
        console.warn('No questions data in report:', data);
        // Set empty array to prevent errors
        data.questions = [];
      }
      
      if (!data.finalAssessment) {
        console.warn('No final assessment data in report:', data);
        // Create a default assessment
        data.finalAssessment = {
          overallScore: 0,
          breakdown: {
            communication: 0,
            technical: 0,
            problemSolving: 0,
            confidence: 0
          },
          strengths: ['Data not available'],
          improvements: ['Data not available'],
          recommendations: ['Data not available'],
          feedback: 'Assessment data not available',
          metrics: {
            averageConfidence: 0,
            totalViolations: 0,
            completionRate: 0,
            averageWordCount: 0,
            questionsWithAI: 0,
            totalQuestions: 0,
            totalResponses: 0
          },
          generatedAt: new Date().toISOString()
        };
      }
      
      // Ensure candidate and interview details exist
      if (!data.candidate) {
        data.candidate = { name: 'N/A', email: 'N/A' };
      }
      
      if (!data.interviewDetails) {
        data.interviewDetails = { 
          title: 'N/A', 
          type: 'N/A', 
          category: 'N/A',
          duration: 0,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: {
            current: 'completed',
            isActive: false,
            currentQuestionIndex: 0
          }
        };
      }
      
      console.log('Processed data for display:', data);
      setReport(data);
    } catch (err) {
      console.error('Error fetching detailed report:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!report) return;
    
    setDownloading(true);
    try {
      // Create a comprehensive report element for PDF
      const reportElement = createComprehensiveReportElement();
      const fileName = `AscendSkills_Detailed_Report_${interviewId}.pdf`;
      
      await downloadElementAsPDF(reportElement, fileName, {
        title: "Detailed Interview Report",
        fileName,
      });
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const createComprehensiveReportElement = (): HTMLElement => {
    const container = document.createElement('div');
    container.className = 'p-8 bg-white';
    container.style.width = '800px';
    
    // Add header
    const header = document.createElement('div');
    header.innerHTML = `
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Detailed Interview Report</h1>
        <p class="text-gray-600">Comprehensive analysis with AI insights</p>
        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
          <p><strong>Interview ID:</strong> ${report?.interviewId || 'N/A'}</p>
          <p><strong>Candidate:</strong> ${report?.candidate?.name || 'N/A'} (${report?.candidate?.email || 'N/A'})</p>
          <p><strong>Category:</strong> ${report?.interviewDetails?.category || 'N/A'}</p>
          <p><strong>Duration:</strong> ${report?.interviewDetails?.duration ? Math.round(report.interviewDetails.duration / 60) + ' minutes' : 'N/A'}</p>
        </div>
      </div>
    `;
    container.appendChild(header);

    // Add final assessment
    if (report?.finalAssessment) {
      const assessment = document.createElement('div');
      assessment.innerHTML = `
        <div class="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 class="text-2xl font-bold text-blue-800 mb-4">Final Assessment</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-4xl font-bold text-blue-600">${report.finalAssessment.overallScore}%</div>
              <div class="text-sm text-blue-600">Overall Score</div>
            </div>
            <div class="space-y-2">
              <div><strong>Communication:</strong> ${report.finalAssessment.breakdown.communication}%</div>
              <div><strong>Technical:</strong> ${report.finalAssessment.breakdown.technical}%</div>
              <div><strong>Problem Solving:</strong> ${report.finalAssessment.breakdown.problemSolving}%</div>
              <div><strong>Confidence:</strong> ${report.finalAssessment.breakdown.confidence}%</div>
            </div>
          </div>
        </div>
      `;
      container.appendChild(assessment);
    }

    // Add questions and responses
    if (report?.questions && report.questions.length > 0) {
      const questionsSection = document.createElement('div');
      questionsSection.innerHTML = '<h2 class="text-2xl font-bold text-gray-800 mb-6">Questions & Responses</h2>';
      
      report.questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'mb-8 p-6 border border-gray-200 rounded-lg';
        
        questionDiv.innerHTML = `
          <h3 class="text-xl font-bold text-gray-800 mb-4">Question ${question.questionIndex}: ${question.question}</h3>
          <div class="mb-4">
            <strong>Type:</strong> ${question.type} | <strong>Category:</strong> ${question.category}
          </div>
          
          <div class="mb-4 p-4 bg-gray-50 rounded">
            <strong>Your Response:</strong><br>
            ${question.response?.transcription || 'No response recorded'}
          </div>
          
          ${question.aiAssessment ? `
            <div class="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
              <h4 class="font-bold text-blue-800 mb-2">AI Analysis</h4>
              ${question.aiAssessment.analysis ? `<p class="mb-2">${question.aiAssessment.analysis}</p>` : ''}
              ${question.aiAssessment.scores ? `
                <div class="grid grid-cols-2 gap-2 text-sm">
                  ${Object.entries(question.aiAssessment.scores).map(([key, value]) => 
                    value !== null && value !== undefined ? `<div><strong>${key}:</strong> ${value}%</div>` : ''
                  ).join('')}
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          ${question.followUpQuestions && question.followUpQuestions.length > 0 ? `
            <div class="mt-4 p-4 bg-green-50 rounded border border-green-200">
              <h4 class="font-bold text-green-800 mb-2">Follow-up Questions</h4>
              ${question.followUpQuestions.map((fq, fqIndex) => `
                <div class="mb-2">
                  <strong>${fqIndex + 1}.</strong> ${fq}
                  ${question.followUpResponses && question.followUpResponses[fqIndex] ? 
                    `<br><em>Response: ${question.followUpResponses[fqIndex].transcription}</em>` : ''
                  }
                </div>
              `).join('')}
            </div>
          ` : ''}
        `;
        
        questionsSection.appendChild(questionDiv);
      });
      
      container.appendChild(questionsSection);
    }

    return container;
  };

  const toggleQuestionExpansion = (questionIndex: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionIndex)) {
      newExpanded.delete(questionIndex);
    } else {
      newExpanded.add(questionIndex);
    }
    setExpandedQuestions(newExpanded);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
    if (score >= 70) return 'bg-gradient-to-r from-blue-500 to-blue-600';
    if (score >= 60) return 'bg-gradient-to-r from-amber-500 to-amber-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-7xl h-[90vh] bg-gradient-to-br from-primary-50 via-white to-secondary-50 rounded-3xl shadow-2xl overflow-hidden border border-primary-200">
        {/* Header */}
        <div className="flex items-center justify-between p-8 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Detailed Interview Report</h2>
              <p className="text-white/80 text-sm">Comprehensive analysis with AI insights</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDownload}
              disabled={downloading || !report}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {downloading ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto p-8">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchDetailedReport}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {report && (
            <div className="p-6 space-y-8">
              {/* Debug Section - Only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-black mb-2">Debug Info</h4>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-black">Click to view raw data</summary>
                    <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40 text-black">
                      {JSON.stringify(report, null, 2)}
                    </pre>
                  </details>
                </div>
              )}

              {/* Interview Overview */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-200 p-6">
                <h3 className="text-2xl font-bold flex items-center gap-3 mb-6 text-black">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  Interview Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-black mb-2">Candidate Information</h4>
                    <p className="text-black"><strong>Name:</strong> {report.candidate?.name || 'N/A'}</p>
                    <p className="text-black"><strong>Email:</strong> {report.candidate?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-2">Interview Details</h4>
                    <p className="text-black"><strong>Category:</strong> {report.interviewDetails?.category || 'N/A'}</p>
                    <p className="text-black"><strong>Type:</strong> {report.interviewDetails?.type || 'N/A'}</p>
                    <p className="text-black"><strong>Duration:</strong> {report.interviewDetails?.duration ? 
                      Math.round(report.interviewDetails.duration / 60) + ' minutes' : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Final Assessment */}
              {report.finalAssessment && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-secondary-200 p-6">
                  <h3 className="text-2xl font-bold flex items-center gap-3 mb-6 text-black">
                    <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    Final Assessment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-secondary-600 mb-2">
                        {report.finalAssessment.overallScore}%
                      </div>
                      <div className="text-secondary-600 font-medium">Overall Score</div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-black">Communication:</span>
                        <span className="font-semibold text-black">{report.finalAssessment.breakdown.communication}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black">Technical:</span>
                        <span className="font-semibold text-black">{report.finalAssessment.breakdown.technical}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black">Problem Solving:</span>
                        <span className="font-semibold text-black">{report.finalAssessment.breakdown.problemSolving}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black">Confidence:</span>
                        <span className="font-semibold text-black">{report.finalAssessment.breakdown.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions and Responses */}
              <div className="space-y-8">
                <h3 className="text-2xl font-bold flex items-center gap-3 text-black">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  Questions & Responses
                </h3>
                
                {report.questions && report.questions.length > 0 ? (
                  report.questions.map((question, index) => (
                    <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                      {/* Question Header */}
                      <div 
                        className="p-8 cursor-pointer hover:bg-white/90 transition-all duration-300"
                        onClick={() => toggleQuestionExpansion(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                              {question.questionIndex}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-black text-lg mb-2">{question.question}</h4>
                              <div className="flex items-center gap-6 text-sm text-black">
                                <span className="flex items-center gap-2">
                                  <Target className="w-4 h-4" />
                                  {question.type}
                                </span>
                                <span className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  {question.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          {expandedQuestions.has(index) ? (
                            <ChevronUp className="w-6 h-6 text-black" />
                          ) : (
                            <ChevronDown className="w-6 h-6 text-black" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedQuestions.has(index) && (
                        <div className="border-t border-primary-200 p-8 space-y-8">
                          {/* Response */}
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary-200 shadow-lg">
                            <h5 className="font-bold text-black mb-4 flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-white" />
                              </div>
                              Your Response
                            </h5>
                            <p className="text-black leading-relaxed text-lg">
                              {question.response?.transcription || 'No response recorded'}
                            </p>
                            {question.response?.duration && (
                              <div className="mt-3 text-sm text-black">
                                Duration: {formatDuration(question.response.duration)}
                              </div>
                            )}
                          </div>

                          {/* AI Assessment */}
                          {question.aiAssessment && (
                            <div className="space-y-6">
                              <h5 className="font-bold text-black flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                                  <Zap className="w-5 h-5 text-white" />
                                </div>
                                AI Analysis
                              </h5>
                              
                              {/* AI Scores */}
                              {question.aiAssessment.scores && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-secondary-200 shadow-lg">
                                  <h6 className="font-semibold text-black mb-4">Scores</h6>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(question.aiAssessment.scores).map(([key, value]) => {
                                      // Show only the 4 specific score fields
                                      const scoreLabels: { [key: string]: string } = {
                                        'clarity': 'Clarity Score',
                                        'relevance': 'Relevance Score', 
                                        'depth': 'Depth Score',
                                        'structure': 'Structure Score'
                                      };
                                      
                                      if (scoreLabels[key] && value !== null && value !== undefined) {
                                        return (
                                          <div key={key} className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-secondary-200 shadow-sm hover:shadow-md transition-all duration-300">
                                            <div className="text-sm text-black font-medium mb-2">{scoreLabels[key]}</div>
                                            <div className={`text-2xl font-bold ${getScoreColor(value).split(' ')[0]}`}>
                                              {value}%
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {/* AI Analysis */}
                              {question.aiAssessment.analysis && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary-200 shadow-lg">
                                  <h6 className="font-semibold text-black mb-3 flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                    Analysis
                                  </h6>
                                  <p className="text-black leading-relaxed">{question.aiAssessment.analysis}</p>
                                </div>
                              )}
                              
                              {/* AI Keywords */}
                              {question.aiAssessment.keywords && Array.isArray(question.aiAssessment.keywords) && question.aiAssessment.keywords.length > 0 && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary-200 shadow-lg">
                                  <h6 className="font-semibold text-black mb-3 flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                    Keywords
                                  </h6>
                                  <div className="flex flex-wrap gap-2">
                                    {question.aiAssessment.keywords.map((keyword, idx) => (
                                      <span key={idx} className="px-3 py-1 bg-primary-100 text-black text-sm rounded-full">
                                        {keyword}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* AI Response Metrics */}
                              {question.aiAssessment.responseMetrics && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary-200 shadow-lg">
                                  <h6 className="font-semibold text-black mb-3 flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                    Response Metrics
                                  </h6>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-black">Word Count:</span>
                                      <span className="font-medium ml-1 text-black">{question.aiAssessment.responseMetrics.wordCount || 0}</span>
                                    </div>
                                    <div>
                                      <span className="text-black">Complexity:</span>
                                      <span className="font-medium ml-1 text-black">{question.aiAssessment.responseMetrics.complexity || 0}</span>
                                    </div>
                                    <div>
                                      <span className="text-black">Relevance:</span>
                                      <span className="font-medium ml-1 text-black">{question.aiAssessment.responseMetrics.relevance || 0}</span>
                                    </div>
                                    <div>
                                      <span className="text-black">Technical Terms:</span>
                                      <span className="font-medium ml-1 text-black">{question.aiAssessment.responseMetrics.hasTechnicalTerms ? 'Yes' : 'No'}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* AI Suggestions */}
                              {question.aiAssessment.suggestions && Array.isArray(question.aiAssessment.suggestions) && question.aiAssessment.suggestions.length > 0 && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-secondary-200 shadow-lg">
                                  <h6 className="font-semibold text-black mb-3 flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                    Suggestions
                                  </h6>
                                  <ul className="space-y-3">
                                    {question.aiAssessment.suggestions.map((suggestion, idx) => (
                                      <li key={idx} className="text-black text-base flex items-start gap-3">
                                        <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                                        {suggestion}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Follow-up Questions */}
                          {question.followUpQuestions && Array.isArray(question.followUpQuestions) && question.followUpQuestions.length > 0 && (
                            <div className="space-y-6">
                              <h5 className="font-bold text-black flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                                  <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                Follow-up Questions
                              </h5>
                              
                              {question.followUpQuestions.map((followUpQuestion, followUpIndex) => {
                                const followUpResponse = question.followUpResponses && Array.isArray(question.followUpResponses) ? 
                                  question.followUpResponses.find(r => r.followUpIndex === followUpIndex + 1) : null;
                                
                                return (
                                  <div key={followUpIndex} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-accent-200 shadow-lg space-y-4">
                                    <div className="flex items-start gap-4">
                                      <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center text-white font-bold">
                                        {followUpIndex + 1}
                                      </div>
                                      <div className="flex-1">
                                        <h6 className="font-semibold text-black text-lg mb-3">{followUpQuestion}</h6>
                                        
                                        {/* Follow-up Response */}
                                        {followUpResponse && (
                                          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-accent-200 shadow-sm mb-4">
                                            <h6 className="font-medium text-black mb-2 flex items-center gap-2">
                                              <MessageSquare className="w-4 h-4" />
                                              Your Response
                                            </h6>
                                            <p className="text-black leading-relaxed">{followUpResponse.transcription}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-black">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No questions data available</p>
                    <p className="text-sm">This interview may not have been completed or the data is still being processed.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 