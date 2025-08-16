"use client";
import React, { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import { 
  Mic, 
  MicOff,
  CheckCircle, 
  Loader2, 
  Info,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  X,
  Pause,
  Play,
  Shield,
  Brain,
  Award,
  Clock,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Settings,
  Target,
  TrendingUp,
  Trophy,
  Star,
  BarChart3,
  Activity,
  Lightbulb
} from "lucide-react";
import InterviewReport from "@/components/InterviewReport";
import SecurityProvider from "@/components/SecurityProvider";
import VideoRecorder from "@/components/VideoRecorder";

import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthTokenString, isAuthenticated } from '@/utils/auth';
import { subscriptionService } from '@/services/subscriptionService';


// Security styles
const securityStyles = `
  @media print {
    * { display: none !important; }
  }
  .no-select {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  .no-context-menu {
    -webkit-context-menu: none;
    -moz-context-menu: none;
    -ms-context-menu: none;
    context-menu: none;
  }
  .no-right-click {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  .no-drag {
    -webkit-user-drag: none;
    -moz-user-drag: none;
    -ms-user-drag: none;
    user-drag: none;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  * {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  img {
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    user-drag: none;
    pointer-events: none;
  }
`;

// Inject security styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = securityStyles;
  document.head.appendChild(styleElement);
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Question {
  id: string;
  question: string;
  type: string;
  expectedDuration: number;
  aiAnalysis?: {
    scores: {
      clarity: number;
      relevance: number;
      depth: number;
      structure: number;
    };
    metrics: {
      wordCount: number;
      sentenceCount: number;
      avgWordsPerSentence: number;
      complexity: number;
      relevance: number;
    };
    keywords: string[];
    suggestions: string[];
    confidence: number;
  };
}

interface InterviewConfig {
  interviewId: string;
  questions: Question[];
  currentQuestionIndex: number;
}

