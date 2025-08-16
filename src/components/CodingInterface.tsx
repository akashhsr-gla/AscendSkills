import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Send, 
  RotateCcw, 
  Save, 
  Settings, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Users, 
  Code, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Lightbulb, 
  Star, 
  ArrowLeft, 
  ArrowRight, 
  Maximize2, 
  Minimize2, 
  Copy,
  Upload,
  Download,
  RefreshCw,
  Zap,
  Trophy,
  Target,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Palette,
  Volume2,
  VolumeX,
  GitBranch,
  History,
  Share2,
  Moon,
  Sun,
  Loader2
} from 'lucide-react';
import { codingService, type CodingSubmission } from '@/services/codingService';

// Sample problem data
const sampleProblem = {
  id: "two-sum",
  title: "Two Sum",
  difficulty: "Easy",
  description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
    },
    {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]",
      explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
    },
    {
      input: "nums = [3,3], target = 6",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 6, we return [0, 1]."
    }
  ],
  constraints: [
    "2 <= nums.length <= 10⁴",
    "-10⁹ <= nums[i] <= 10⁹",
    "-10⁹ <= target <= 10⁹",
    "Only one valid answer exists."
  ],
  tags: ["Array", "Hash Table", "Two Pointers"],
  starterCode: {
    python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your solution here
        pass`,
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Write your solution here
    
};`,
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        
    }
}`,
    cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        
    }
};`
  },
  timeLimit: 1000,
  memoryLimit: 256,
  acceptanceRate: 51.3,
  totalSubmissions: 8234567,
  totalAccepted: 4231234
};

interface CodingInterfaceProps {
  problem?: any;
  onSubmit?: (code: string, language: string) => void;
  onBack?: () => void;
  questionId?: string;
  isQuizMode?: boolean;
}

