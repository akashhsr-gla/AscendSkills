"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  BarChart3,
  Activity,
  Shield,
  Clock,
  Star,
  FileText,
  Download,
  Eye,
  ArrowRight,
  Video
} from "lucide-react";
import DetailedInterviewModal from "./DetailedInterviewModal";
import { downloadElementAsPDF } from "@/utils/pdf";
import { interviewService, DetailedInterviewReport } from "@/services/interviewService";

// Video recording interface
interface VideoRecordingData {
  downloadUrl: string | null;
  duration: number;
  isAvailable: boolean;
}

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

export default function InterviewReport({ 
  report, 
  interviewId,
  videoRecording,
  onForceCreateDownloadUrl
}: { 
  report: AssessmentReport; 
  interviewId?: string;
  videoRecording?: VideoRecordingData;
  onForceCreateDownloadUrl?: () => void;
}) {
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);



  // Auto-delete video recording when component unmounts
  useEffect(() => {
    return () => {
      if (videoRecording?.downloadUrl) {
        // Clean up the blob URL when exiting the report
        URL.revokeObjectURL(videoRecording.downloadUrl);
        console.log('🎥 Video recording cleaned up on report exit');
      }
    };
  }, [videoRecording?.downloadUrl]);

  const buildDetailedReportElement = (detailed: DetailedInterviewReport): HTMLElement => {
    const container = document.createElement('div');
    container.className = 'p-8 bg-white mt-8 border-t pt-8';
    container.style.width = '800px';

    const header = document.createElement('div');
    header.innerHTML = `
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Detailed Interview Report</h2>
        <p class="text-gray-600">Comprehensive analysis with AI insights</p>
        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
          <p><strong>Interview ID:</strong> ${detailed?.interviewId || 'N/A'}</p>
          <p><strong>Candidate:</strong> ${detailed?.candidate?.name || 'N/A'} (${detailed?.candidate?.email || 'N/A'})</p>
          <p><strong>Category:</strong> ${detailed?.interviewDetails?.category || 'N/A'}</p>
          <p><strong>Duration:</strong> ${detailed?.interviewDetails?.duration ? Math.round(detailed.interviewDetails.duration / 60) + ' minutes' : 'N/A'}</p>
        </div>
      </div>
    `;
    container.appendChild(header);

    // Final assessment (if present)
    if (detailed?.finalAssessment) {
      const assessment = document.createElement('div');
      assessment.innerHTML = `
        <div class="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 class="text-xl font-bold text-blue-800 mb-4">Final Assessment</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600">${detailed.finalAssessment.overallScore}%</div>
              <div class="text-sm text-blue-600">Overall Score</div>
            </div>
            <div class="space-y-1 text-sm">
              <div><strong>Communication:</strong> ${detailed.finalAssessment.breakdown.communication}%</div>
              <div><strong>Technical:</strong> ${detailed.finalAssessment.breakdown.technical}%</div>
              <div><strong>Problem Solving:</strong> ${detailed.finalAssessment.breakdown.problemSolving}%</div>
              <div><strong>Confidence:</strong> ${detailed.finalAssessment.breakdown.confidence}%</div>
            </div>
          </div>
        </div>
      `;
      container.appendChild(assessment);
    }

    if (detailed?.questions && detailed.questions.length > 0) {
      const questionsSection = document.createElement('div');
      questionsSection.innerHTML = '<h3 class="text-xl font-bold text-gray-800 mb-6">Questions & Responses</h3>';

      detailed.questions.forEach((question) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'mb-6 p-4 border border-gray-200 rounded-lg';
        
        const scoresHtml = question.aiAssessment?.scores
          ? Object.entries(question.aiAssessment.scores)
              .filter(([k, v]) => v !== null && v !== undefined && ['clarity','relevance','depth','structure'].includes(k))
              .map(([k, v]) => `<div class="text-xs"><strong>${k}:</strong> ${v}%</div>`)
              .join('')
          : '';

        const followUpsHtml = question.followUpQuestions && question.followUpQuestions.length > 0
          ? `
            <div class="mt-3 p-3 bg-green-50 rounded border border-green-200">
              <div class="font-semibold text-green-800 mb-2">Follow-up Questions</div>
              ${question.followUpQuestions.map((fq, i) => `
                <div class="mb-2 text-sm">
                  <strong>${i + 1}.</strong> ${fq}
                  ${question.followUpResponses && question.followUpResponses[i] ? `<br/><em>Response: ${question.followUpResponses[i].transcription}</em>` : ''}
                </div>
              `).join('')}
            </div>
          `
          : '';

        questionDiv.innerHTML = `
          <div class="text-sm text-gray-600 mb-1">Type: ${question.type} | Category: ${question.category}</div>
          <div class="font-semibold text-gray-800 mb-2">Q${question.questionIndex}. ${question.question}</div>
          <div class="mb-2 p-3 bg-gray-50 rounded">
            <div class="font-medium mb-1">Your Response</div>
            <div class="text-sm">${question.response?.transcription || 'No response recorded'}</div>
          </div>
          ${question.aiAssessment?.analysis ? `<div class="mb-2 p-3 bg-blue-50 rounded border border-blue-200"><div class="font-medium text-blue-800 mb-1">AI Analysis</div><div class="text-sm">${question.aiAssessment.analysis}</div><div class="grid grid-cols-2 gap-1 mt-2">${scoresHtml}</div></div>` : ''}
          ${followUpsHtml}
        `;

        questionsSection.appendChild(questionDiv);
      });

      container.appendChild(questionsSection);
    }

    return container;
  };

  const handleDownload = useCallback(async () => {
    if (!containerRef.current) return;

    const combined = document.createElement('div');
    combined.style.width = '800px';
    combined.className = 'bg-white';

    // Clone summary section
    const summaryClone = containerRef.current.cloneNode(true) as HTMLElement;
    // Prune UI-only controls (buttons etc.) from clone
    summaryClone.querySelectorAll('button').forEach((btn) => btn.remove());
    combined.appendChild(summaryClone);

    // Append detailed section if interviewId is available
    if (interviewId) {
      try {
        const detailed = await interviewService.getDetailedReport(interviewId);
        const detailedEl = buildDetailedReportElement(detailed);
        combined.appendChild(detailedEl);
      } catch (e) {
        console.error('Failed to fetch detailed report for PDF:', e);
      }
    }

    const fileName = `AscendSkills_Interview_Report${interviewId ? `_${interviewId}` : ''}.pdf`;
    await downloadElementAsPDF(combined, fileName, {
      title: "Interview Assessment Report",
      fileName,
    });
  }, [interviewId]);

  const handleVideoDownload = useCallback(() => {
    if (videoRecording?.downloadUrl) {
      const a = document.createElement('a');
      a.href = videoRecording.downloadUrl;
      a.download = `interview-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [videoRecording?.downloadUrl]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!report) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white/95 backdrop-blur-md p-10 rounded-3xl shadow-2xl animate-fadeInUp text-center border border-gray-200">
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Interview Report</h2>
        <p className="text-gray-600">No assessment data available.</p>
      </div>
    );
  }

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

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Trophy className="w-6 h-6" />;
    if (score >= 70) return <Star className="w-6 h-6" />;
    if (score >= 60) return <TrendingUp className="w-6 h-6" />;
    return <AlertCircle className="w-6 h-6" />;
  };

  const getOverallScoreLabel = (score: number) => {
    if (score >= 90) return "Outstanding";
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div ref={containerRef} className="w-full max-w-7xl mx-auto bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-8 rounded-3xl shadow-2xl animate-fadeInUp border border-primary-200">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-primary-200 text-primary-600 text-sm font-medium mb-6">
          <Award className="w-4 h-4 mr-2" />
          AI-Powered Assessment
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Interview{' '}
          <span className="text-gradient-primary">
            Assessment Report
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">Comprehensive analysis of your interview performance with AI-powered insights</p>
        
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {interviewId && (
            <button
              onClick={() => setShowDetailedModal(true)}
              className="group bg-gradient-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              <Eye className="w-5 h-5 mr-2" />
              View Detailed Report
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </button>
          

          
          {videoRecording?.isAvailable && videoRecording?.downloadUrl && (
            <button
              onClick={handleVideoDownload}
              className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              <Video className="w-5 h-5 mr-2" />
              Download Recording ({formatDuration(videoRecording.duration)})
            </button>
          )}
        </div>
      </div>
      
      {/* Overall Score - Hero Section */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 border-4 border-primary-300 mb-6 shadow-lg">
          <div className="text-6xl font-extrabold text-gray-900">{report.overallScore}%</div>
        </div>
        <div className="text-2xl font-semibold text-gray-800">{getOverallScoreLabel(report.overallScore)}</div>
      </div>
      
      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Communication</h3>
          </div>
          <div className={`text-4xl font-bold mb-3 ${getScoreColor(report.breakdown.communication).split(' ')[0]}`}>
            {report.breakdown.communication}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className={`${getScoreBarColor(report.breakdown.communication)} h-3 rounded-full transition-all duration-500 shadow-lg`}
              style={{width: `${report.breakdown.communication}%`}}
            ></div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Technical</h3>
          </div>
          <div className={`text-4xl font-bold mb-3 ${getScoreColor(report.breakdown.technical).split(' ')[0]}`}>
            {report.breakdown.technical}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className={`${getScoreBarColor(report.breakdown.technical)} h-3 rounded-full transition-all duration-500 shadow-lg`}
              style={{width: `${report.breakdown.technical}%`}}
            ></div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Problem Solving</h3>
          </div>
          <div className={`text-4xl font-bold mb-3 ${getScoreColor(report.breakdown.problemSolving).split(' ')[0]}`}>
            {report.breakdown.problemSolving}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className={`${getScoreBarColor(report.breakdown.problemSolving)} h-3 rounded-full transition-all duration-500 shadow-lg`}
              style={{width: `${report.breakdown.problemSolving}%`}}
            ></div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Confidence</h3>
          </div>
          <div className={`text-4xl font-bold mb-3 ${getScoreColor(report.breakdown.confidence).split(' ')[0]}`}>
            {report.breakdown.confidence}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className={`${getScoreBarColor(report.breakdown.confidence)} h-3 rounded-full transition-all duration-500 shadow-lg`}
              style={{width: `${report.breakdown.confidence}%`}}
            ></div>
          </div>
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Strengths */}
        {report.strengths && report.strengths.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-200 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold mb-4 text-primary-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Strengths
            </h3>
            <ul className="space-y-3">
              {report.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700 leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {report.improvements && report.improvements.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-secondary-200 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold mb-4 text-secondary-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Areas for Improvement
            </h3>
            <ul className="space-y-3">
              {report.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700 leading-relaxed">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-accent-200 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold mb-4 text-accent-800 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Recommendations
            </h3>
            <ul className="space-y-3">
              {report.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                    <Lightbulb className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700 leading-relaxed">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Detailed Interview Modal */}
      {interviewId && (
        <DetailedInterviewModal
          isOpen={showDetailedModal}
          onClose={() => setShowDetailedModal(false)}
          interviewId={interviewId}
        />
      )}
    </div>
  );
} 