interface SecurityStatus {
  faceCount: number;
  violations: any[];
  isSecure: boolean;
  violationCount: number;
  maxViolations: number;
}

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Core state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // UI state
  const [showInstructions, setShowInstructions] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI & Security state
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [currentFollowUpIndex, setCurrentFollowUpIndex] = useState(0);
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [aiResponseAnalysis, setAiResponseAnalysis] = useState<string>('');
  const [securityViolations, setSecurityViolations] = useState<string[]>([]);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  

  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  
  // Text-to-speech state
  const [isReadingQuestion, setIsReadingQuestion] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const readQuestionsRef = useRef<Set<string | number>>(new Set());
  const [ttsRequestInProgress, setTtsRequestInProgress] = useState(false);
  const ttsDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto flow state
  const [hasTtsFinished, setHasTtsFinished] = useState(false);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(30);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const voiceDetectedRef = useRef<boolean>(false);
  const autoSubmitInProgressRef = useRef<boolean>(false);
  // Live refs to avoid stale closures in recognition handlers
  const hasTtsFinishedRef = useRef<boolean>(false);
  const isCountdownActiveRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  
  // Refs
  const speechRecognitionRef = useRef<any>(null);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Score tracking state
  const [currentScores, setCurrentScores] = useState<{
    communication: number;
    technical: number;
    problemSolving: number;
    confidence: number;
    overall: number;
  } | null>(null);
  const [showScores, setShowScores] = useState(false);

  // Video recording state
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoRecordingData, setVideoRecordingData] = useState<{
    downloadUrl: string | null;
    duration: number;
    isAvailable: boolean;
  }>({
    downloadUrl: null,
    duration: 0,
    isAvailable: false
  });

  // Ref for VideoRecorder component
  const videoRecorderRef = useRef<{ forceCreateDownloadUrl: () => string | null; getRecordedChunks: () => Blob[] }>(null);

  // Score utility functions
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
    return 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Trophy className="w-5 h-5" />;
    if (score >= 70) return <Star className="w-5 h-5" />;
    if (score >= 60) return <TrendingUp className="w-5 h-5" />;
    return <BarChart3 className="w-5 h-5" />;
  };

  // Security measures
  const preventScreenshots = useCallback(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setSecurityViolations(prev => [...prev, 'Right-click context menu attempted']);
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const screenshotShortcuts = [
        (e.ctrlKey && e.key === 'PrintScreen'),
        (e.ctrlKey && e.shiftKey && e.key === 'I'),
        (e.ctrlKey && e.shiftKey && e.key === 'C'),
        (e.ctrlKey && e.shiftKey && e.key === 'J'),
        (e.key === 'F12'),
        (e.metaKey && e.shiftKey && e.key === '3'),
        (e.metaKey && e.shiftKey && e.key === '4'),
        (e.metaKey && e.shiftKey && e.key === '5'),
        (e.metaKey && e.key === 'I'),
        (e.metaKey && e.key === 'J'),
        (e.metaKey && e.key === 'C'),
        (e.ctrlKey && e.key === 'u'),
        (e.ctrlKey && e.key === 's'),
        (e.ctrlKey && e.key === 'p'),
        (e.metaKey && e.key === 'S'),
        (e.metaKey && e.key === 'P'),
        (e.metaKey && e.key === 'U'),
      ];

      if (screenshotShortcuts.some(shortcut => shortcut)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setSecurityViolations(prev => [...prev, `Screenshot shortcut attempted: ${e.key}`]);
        setShowSecurityWarning(true);
        return false;
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        setSecurityViolations(prev => [...prev, 'PrintScreen key pressed']);
        setShowSecurityWarning(true);
        return false;
      }
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu, { passive: false, capture: true });
    document.addEventListener('keydown', handleKeyDown, { passive: false, capture: true });
    document.addEventListener('keypress', handleKeyPress, { passive: false, capture: true });
    document.addEventListener('selectstart', handleSelectStart, { passive: false });
    document.addEventListener('dragstart', handleDragStart, { passive: false });

    window.addEventListener('keydown', handleKeyDown, { passive: false, capture: true });
    window.addEventListener('keypress', handleKeyPress, { passive: false, capture: true });
    window.addEventListener('contextmenu', handleContextMenu, { passive: false, capture: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keypress', handleKeyPress, true);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keypress', handleKeyPress, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, []);

  // Apply security measures on mount
  useEffect(() => {
    const cleanup = preventScreenshots();
    return cleanup;
  }, [preventScreenshots]);

  // Monitor for security violations
  useEffect(() => {
    if (securityViolations.length > 0) {
      if (securityViolations.length >= 3) {
        setShowSecurityWarning(true);
        setTimeout(() => {
          window.location.href = '/interview';
        }, 3000);
      }
    }
  }, [securityViolations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      // Ensure countdown cleared on unmount
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  // Handle video recording state changes
  const handleVideoRecordingStateChange = useCallback((recording: boolean) => {
    setIsVideoRecording(recording);
  }, []);

  // Handle video recording data changes
  const handleVideoRecordingDataChange = useCallback((data: {
    downloadUrl: string | null;
    duration: number;
    isAvailable: boolean;
  }) => {
    console.log('🎥 Interview page: Received video recording data:', data);
    setVideoRecordingData(data);
  }, []);



  // Handle video recording when interview ends
  useEffect(() => {
    if (finished) {
      console.log('🎥 Interview ended, checking video recording status');
      console.log('🎥 Current video recording data:', videoRecordingData);
      
      // Force trigger video recording data update if needed
      if (videoRecordingData.isAvailable && !videoRecordingData.downloadUrl) {
        console.log('🎥 Video recording available but no download URL, forcing update');
        // This will trigger the VideoRecorder to create the download URL
      }
    }
  }, [finished, videoRecordingData]);

  // Auto-force create download URL when interview ends
  useEffect(() => {
    if (finished && videoRecordingData.isAvailable && !videoRecordingData.downloadUrl && videoRecorderRef.current) {
      console.log('🎥 Interview ended, auto-forcing download URL creation');
      setTimeout(() => {
        if (videoRecorderRef.current) {
          const downloadUrl = videoRecorderRef.current.forceCreateDownloadUrl();
          if (downloadUrl) {
            console.log('🎥 Auto-created download URL:', downloadUrl);
            setVideoRecordingData(prev => ({
              ...prev,
              downloadUrl
            }));
          }
        }
      }, 2000); // Wait 2 seconds for everything to settle
    }
  }, [finished, videoRecordingData.isAvailable, videoRecordingData.downloadUrl]);

  // Keep refs in sync with state for use inside long-lived event handlers
  useEffect(() => {
    hasTtsFinishedRef.current = hasTtsFinished;
  }, [hasTtsFinished]);

  useEffect(() => {
    isCountdownActiveRef.current = isCountdownActive;
  }, [isCountdownActive]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Check authentication and initialize
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/auth/login');
        return false;
      }
      
      // Check subscription status (free plan is not allowed for interviews)
      try {
        const subscriptionResponse = await subscriptionService.getUserSubscription();
        if (subscriptionResponse.success && subscriptionResponse.data) {
          if (!subscriptionResponse.data.isActive || subscriptionResponse.data.type === 'free') {
            // Redirect to interview page with subscription modal
            router.push('/interview');
            return false;
          }
        }
      } catch (error) {
        console.error('Failed to check subscription:', error);
        // Continue with interview if subscription check fails
      }
      
      return true;
    };

    checkAuth().then((isValid) => {
      if (isValid) {
        initializeInterview();
      }
    });

    return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }

    };
  }, [router]);

  // UNIFIED QUESTION TRANSITION SYSTEM - Declared before useEffect to be available in auto-submit
  // Auto submit helpers and state resets
  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsCountdownActive(false);
    isCountdownActiveRef.current = false;
  }, []);

  const handleAutoSubmit = useCallback(async () => {
    if (autoSubmitInProgressRef.current) return;
    autoSubmitInProgressRef.current = true;
    stopCountdown();
    try {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    } catch {}

    // Wait for recording to actually stop so the manual button's disabled condition isn't a blocker
    const waitUntilRecordingStops = async (timeoutMs = 2000) => {
      const start = Date.now();
      while (isRecordingRef.current && Date.now() - start < timeoutMs) {
        await new Promise((r) => setTimeout(r, 50));
      }
    };

    try {
      await waitUntilRecordingStops();
      // Click the manual Next/Submit button to reuse EXACT same logic
      submitButtonRef.current?.click();
    } finally {
      autoSubmitInProgressRef.current = false;
    }
  }, [stopCountdown]);

  const startCountdown = useCallback(() => {
    if (isCountdownActiveRef.current) return;
    setCountdownSeconds(30);
    setIsCountdownActive(true);
    isCountdownActiveRef.current = true;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setIsCountdownActive(false);
          isCountdownActiveRef.current = false;
          // Auto submit at 0
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleAutoSubmit]);

  const resetAutoFlowState = useCallback(() => {
    setHasTtsFinished(false);
    voiceDetectedRef.current = false;
    autoSubmitInProgressRef.current = false;
    stopCountdown();
    setCountdownSeconds(30);
  }, [stopCountdown]);

  const resetQuestionInterface = () => {
    setTranscription('');
    setFinalTranscript('');
    setIsRecording(false);
    setIsReadingQuestion(false);
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    resetAutoFlowState();
    console.log('🎯 Interface reset completed');
  };

  const transitionToNextMainQuestion = async (nextIndex: number) => {
    console.log('🎯 Transitioning to next main question');
    
    // Step 1: Show transition state (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Update to next main question
    setCurrentQuestionIndex(nextIndex);
    setIsFollowUpMode(false);
    setCurrentFollowUpIndex(0);
    setFollowUpQuestions([]);
    
    // Step 3: Reset interface
    resetQuestionInterface();
  };

  const transitionToNextFollowUp = async () => {
    console.log('🎯 Transitioning to next follow-up question');
    
    // Step 1: Show transition state (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Update to next follow-up
    setCurrentFollowUpIndex(prev => prev + 1);
    
    // Step 3: Reset interface (same as other transitions)
    resetQuestionInterface();
  };

  // Update transitionToFollowUpMode to reset follow-up index
  const transitionToFollowUpMode = async () => {
    console.log('🎯 Entering follow-up mode');
    
    // Step 1: Show transition state (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Enter follow-up mode with proper index reset
    setIsFollowUpMode(true);
    setCurrentFollowUpIndex(0);  // Reset to first follow-up
    
    // Step 3: Reset interface
    resetQuestionInterface();
  };

  // UNIFIED QUESTION TRANSITION SYSTEM - Update this function
  const handleQuestionTransition = async (result: any) => {
    console.log('🎯 handleQuestionTransition called with:', {
      isFollowUpMode,
      currentFollowUpIndex,
      followUpQuestionsLength: followUpQuestions.length,
      currentQuestionIndex,
      questionsLength: questions.length,
      nextQuestionIndex: result.data.nextQuestionIndex,
      hasFollowUpQuestions: result.data.followUpQuestions && result.data.followUpQuestions.length > 0
    });

    if (isFollowUpMode) {
      // Currently in follow-up mode
      if (currentFollowUpIndex < followUpQuestions.length - 1) {
        // Move to next follow-up question
        console.log('🎯 Moving to next follow-up question');
        await transitionToNextFollowUp();
      } else {
        // Last follow-up completed - move to next main question or finish
        console.log('🎯 Last follow-up completed, checking next main question');
        if (result.data.nextQuestionIndex !== null && result.data.nextQuestionIndex < questions.length) {
          console.log('🎯 Moving to next main question:', result.data.nextQuestionIndex);
          await transitionToNextMainQuestion(result.data.nextQuestionIndex);
        } else {
          // Only end interview if we've completed all main questions
          if (currentQuestionIndex >= questions.length - 1) {
            console.log('🎯 All main questions completed, ending interview');
            await generateFinalAssessment();
          } else {
            // Move to next main question
            console.log('🎯 Moving to next main question:', currentQuestionIndex + 1);
            await transitionToNextMainQuestion(currentQuestionIndex + 1);
          }
        }
      }
    } else {
      // Currently in main question mode
      if (result.data.followUpQuestions && result.data.followUpQuestions.length > 0) {
        // Enter follow-up mode
        console.log('🎯 Entering follow-up mode with', result.data.followUpQuestions.length, 'questions');
        await transitionToFollowUpMode();
      } else {
        // Move to next main question or finish
        console.log('🎯 No follow-ups, checking next main question');
        if (result.data.nextQuestionIndex !== null && result.data.nextQuestionIndex < questions.length) {
          console.log('🎯 Moving to next main question:', result.data.nextQuestionIndex);
          await transitionToNextMainQuestion(result.data.nextQuestionIndex);
        } else {
          // Only end interview if we've completed all main questions
          if (currentQuestionIndex >= questions.length - 1) {
            console.log('🎯 All main questions completed, ending interview');
            await generateFinalAssessment();
          } else {
            // Move to next main question
            console.log('🎯 Moving to next main question:', currentQuestionIndex + 1);
            await transitionToNextMainQuestion(currentQuestionIndex + 1);
          }
        }
      }
    }
  };





  // Initialize Speech Recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ SpeechRecognition not available');
      return;
    }
    
    console.log('🎤 Creating SpeechRecognition instance...');
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setIsRecording(true);
    };
    
    recognition.onresult = (event: any) => {
      console.log('🎤 Speech recognition result received:', event);
      console.log('🎤 Results type:', typeof event.results);
      console.log('🎤 Results:', event.results);
      
      // Ensure event.results exists
      if (!event.results) {
        console.log('🎤 No results found in event');
        return;
      }
      
      try {
        // SpeechRecognitionResultList is not an array, we need to access it differently
        const resultsLength = event.results.length;
        console.log('🎤 Processing results:', resultsLength, 'results');
        
        let finalText = '';
        let interimText = '';
        
        // Process each result using item() method or direct indexing
        for (let i = 0; i < resultsLength; i++) {
          const result = event.results.item ? event.results.item(i) : event.results[i];
          console.log('🎤 Result at index', i, ':', result);
          
          if (result && result[0]) {
            const transcript = result[0].transcript;
            console.log('🎤 Transcript:', transcript, 'isFinal:', result.isFinal);
            
            if (result.isFinal) {
              finalText += transcript + ' ';
              console.log('🎤 Final transcript:', transcript);
        } else {
              interimText += transcript + ' ';
              console.log('🎤 Interim transcript:', transcript);
            }
          }
        }
        
        // Update final transcript
        if (finalText.trim()) {
          setFinalTranscript(prev => prev + finalText.trim() + ' ');
        }
        
        // Update live transcription
        const fullTranscription = (finalText + interimText).trim();
        if (fullTranscription) {
          setTranscription(fullTranscription);
          console.log('🎤 Updated transcription:', fullTranscription);
          // Start auto countdown on first detected speech after TTS
          if (hasTtsFinishedRef.current && !voiceDetectedRef.current) {
            voiceDetectedRef.current = true;
            if (!isCountdownActiveRef.current) {
              startCountdown();
            }
          }
        }
        
      } catch (error) {
        console.error('Speech recognition error:', error);
        // Fallback: try to get any available transcript
        try {
          const firstResult = event.results.item ? event.results.item(0) : event.results[0];
          if (firstResult && firstResult[0]) {
            const transcript = firstResult[0].transcript;
            if (transcript) {
              setTranscription(transcript);
              console.log('🎤 Fallback transcript:', transcript);
              if (hasTtsFinishedRef.current && !voiceDetectedRef.current) {
                voiceDetectedRef.current = true;
                if (!isCountdownActiveRef.current) {
                  startCountdown();
                }
              }
            }
          }
        } catch (fallbackError) {
          console.error('Fallback speech recognition error:', fallbackError);
        }
      }
    };

    // Use speechstart to kick off countdown ASAP when browser fires it (may come before results)
    recognition.onspeechstart = () => {
      console.log('🎤 Speech detected (onspeechstart)');
      if (hasTtsFinishedRef.current && !voiceDetectedRef.current) {
        voiceDetectedRef.current = true;
        if (!isCountdownActiveRef.current) {
          startCountdown();
        }
      }
    };
    
    recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };
    
    recognition.onend = () => {
      console.log('🎤 Speech recognition ended');
      setIsRecording(false);
    };
    
    speechRecognitionRef.current = recognition;
    console.log('🎤 SpeechRecognition instance created and stored');
  }, []);

  // Text-to-speech functions
  const readQuestion = useCallback(async (questionText: string) => {
    if (ttsRequestInProgress || !questionText) return;
    
    setTtsRequestInProgress(true);
    setIsReadingQuestion(true);
    setHasTtsFinished(false);
    voiceDetectedRef.current = false;
    
    try {
      const authToken = getAuthTokenString();
      const response = await fetch(`${API_BASE_URL}/interview/ai/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ text: questionText })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsReadingQuestion(false);
          setTtsRequestInProgress(false);
          setHasTtsFinished(true);
          hasTtsFinishedRef.current = true;
          // Auto-start listening after AI finishes reading
          try {
            if (!isRecording) {
              startRecording();
            }
          } catch {}
        };
        
        audio.onerror = () => {
          setIsReadingQuestion(false);
          setTtsRequestInProgress(false);
          // Treat playback error as finished so user can answer
          setHasTtsFinished(true);
          hasTtsFinishedRef.current = true;
          try {
            if (!isRecording) {
              startRecording();
            }
          } catch {}
        };
        
        setCurrentAudio(audio);
        await audio.play();
      } else {
        setIsReadingQuestion(false);
        setTtsRequestInProgress(false);
        // If backend TTS fails, still allow answering
        setHasTtsFinished(true);
        hasTtsFinishedRef.current = true;
        try {
          if (!isRecording) {
            startRecording();
          }
        } catch {}
      }
    } catch (error) {
      setIsReadingQuestion(false);
      setTtsRequestInProgress(false);
      // Network error - continue flow to let user answer
      setHasTtsFinished(true);
      hasTtsFinishedRef.current = true;
      try {
        if (!isRecording) {
          startRecording();
        }
      } catch {}
    }
  }, [ttsRequestInProgress]);

  const stopReading = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setIsReadingQuestion(false);
    setTtsRequestInProgress(false);
  }, [currentAudio]);

    // Start recording
  const startRecording = useCallback(async () => {
    console.log('🎤 Attempting to start recording...');
    
    // Check if SpeechRecognition is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('❌ SpeechRecognition not supported in this browser');
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    // Request microphone permission first
    try {
      console.log('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      console.log('🎤 Microphone permission granted');
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      setError('Microphone permission is required for speech recognition. Please allow microphone access.');
      return;
    }
    
    // Ensure speech recognition is initialized
    if (!speechRecognitionRef.current) {
      console.log('🎤 Initializing speech recognition...');
      initializeSpeechRecognition();
    }
    
    if (speechRecognitionRef.current && !isRecording) {
      try {
    setTranscription('');
    setFinalTranscript('');
        setError(null); // Clear any previous errors
        speechRecognitionRef.current.start();
        
        console.log('🎤 Recording started successfully');
      } catch (error) {
        console.error('❌ Failed to start recording:', error);
        setError(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('🎤 Cannot start recording - already recording or no recognition available');
      if (isRecording) {
        setError('Recording is already in progress');
      } else {
        setError('Speech recognition not available');
      }
    }
  }, [isRecording, initializeSpeechRecognition]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (speechRecognitionRef.current && isRecording) {
      speechRecognitionRef.current.stop();
    }
  }, [isRecording]);

  // Initialize interview
  const initializeInterview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const authToken = getAuthTokenString();
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const interviewId = searchParams.get('interviewId');
      
      let interviewData;
      if (interviewId) {
        // Load existing interview
        const response = await fetch(`${API_BASE_URL}/interview/${interviewId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to load interview: ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        interviewData = result.data;
      } else {
        // Start new interview (fallback)
        const response = await fetch(`${API_BASE_URL}/interview/ai/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: 'behavioral',
          difficulty: 'medium',
          questionCount: 5
        })
      });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to start interview: ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        interviewData = result.data;
      }
      
      setInterviewConfig(interviewData);
      setQuestions(interviewData.questions);
      await initializeCamera();
      initializeSpeechRecognition();
      
      startSecurityMonitoring();
      
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize interview';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initialize camera
  const initializeCamera = async () => {
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 }, 
            facingMode: 'user' 
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 }, 
            facingMode: 'user' 
          }
        });
      }
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to access camera: ${errorMessage}`);
    }
  };

  // Security monitoring
  const startSecurityMonitoring = () => {
    if (!interviewConfig) return;
    
    monitoringIntervalRef.current = setInterval(async () => {
      await captureAndAnalyzeFrame();
    }, 5000);
  };

  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !interviewConfig) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');
      
      try {
        const authToken = getAuthTokenString();
        const response = await fetch(`${API_BASE_URL}/interview/ai/${interviewConfig.interviewId}/monitor`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: formData
        });
        
        const result = await response.json();
        setSecurityStatus(result.data);
        
        if (result.data.shouldPauseInterview) {
          handleSecurityViolation();
        }
        
      } catch {}
    }, 'image/jpeg', 0.8);
  };

  const handleSecurityViolation = () => {
    setError('Security violation detected. Interview paused.');
  };



  // Submit response handler
  const handleSubmitResponse = async () => {
    if (!interviewConfig) return;
    // Prevent duplicate autosubmits and clear timer
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsCountdownActive(false);
    
    // Use edited transcription if available, otherwise use final transcript
    const responseText = transcription.trim() || finalTranscript.trim();
    
    if (!responseText) {
      setError('No response recorded. Please speak your answer or type manually.');
      return;
    }
    
    setAiProcessing(true);
    
    try {
      const frameBlob = await captureCurrentFrame();
      
      const formData = new FormData();
      if (frameBlob) {
        formData.append('image', frameBlob, 'frame.jpg');
      }
      formData.append('textResponse', responseText);
      
      const authToken = getAuthTokenString();
      // Determine correct endpoint with safety checks for follow-ups
      let endpoint = `${API_BASE_URL}/interview/ai/${interviewConfig.interviewId}/submit/${currentQuestionIndex}`;
      if (isFollowUpMode) {
        if (followUpQuestions.length === 0) {
          console.warn('⚠️ Follow-up mode active but no follow-up questions present. Falling back to main question submission.');
        } else if (currentFollowUpIndex < 0 || currentFollowUpIndex >= followUpQuestions.length) {
          console.warn('⚠️ Invalid follow-up index. Index:', currentFollowUpIndex, 'Length:', followUpQuestions.length, 'Falling back to main question submission.');
        } else {
          endpoint = `${API_BASE_URL}/interview/ai/${interviewConfig.interviewId}/submit-followup/${currentQuestionIndex}/${currentFollowUpIndex}`;
        }
      }
      
      const response_api = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      
      if (!response_api.ok) {
        throw new Error('Failed to submit response');
      }
      
      const result = await response_api.json();
      console.log('✅ Submit response result:', result);
      setSecurityStatus(result.data.securityStatus);
      
      // Check if AI analysis is already included in the response
      if (result.data.aiAnalysis) {
        const analysisData = result.data.aiAnalysis;
        console.log('🎯 AI Analysis received:', analysisData);
        
        const analysisText = analysisData.analysis || analysisData.suggestions || analysisData.feedback || 'AI analysis completed';
        setAiResponseAnalysis(analysisText);
        
        if (analysisData.scores) {
          const overallScore = Math.round((analysisData.scores.clarity + 
            analysisData.scores.relevance + 
            analysisData.scores.depth + 
            analysisData.scores.structure) / 4);
          
          const newScores = {
            communication: analysisData.scores.clarity || 0,
            technical: analysisData.scores.depth || 0,
            problemSolving: analysisData.scores.structure || 0,
            confidence: analysisData.scores.relevance || 0,
            overall: overallScore
          };
          
          setCurrentScores(newScores);
          setShowScores(true);
          console.log('🎯 Scores set:', newScores);
          console.log('🎯 showScores set to true');
    } else {
          console.log('❌ No scores found in AI analysis');
        }
      } else {
        // Generate AI response analysis separately
        const transcriptionText = result.data.transcription || responseText;
        if (transcriptionText && transcriptionText.trim().length > 0) {
        const currentQ = isFollowUpMode 
          ? followUpQuestions[currentFollowUpIndex] 
            : questions[currentQuestionIndex]?.question || '';
          await generateAIResponseAnalysis(transcriptionText, currentQ, questions[currentQuestionIndex]?.type || 'behavioral');
        }
      }
      
      // Set follow-up questions if available
      if (result.data.followUpQuestions && result.data.followUpQuestions.length > 0) {
        console.log('🧩 Received follow-up questions from backend:', result.data.followUpQuestions);
        setFollowUpQuestions(result.data.followUpQuestions);
      }
      
      // NEW CLEAN TRANSITION LOGIC - Unified approach for all question types
      await handleQuestionTransition(result);
      
    } catch {
      setError('Failed to submit response');
    } finally {
      setAiProcessing(false);
      resetAutoFlowState();
    }
  };

  // Reset for new question
  const resetForNewQuestion = () => {
    setTranscription('');
    setFinalTranscript('');
    
    setAiResponseAnalysis('');
    setCurrentScores(null);
    setShowScores(false);
    setIsRecording(false);
    setIsReadingQuestion(false);
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    // Note: readQuestions is not cleared here to prevent re-reading the same questions
  };



  // Reset for new question preserving scores and AI analysis
  const resetForNewQuestionPreserveScores = () => {
    setTranscription('');
    setFinalTranscript('');
    
    // Note: Scores and AI analysis are preserved until new ones are ready
    setIsRecording(false);
    setIsReadingQuestion(false);
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    // readQuestions is preserved to prevent skipping first follow-up
  };

  // Manual progression to next follow-up question
  const handleNextFollowUp = async () => {
    if (isFollowUpMode && currentFollowUpIndex < followUpQuestions.length - 1) {
      await transitionToNextFollowUp();
    }
  };

  const captureCurrentFrame = async (): Promise<Blob | null> => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return null;
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
  };

  const generateAIResponseAnalysis = async (transcription: string, question: string, questionType: string) => {
    try {
      const authToken = getAuthTokenString();
      const response = await fetch(`${API_BASE_URL}/interview/ai/analyze-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ transcription, question, questionType })
      });
      
      if (response.ok) {
        const result = await response.json();
        const analysisData = result.data;
        
        // Set AI analysis text
        const analysisText = analysisData.analysis || analysisData.suggestions || analysisData.feedback || 'AI analysis completed';
        setAiResponseAnalysis(analysisText);
        
        // Set scores if available
        if (analysisData.scores) {
          const overallScore = Math.round((analysisData.scores.clarity + 
            analysisData.scores.relevance + 
            analysisData.scores.depth + 
            analysisData.scores.structure) / 4);
          
          setCurrentScores({
            communication: analysisData.scores.clarity || 0,
            technical: analysisData.scores.depth || 0,
            problemSolving: analysisData.scores.structure || 0,
            confidence: analysisData.scores.relevance || 0,
            overall: overallScore
          });
          setShowScores(true);
        } else if (analysisData.overallScore) {
          // Fallback if scores are in different format
          setCurrentScores({
            communication: analysisData.communicationScore || 70,
            technical: analysisData.technicalScore || 70,
            problemSolving: analysisData.problemSolvingScore || 70,
            confidence: analysisData.confidenceScore || 70,
            overall: analysisData.overallScore || 70
          });
          setShowScores(true);
        }
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AI analysis failed: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setAiResponseAnalysis('AI analysis completed with suggestions for improvement');
    }
  };

  const generateFinalAssessment = async () => {
    if (!interviewConfig) return;
    
    // Safety check: ensure all questions are completed
    if (currentQuestionIndex < questions.length - 1) {
      console.log('🎯 Interview not complete yet. Current question:', currentQuestionIndex + 1, 'of', questions.length);
      return;
    }
    
    // Safety check: ensure we're not in follow-up mode
    if (isFollowUpMode && currentFollowUpIndex < followUpQuestions.length - 1) {
      console.log('🎯 Follow-up questions not complete yet. Current follow-up:', currentFollowUpIndex + 1, 'of', followUpQuestions.length);
      return;
    }
    
    console.log('🎯 All questions completed. Generating final assessment...');
    
    try {
      const authToken = getAuthTokenString();
      const response = await fetch(`${API_BASE_URL}/interview/ai/${interviewConfig.interviewId}/assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate assessment');
      }
      
      const result = await response.json();
      setReport(result.data.assessment);
      setFinished(true);
      
    } catch {
      setError('Failed to generate final assessment');
    }
  };









  // Auto-read questions
  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentFollowUpQuestion = isFollowUpMode && followUpQuestions[currentFollowUpIndex];
    const displayQuestion = isFollowUpMode ? currentFollowUpQuestion : currentQuestion?.question;
    
    if (displayQuestion && !isReadingQuestion && !ttsRequestInProgress) {
      const questionToRead = isFollowUpMode ? currentFollowUpQuestion : displayQuestion;
      if (questionToRead) {
        // For follow-up questions, only read once per question
        if (isFollowUpMode) {
          const followUpKey = `${currentQuestionIndex}-${currentFollowUpIndex}`;
          if (!readQuestionsRef.current.has(followUpKey)) {
            readQuestion(questionToRead);
            readQuestionsRef.current.add(followUpKey);
          }
        } else {
          // For main questions, only read if not already read
          if (!readQuestionsRef.current.has(currentQuestionIndex)) {
            readQuestion(questionToRead);
            readQuestionsRef.current.add(currentQuestionIndex);
          }
        }
      }
    }
  }, [questions, currentQuestionIndex, followUpQuestions, currentFollowUpIndex, isFollowUpMode, isReadingQuestion, ttsRequestInProgress, readQuestion]);

  // Add this useEffect to handle follow-up indexing
  useEffect(() => {
    if (isFollowUpMode && followUpQuestions.length > 0) {
      // Ensure we have a valid current follow-up index
      if (currentFollowUpIndex >= followUpQuestions.length) {
        setCurrentFollowUpIndex(0);
      }
    }
  }, [isFollowUpMode, followUpQuestions, currentFollowUpIndex]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Initializing AI Interview</h2>
          <p className="text-gray-600">Setting up camera and preparing questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview Setup Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => router.push('/auth/login')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Login
            </button>
            <button 
              onClick={() => router.push('/interview')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Interview
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (finished && report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center">
        <div className="max-w-4xl w-full mx-auto p-8">
          <InterviewReport 
            report={report} 
            interviewId={interviewConfig?.interviewId}
            videoRecording={videoRecordingData}
            onForceCreateDownloadUrl={() => {
              console.log('🎥 Interview page: Manual force create download URL');
              // Force create download URL directly
              if (videoRecordingData.isAvailable && !videoRecordingData.downloadUrl) {
                // Create blob from chunks if we have them
                const chunks = videoRecorderRef.current?.getRecordedChunks();
                if (chunks && chunks.length > 0) {
                  console.log('🎥 Creating blob from', chunks.length, 'chunks');
                  const blob = new Blob(chunks, { type: 'video/webm' });
                  const downloadUrl = URL.createObjectURL(blob);
                  console.log('🎥 Manual blob created, URL:', downloadUrl);
                  
                  // Update the video recording data
                  const newVideoData = {
                    ...videoRecordingData,
                    downloadUrl,
                    isAvailable: true
                  };
                  setVideoRecordingData(newVideoData);
                } else {
                  console.log('🎥 No chunks available for manual creation');
                }
              }
            }}
          />
          <div className="mt-8 text-center space-x-4">
            <button 
              onClick={() => router.push('/interview')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Interview Home
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentFollowUpQuestion = isFollowUpMode && followUpQuestions[currentFollowUpIndex];
  const displayQuestion = isFollowUpMode ? currentFollowUpQuestion : currentQuestion?.question;
  const questionType = currentQuestion?.type || 'behavioral';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex flex-col no-select no-context-menu no-right-click no-drag">
      {showSecurityWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-50 border-2 border-red-300 rounded-2xl p-8 max-w-md w-full text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-4">Security Violation Detected</h2>
            <p className="text-red-700 mb-6">
              Screenshots, screen sharing, or recording attempts are not allowed during this interview. 
            </p>
            <button
              onClick={() => setShowSecurityWarning(false)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              I Understand
          </button>
          </motion.div>
        </div>
      )}

     <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      {/* Left Section - Logo and Back Button */}
      <div className="flex items-center gap-6">
        <button 
          onClick={() => router.push('/interview')} 
          className="flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
          </button>
          
        {/* Logo - Clickable to go to home */}
        <div className="flex items-center">
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img 
              src="/aslogo.svg" 
              alt="Ascend Skills" 
              className="h-10 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/aslogo.png';
              }}
            />
            <span className="ml-3 text-xl font-bold text-gradient-primary">
              Ascend Skills
            </span>
          </button>
          </div>
        </div>
        
      {/* Right Section - Interview Status and Controls */}
      <div className="flex items-center space-x-4">
        {/* Interview Progress - Center */}
        <div className="hidden md:flex items-center">
          <div className="text-center">
          <div className="text-sm font-medium text-gray-900">
            {isFollowUpMode 
              ? `Follow-up ${currentFollowUpIndex + 1} of ${followUpQuestions.length}`
              : `Question ${currentQuestionIndex + 1} of ${questions.length}`
            }
          </div>
          <div className="text-xs text-gray-500">
            {isFollowUpMode ? `(Question ${currentQuestionIndex + 1})` : 'AI Interview Session'}
          </div>
          {/* Progress Bar */}
          <div className="mt-2 w-32 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                isFollowUpMode 
                  ? 'bg-blue-500' 
                  : 'bg-green-500'
              }`}
              style={{
                width: isFollowUpMode 
                  ? `${((currentFollowUpIndex + 1) / followUpQuestions.length) * 100}%`
                  : `${((currentQuestionIndex + 1) / questions.length) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>
      
        {/* Scores Display */}
      {showScores && currentScores && (
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2">
            {getScoreIcon(currentScores.overall)}
            <div className="text-center">
              <div className={`text-sm font-bold ${getScoreTextColor(currentScores.overall)}`}>{currentScores.overall}%</div>
              <div className="text-xs text-gray-500">Overall</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <div className="text-center">
              <div className={`text-xs font-bold ${getScoreTextColor(currentScores.communication)}`}>{currentScores.communication}%</div>
              <div className="text-xs text-gray-500">Comm</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-600" />
            <div className="text-center">
              <div className={`text-xs font-bold ${getScoreTextColor(currentScores.technical)}`}>{currentScores.technical}%</div>
              <div className="text-xs text-gray-500">Tech</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-600" />
            <div className="text-center">
              <div className={`text-xs font-bold ${getScoreTextColor(currentScores.problemSolving)}`}>{currentScores.problemSolving}%</div>
              <div className="text-xs text-gray-500">Solve</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-600" />
            <div className="text-center">
              <div className={`text-xs font-bold ${getScoreTextColor(currentScores.confidence)}`}>{currentScores.confidence}%</div>
              <div className="text-xs text-gray-500">Conf</div>
            </div>
          </div>
        </div>
      )}
      
        {/* Security Status */}
        {securityStatus && (
          <div className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 ${
            securityStatus.isSecure 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
          }`}>
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">
              {securityStatus.isSecure ? 'Secure' : `${securityStatus.violationCount} Violations`}
            </span>
          </div>
        )}
        
        {securityViolations.length > 0 && (
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all duration-300">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {securityViolations.length} Security Violation{securityViolations.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
        
        
        {/* Recording Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 ${
                isRecording 
            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
        }`}>
                {isRecording ? (
            <>
              <Mic className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">
                Recording
              </span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4" />
              <span className="text-sm font-medium">
                Ready
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
</header>
          
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full gap-6 py-6 px-6">
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          <div className="lg:w-1/2 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Video Feed</h3>
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {aiProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Brain className="w-12 h-12 animate-pulse mx-auto mb-2" />
                    <p className="text-lg font-semibold">AI Processing...</p>
            </div>
            </div>
              )}
            </div>
            </div>
              
          <div className="lg:w-1/2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Current Question</h3>
              <div className="flex items-center gap-4">
                
                {displayQuestion && (
                <div className="flex items-center gap-2">
                    {isReadingQuestion ? (
                      <button
                        onClick={stopReading}
                        className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Pause className="w-4 h-4" />
                        <span className="text-sm">Stop</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => readQuestion(displayQuestion)}
                        disabled={ttsRequestInProgress}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        <Play className="w-4 h-4" />
                        <span className="text-sm">Read Aloud</span>
          </button>
                    )}
                      
                      <button
                      onClick={() => readQuestion(displayQuestion)}
                      disabled={ttsRequestInProgress}
                      className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4" />
                      <span className="text-sm">Re-read</span>
          </button>
                  </div>
                )}
      </div>
            </div>
            
            {displayQuestion && (
            <div>
                <div className="text-blue-600 text-sm font-medium mb-2 flex items-center gap-2">
                  {isFollowUpMode ? (
                    <span className="flex items-center gap-2">
                      <span>Follow-up Question</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {currentFollowUpIndex + 1} of {followUpQuestions.length}
                      </span>
                    </span>
                  ) : (
                    `${questionType.charAt(0).toUpperCase() + questionType.slice(1)} Question`
                  )}
              </div>
                <p className="text-black text-lg leading-relaxed">
                  {displayQuestion}
                </p>
                {isFollowUpMode && (
                  <div className="mt-2 text-sm text-black">
                    Original question: {currentQuestion?.question}
            </div>
              )}
                
                {/* AI Suggestions Section - Moved here and redesigned */}
                {aiResponseAnalysis && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-purple-900">AI Insights & Suggestions</h4>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-100">
                      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">{aiResponseAnalysis}</p>
                    </div>
                  </div>
                )}
            </div>
            )}
            </div>
            </div>

        <div className="w-full bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Your Response</h3>
            
            <div className="flex items-center gap-3">
              {isCountdownActive && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-amber-50 text-amber-800 border-amber-200">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Auto submit in {countdownSeconds}s</span>
                </div>
              )}
              {!isRecording && !aiProcessing && (
                <button
                  onClick={startRecording}
                  disabled={aiProcessing}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </button>
              )}
              
              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <MicOff className="w-5 h-5" />
                  Stop Recording
                </button>
              )}
              
            <button
              ref={submitButtonRef}
              onClick={handleSubmitResponse}
                disabled={!transcription.trim() && !finalTranscript.trim() || aiProcessing || isRecording}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  {(() => {
                    if (isFollowUpMode) {
                      if (currentFollowUpIndex === followUpQuestions.length - 1) {
                        // Last follow-up - check if there are more main questions
                        if (currentQuestionIndex < questions.length - 1) {
                          return 'Next Main Question';
                        } else {
                          return 'Finish Interview';
                        }
                      } else {
                        return 'Next Follow-up';
                      }
                    } else {
                      // Main question mode
                      if (currentQuestionIndex === questions.length - 1) {
                        return 'Finish Interview';
                      } else {
                        return 'Next Question';
                      }
                    }
                  })()}
                </>
              )}
            </button>
            

            </div>
            </div>
          
          <div className="space-y-6">
            {/* Recording Status - Full Width */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Recording Status</h4>
              <div className={`w-full p-3 rounded-lg border-2 transition-all duration-300 ${
                isRecording 
                    ? 'bg-red-50 text-red-700 border-red-200' 
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                    <div className="flex items-center gap-2">
                  {isRecording ? (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-medium">Recording in progress...</span>
                    </>
                ) : (
                    <>
                      <MicOff className="w-4 h-4" />
                    <span className="font-medium">Click "Start Recording" to begin</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Live Transcription - Full Width */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-700">Transcription</h4>
                  {transcription.trim() && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                      <span className="text-gray-500">
                        {isRecording ? 'Live' : 'Editable'}
                      </span>
            </div>
                  )}
          </div>
              <div className="w-full min-h-[12rem] rounded-lg border border-gray-300 p-4 bg-white">
            <textarea
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    placeholder="Click 'Start Recording' and speak your answer, or type manually..."
                    className="w-full h-full min-h-[10rem] text-black text-sm leading-relaxed bg-transparent border-none outline-none resize-none"
                    disabled={isRecording}
            />
          </div>
        </div>
      </div>
            
          {/* Follow-up Questions - Full Width */}
          {followUpQuestions.length > 0 && !isFollowUpMode && (
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
            </div>
                <h4 className="font-semibold text-yellow-900">AI Follow-up Questions</h4>
          </div>
              <div className="bg-white rounded-lg p-3 border border-yellow-100">
                <ul className="space-y-2">
                    {followUpQuestions.map((question, index) => (
                    <li key={index} className="text-gray-800 text-sm flex items-start gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => setShowInstructions(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <Info className="w-4 h-4" />
              View Instructions
            </button>
            
            
          </div>
        </div>
      </div>

      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">AI Interview Instructions</h2>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Security Guidelines
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Ensure only one person (you) is visible in the camera</li>
                  <li>• Remove all unauthorized materials and devices</li>
                  <li>• Use your built-in camera only</li>
                  <li>• Maintain good lighting and clear audio</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  AI Features
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Your responses are transcribed using AI</li>
                  <li>• AI generates personalized follow-up questions</li>
                  <li>• Real-time security monitoring</li>
                  <li>• Comprehensive AI assessment at the end</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-500" />
                  Best Practices
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Speak clearly and at a moderate pace</li>
                  <li>• Use the STAR method for behavioral questions</li>
                  <li>• Provide specific examples and details</li>
                  <li>• Look at the camera, not the screen</li>
                </ul>
              </div>
            </div>
            
            <button
              onClick={() => setShowInstructions(false)}
              className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Got it!
            </button>
          </motion.div>
        </div>
      )}

      {/* Video Recorder Component */}
      <VideoRecorder
        isRecording={isRecording}
        isInterviewActive={!finished && !loading && !error}
        onRecordingStateChange={handleVideoRecordingStateChange}
        onRecordingDataChange={handleVideoRecordingDataChange}
        shouldStopRecording={finished}
        ref={videoRecorderRef}
      />


    </div>
  );
}

export default function InterviewStartPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SecurityProvider
        securityLevel="high"
        enableScreenshotPrevention={true}
        enableKeyboardBlocking={true}
        enableTabSwitchDetection={true}
        enableCopyPastePrevention={true}
        onSecurityViolation={() => {}}
      >
        <InterviewContent />
      </SecurityProvider>
    </Suspense>
  );
} 