const CodingInterface = ({ 
  problem: propProblem, 
  onSubmit, 
  onBack, 
  questionId,
  isQuizMode = false 
}: CodingInterfaceProps) => {
  const [problem] = useState(propProblem || sampleProblem);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [submissionHistory, setSubmissionHistory] = useState<CodingSubmission[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [runtime, setRuntime] = useState<string | null>(null);
  const [memory, setMemory] = useState<string | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<CodingSubmission | null>(null);
  
  const editorRef = useRef(null);
  const resizeRef = useRef(null);

  const languages = codingService.getSupportedLanguages().map(lang => ({
    id: lang.id,
    name: lang.name,
    icon: <Code className="w-3 h-3" />,
    color: 'text-blue-400'
  }));

  const themes = [
    { id: 'dark', name: 'Dark', bg: 'bg-gray-900', text: 'text-green-400' },
    { id: 'light', name: 'Light', bg: 'bg-white', text: 'text-gray-900' },
    { id: 'monokai', name: 'Monokai', bg: 'bg-gray-800', text: 'text-purple-300' },
    { id: 'github', name: 'GitHub', bg: 'bg-gray-50', text: 'text-gray-800' },
    { id: 'dracula', name: 'Dracula', bg: 'bg-purple-900', text: 'text-pink-300' }
  ];

  useEffect(() => {
    const starterCode = problem.starterCode?.[selectedLanguage] || 
                       problem.coding?.starterCode ||
                       codingService.getStarterCode(selectedLanguage);
    setCode(starterCode);
  }, [selectedLanguage, problem.starterCode, problem.coding?.starterCode]);

  // Load submission history when component mounts
  useEffect(() => {
    if (questionId && !isQuizMode) {
      loadSubmissionHistory();
    }
  }, [questionId, isQuizMode]);

  // Mouse resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const containerWidth = window.innerWidth;
      const newWidth = (e.clientX / containerWidth) * 100;
      setLeftPanelWidth(Math.max(30, Math.min(70, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const loadSubmissionHistory = async () => {
    try {
      if (questionId) {
        const response = await codingService.getSubmissionHistory(questionId);
        setSubmissionHistory(response.data.submissions);
      }
    } catch (error) {
      console.error('Error loading submission history:', error);
    }
  };

  const handleRunCode = async () => {
    if (!questionId || !code.trim()) {
      setConsoleOutput('Please write some code before running.');
      setShowConsole(true);
      return;
    }

    setIsRunning(true);
    setShowConsole(true);
    setConsoleOutput('Running test cases...\n');
    
    try {
      // Always use real backend execution for proper test case handling
      const response = await codingService.runCode(questionId, code, selectedLanguage);
      
      if (response.success) {
        setConsoleOutput('Code executed successfully!\n');
        
        // Handle the response structure from backend
        if (response.data?.results && response.data.results.length > 0) {
          const results = response.data.results.map((result: any, idx: number) => ({
            id: idx,
            input: result.input,
            expectedOutput: result.expectedOutput,
            actualOutput: result.actualOutput,
            status: result.status || 'unknown',
            runtime: result.executionTime + 'ms',
            memory: 'N/A'
          }));
          
          setTestResults(results);
          setRuntime(response.data.summary?.executionTime + 'ms');
          setMemory('N/A');
          
          const passed = results.filter((r: any) => r.status === 'passed').length;
          setConsoleOutput(`Test Results: ${passed}/${results.length} passed\n` + 
            results.map((r: any) => `Test ${r.id + 1}: ${(r.status || 'unknown').toUpperCase()}`).join('\n'));
        } else if ((response.data as any)?.error) {
          // Handle SPHERE ENGINE API key not configured error
          setConsoleOutput(`Error: ${(response.data as any).error}\n\nPlease configure SPHERE ENGINE API key to run code execution.`);
        } else if ((response.data as any)?.testResults && Array.isArray((response.data as any).testResults) && (response.data as any).testResults.length > 0) {
          // Handle SPHERE ENGINE test results format
          const results = (response.data as any).testResults.map((result: any, idx: number) => ({
            id: idx,
            input: result.input || 'N/A',
            expectedOutput: result.expectedOutput || 'N/A',
            actualOutput: result.actualOutput || 'N/A',
            status: result.status || 'unknown',
            runtime: result.executionTime + 'ms',
            memory: 'N/A'
          }));
          
          setTestResults(results);
          setRuntime((response.data as any).executionTime + 'ms');
          setMemory('N/A');
          
          const passed = results.filter((r: any) => r.status === 'passed').length;
          setConsoleOutput(`Test Results: ${passed}/${results.length} passed\n` + 
            results.map((r: any) => `Test ${r.id + 1}: ${(r.status || 'unknown').toUpperCase()}`).join('\n'));
        } else {
          // No test results available
          setConsoleOutput('No test results available. Please check your code and try again.');
        }
      } else {
        // Handle authentication error specifically
        const errorMessage = (response.data as any)?.message || 'Failed to execute code';
        if (errorMessage.includes('authentication')) {
          setConsoleOutput('Error: Please log in to execute code. Authentication required.\n');
        } else {
          setConsoleOutput(`Error: ${errorMessage}\n`);
        }
      }
      
      setIsRunning(false);
    } catch (error: any) {
      console.error('Run code error:', error);
      
      // Handle specific error types
      if (error.message?.includes('401') || error.message?.includes('authentication')) {
        setConsoleOutput('Error: Please log in to execute code. Authentication required.\n');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setConsoleOutput('Error: Network error. Please check your connection and try again.\n');
      } else {
        setConsoleOutput(`Error: ${error.message || 'Failed to execute code'}\n`);
      }
      
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setConsoleOutput('Please write some code before submitting.');
      setShowConsole(true);
      return;
    }

    setIsSubmitting(true);
    setShowConsole(true);
    setConsoleOutput('Submitting solution...\n');
    
    try {
      if (isQuizMode && onSubmit) {
        // For quiz mode, call the parent callback
        onSubmit(code, selectedLanguage);
        setIsSubmitting(false);
        return;
      }

      if (!questionId) {
        throw new Error('Question ID is required for submission');
      }

      // Submit to SPHERE API
      const response = await codingService.submitCode(questionId, code, selectedLanguage);
      const submissionId = response.data.submissionId;
      
      setConsoleOutput('Solution submitted! Waiting for evaluation...\n');
      
      // Poll for results
      const result = await codingService.pollSubmissionStatus(submissionId);
      setCurrentSubmission(result);
      
      // Add to submission history
      setSubmissionHistory([result, ...submissionHistory]);
      
      // Update console output
      let output = `Submission completed!\n`;
      output += `Status: ${result.status.toUpperCase()}\n`;
      output += `Score: ${result.score}%\n`;
      output += `Test Cases: ${result.passedTestCases}/${result.totalTestCases} passed\n`;
      output += `Runtime: ${result.executionTime}ms\n`;
      output += `Memory: ${result.memoryUsed}KB\n`;
      output += `Performance: ${result.performanceRating}\n`;
      
      if (result.status === 'accepted') {
        output += '\n🎉 Congratulations! Your solution is correct!';
      } else if (result.compilationError) {
        output += `\nCompilation Error:\n${result.compilationError}`;
      } else if (result.runtimeError) {
        output += `\nRuntime Error:\n${result.runtimeError}`;
      } else {
        output += '\n❌ Solution failed some test cases. Try again!';
      }
      
      setConsoleOutput(output);
      setIsSubmitting(false);
      
    } catch (error) {
      console.error('Submit error:', error);
      setConsoleOutput(`Error: ${error}\n`);
      setIsSubmitting(false);
    }
  };

  const handleResetCode = () => {
    const starterCode = (problem.starterCode as any)?.[selectedLanguage] || 
                       problem.coding?.starterCode ||
                       codingService.getStarterCode(selectedLanguage);
    setCode(starterCode);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const syntaxHighlight = (code: string) => {
    const keywords = {
      python: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'pass', 'break', 'continue'],
      javascript: ['function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return', 'class', 'extends', 'import', 'export'],
      java: ['public', 'private', 'protected', 'class', 'interface', 'if', 'else', 'for', 'while', 'return', 'static', 'final'],
      cpp: ['class', 'public', 'private', 'protected', 'if', 'else', 'for', 'while', 'return', 'static', 'const', 'vector']
    };

    let highlightedCode = code;
    const langKeywords = (keywords as any)[selectedLanguage] || [];
    
    // Basic syntax highlighting
    langKeywords.forEach((keyword: string) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlightedCode = highlightedCode.replace(regex, `<span class="text-purple-400 font-bold">${keyword}</span>`);
    });
    
    // Strings
    highlightedCode = highlightedCode.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="text-yellow-300">$1$2$1</span>');
    
    // Numbers
    highlightedCode = highlightedCode.replace(/\b\d+(\.\d+)?\b/g, '<span class="text-blue-300">$&</span>');
    
    // Comments
    highlightedCode = highlightedCode.replace(/(\/\/.*$|#.*$)/gm, '<span class="text-gray-500 italic">$1</span>');
    
    return highlightedCode;
  };

  const currentTheme = themes.find(t => t.id === theme);

  return (
    <div className={`h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden`}>
      {/* Header */}
      <div className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {isQuizMode && onBack ? (
              <button 
                onClick={onBack}
                className="flex items-center text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Quiz
              </button>
            ) : (
              <button className="flex items-center text-slate-300 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Problems
              </button>
            )}
            <div className="h-6 w-px bg-slate-600"></div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-white">{problem.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Trophy className="w-4 h-4" />
                <span>Acceptance: {problem.acceptanceRate}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-700 rounded-lg px-3 py-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">{problem.timeLimit}ms</span>
            </div>
            
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              {languages.map(lang => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-6 z-50 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl">
          <h3 className="text-white font-semibold mb-3">Editor Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 text-sm"
              >
                {themes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Font Size</label>
              <input
                type="range"
                min="12"
                max="20"
                value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-slate-500">{fontSize}px</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Problem Description */}
        <div className="bg-slate-800/50 backdrop-blur-sm border-r border-slate-700 overflow-hidden" style={{ width: `${leftPanelWidth}%` }}>
          <div className="flex border-b border-slate-700">
            {['description', 'editorial', 'solutions', 'submissions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab 
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                }`}
              >
                {tab === 'description' && <BookOpen className="w-4 h-4 inline mr-2" />}
                {tab === 'editorial' && <Lightbulb className="w-4 h-4 inline mr-2" />}
                {tab === 'solutions' && <Code className="w-4 h-4 inline mr-2" />}
                {tab === 'submissions' && <History className="w-4 h-4 inline mr-2" />}
                {tab}
              </button>
            ))}
          </div>
          
          <div className="p-6 overflow-y-auto h-full">
            {activeTab === 'description' && (
              <div className="space-y-6">
                <div>
                  <p className="text-slate-300 leading-relaxed text-sm">{problem.description}</p>
                </div>
                
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Examples
                  </h3>
                  <div className="space-y-4">
                    {(problem.examples || []).map((example: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                        <div className="text-sm font-medium text-slate-400 mb-2">Example {idx + 1}</div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-slate-400">Input:</span>
                            <pre className="bg-slate-800 text-green-400 p-2 rounded mt-1 font-mono text-xs overflow-x-auto">
                              {example.input}
                            </pre>
                          </div>
                          <div>
                            <span className="text-slate-400">Output:</span>
                            <pre className="bg-slate-800 text-blue-400 p-2 rounded mt-1 font-mono text-xs overflow-x-auto">
                              {example.output}
                            </pre>
                          </div>
                          {example.explanation && (
                            <div>
                              <span className="text-slate-400">Explanation:</span>
                              <p className="text-slate-300 mt-1 text-xs">{example.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-white font-semibold mb-3">Constraints</h3>
                  <ul className="space-y-1 text-sm">
                    {(problem.constraints || []).map((constraint: string, idx: number) => (
                      <li key={idx} className="text-slate-300 flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        <code className="font-mono text-xs">{constraint}</code>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-white font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {(problem.tags || []).map((tag: string, idx: number) => (
                      <span key={idx} className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-600/30">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'submissions' && (
              <div className="space-y-4">
                <h3 className="text-white font-semibold">Recent Submissions</h3>
                {submissionHistory.length === 0 ? (
                  <p className="text-slate-400 text-sm">No submissions yet</p>
                ) : (
                  <div className="space-y-3">
                    {submissionHistory.map((submission) => (
                      <div key={submission.submissionId} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${
                            submission.status === 'accepted' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {submission.status === 'accepted' ? <CheckCircle className="w-4 h-4 inline mr-1" /> : <XCircle className="w-4 h-4 inline mr-1" />}
                            {submission.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-400">{new Date(submission.submittedAt).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-400 space-x-4">
                          <span>Score: {submission.score}%</span>
                          <span>Runtime: {submission.executionTime || 0}ms</span>
                          <span>Memory: {submission.memoryUsed || 0}KB</span>
                          <span>Language: {submission.language}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Tests: {submission.passedTestCases}/{submission.totalTestCases} passed
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          ref={resizeRef}
          className="w-1 bg-slate-700 cursor-col-resize hover:bg-slate-600 transition-colors"
          onMouseDown={() => setIsResizing(true)}
        />

        {/* Right Panel - Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Header */}
          <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <Code className="w-4 h-4" />
                  <span>Code</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`flex items-center space-x-1 ${languages.find(l => l.id === selectedLanguage)?.color || 'text-slate-400'}`}>
                    {languages.find(l => l.id === selectedLanguage)?.icon}
                    <span>{languages.find(l => l.id === selectedLanguage)?.name}</span>
                  </div>
                </div>
                {runtime && (
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-slate-400">Runtime: {runtime}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Terminal className="w-3 h-3 text-blue-400" />
                      <span className="text-slate-400">Memory: {memory}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleResetCode}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Reset Code"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-slate-900">
              <div className="h-full flex">
                {/* Line numbers */}
                <div className="bg-slate-800 text-slate-500 text-xs font-mono px-3 py-4 border-r border-slate-700">
                  {code.split('\n').map((_, idx) => (
                    <div key={idx} className="leading-6 text-right">
                      {idx + 1}
                    </div>
                  ))}
                </div>
                
                {/* Code area */}
                <div className="flex-1 relative">
                  <textarea
                    ref={editorRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full bg-transparent text-gray-100 font-mono resize-none focus:outline-none px-4 py-4 leading-6"
                    style={{ fontSize: `${fontSize}px` }}
                    placeholder="// Start coding here..."
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Console/Test Results */}
          {showConsole && (
            <div className="bg-slate-800/80 backdrop-blur-sm border-t border-slate-700 h-48 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Console</span>
                </div>
                <button
                  onClick={() => setShowConsole(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 h-full overflow-y-auto">
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                  {consoleOutput}
                </pre>
                
                {testResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {testResults.map((result, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-900/50 rounded p-2">
                        <div className="flex items-center space-x-2">
                          {(result as any).status === 'passed' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="text-xs text-slate-400">Test Case {idx + 1}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {(result as any).runtime} • {(result as any).memory}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isRunning ? (
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Run
                </button>
                
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowConsole(!showConsole)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Toggle Console"
                >
                  <Terminal className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Copy Code"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Show Hints"
                >
                  <Lightbulb className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hints Panel */}
      {showHints && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                Hints
              </h3>
              <button
                onClick={() => setShowHints(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="bg-slate-900/50 rounded p-3 border border-slate-700">
                <strong className="text-blue-400">Hint 1:</strong> Consider using a hash map to store values and their indices as you iterate through the array.
              </div>
              <div className="bg-slate-900/50 rounded p-3 border border-slate-700">
                <strong className="text-blue-400">Hint 2:</strong> For each element, check if the complement (target - current element) exists in your hash map.
              </div>
              <div className="bg-slate-900/50 rounded p-3 border border-slate-700">
                <strong className="text-blue-400">Hint 3:</strong> This problem can be solved in O(n) time complexity with O(n) space complexity.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <span>Lines: {code.split('\n').length}</span>
            <span>Characters: {code.length}</span>
            <span>Language: {languages.find(l => l.id === selectedLanguage)?.name}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Font: {fontSize}px</span>
            <span>Theme: {themes.find(t => t.id === theme)?.name}</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-colors disabled:opacity-50"
        >
          {isRunning ? (
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Loading Overlay */}
      {(isRunning || isSubmitting) && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full"></div>
              <span className="text-white font-medium">
                {isRunning ? 'Running test cases...' : 'Submitting solution...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingInterface;