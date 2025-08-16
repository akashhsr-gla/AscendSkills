const OpenAI = require('openai');
const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Initialize Google Vision client
const visionClient = process.env.GOOGLE_APPLICATION_CREDENTIALS ? new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
}) : null;

class AIServices {
  constructor() {
    // Skip validation on construction to allow server to start
    // this.validateConfiguration();
  }
  
  isConfigured() {
    return openai && visionClient;
  }

  validateConfiguration() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('WARNING: OPENAI_API_KEY not found in environment variables');
    }
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.warn('WARNING: GOOGLE_APPLICATION_CREDENTIALS not found in environment variables');
    }
  }

  // ==================== SPEECH TO TEXT (OpenAI Whisper) ====================
  
  async transcribeAudio(audioPath) {
    try {
      if (!fs.existsSync(audioPath)) {
        throw new Error('Audio file not found');
      }

      console.log(`Transcribing audio file: ${audioPath}`);
      
      // Check file size
      const stats = fs.statSync(audioPath);
      console.log(`Audio file size: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        throw new Error('Audio file is empty');
      }
      
      // Check if OpenAI is configured
      if (!openai) {
        throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.');
      }
      
      // Validate file format and convert if needed
      const fileExtension = path.extname(audioPath).toLowerCase();
      const supportedFormats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg', '.oga', '.flac'];
      
      let finalAudioPath = audioPath;
      
      // If no extension or unsupported format, try to convert to mp3
      if (!fileExtension || !supportedFormats.includes(fileExtension)) {
        console.log('⚠️ No file extension or unsupported format detected, trying original file...');
        // Temporarily disabled ffmpeg conversion to avoid startup issues
        // In production, you would want to enable this with proper error handling
      }
      
      // Create a readable stream from the audio file
      const audioFile = fs.createReadStream(finalAudioPath);
      
      // Use OpenAI Whisper for transcription
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: process.env.WHISPER_MODEL || 'whisper-1',
        language: 'en',
        response_format: 'verbose_json',
        temperature: 0.2,
      });

      const duration = await this.getAudioDuration(audioPath);

      return {
        transcription: transcription.text,
        confidence: this.calculateTranscriptionConfidence(transcription.text, transcription.segments || []),
        duration: duration,
        language: transcription.language || 'en',
        segments: transcription.segments || [],
        words: transcription.words || []
      };

    } catch (error) {
      console.error('Transcription error:', error);
      
      // Try fallback transcription method
      try {
        console.log('🔄 Attempting fallback transcription...');
        return await this.fallbackTranscription(audioPath);
      } catch (fallbackError) {
        console.error('Fallback transcription also failed:', fallbackError);
        
        // Provide more specific error messages
        if (error.message.includes('400 Unrecognized file format')) {
          throw new Error('Audio file format not supported. Please ensure the recording is in a supported format (MP3, WAV, M4A, etc.).');
        } else if (error.message.includes('413')) {
          throw new Error('Audio file is too large. Please record a shorter response.');
        } else if (error.message.includes('401')) {
          throw new Error('OpenAI API key is invalid or expired. Please check your configuration.');
        } else {
          throw new Error(`OpenAI transcription failed: ${error.message}`);
        }
      }
    }
  }

  calculateTranscriptionConfidence(text, segments) {
    if (segments && segments.length > 0) {
      // Use actual confidence from Whisper segments
      const avgConfidence = segments.reduce((sum, seg) => sum + (seg.avg_logprob || 0), 0) / segments.length;
      return Math.max(0.5, Math.min(1.0, Math.exp(avgConfidence)));
    }
    
    // Fallback confidence calculation
    const words = text.split(' ').filter(word => word.length > 0);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const hasFillerWords = ['um', 'uh', 'like', 'you know'].some(filler => 
      text.toLowerCase().includes(filler)
    );
    
    let confidence = 0.9;
    if (avgWordLength < 3) confidence -= 0.1;
    if (hasFillerWords) confidence -= 0.05;
    if (words.length < 10) confidence -= 0.1;
    
    return Math.max(0.5, Math.min(1.0, confidence));
  }

  async getAudioDuration(audioPath) {
    try {
      // Temporarily return default duration to avoid ffmpeg issues
      // In production, you would use ffmpeg to get actual duration
      return 120; // Default duration
    } catch (error) {
      return 120; // Default duration
    }
  }

  // ==================== AI FOLLOW-UP QUESTIONS (OpenAI GPT-3.5) ====================

  async generateFollowUpQuestions(userResponse, originalQuestion, questionType = 'behavioral') {
    try {
      // Check if OpenAI is configured
      if (!openai) {
        throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.');
      }
      
      const prompt = this.buildFollowUpPrompt(userResponse, originalQuestion, questionType);
      
      const completion = await openai.chat.completions.create({
        model: process.env.GPT_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional interview coach. Generate exactly 3 short, insightful follow-up questions based on the candidate\'s response. Keep questions concise and relevant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content;
      
      // Parse the response to extract individual questions
      const questions = this.parseFollowUpQuestions(response);

      return {
        questions: questions,
        reasoning: `Generated based on ${questionType} question analysis`,
        confidence: 0.9
      };

    } catch (error) {
      console.error('Follow-up generation error:', error);
      throw new Error(`Failed to generate follow-up questions: ${error.message}`);
    }
  }

  buildFollowUpPrompt(userResponse, originalQuestion, questionType) {
    return `Original Interview Question (${questionType}): "${originalQuestion}"

Candidate's Response: "${userResponse}"

Generate exactly 3 short follow-up questions (each under 15 words) that:
1. Dig deeper into their response
2. Clarify any vague points
3. Explore specific examples or details they mentioned

Format: Return only the 3 questions, numbered 1-3, one per line.`;
  }

  parseFollowUpQuestions(response) {
    const lines = response.split('\n').filter(line => line.trim());
    const questions = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Remove numbering and extract question
      const cleaned = trimmed.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim();
      if (cleaned.length > 0 && cleaned.includes('?')) {
        questions.push(cleaned);
      }
    }
    
    // Ensure we have exactly 3 questions
    while (questions.length < 3) {
      questions.push("Can you elaborate more on that point?");
    }
    
    return questions.slice(0, 3);
  }

  // Fallback analysis functions removed - OpenAI required

  async analyzeResponse(transcription, question, questionType) {
    try {
      // Check if OpenAI is configured
      if (!openai) {
        throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.');
      }
      
      const prompt = this.buildEnhancedResponseAnalysisPrompt(transcription, question, questionType);
      
      const completion = await openai.chat.completions.create({
        model: process.env.GPT_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach with deep knowledge of technical and behavioral interviews. Provide detailed, actionable feedback with specific scores and improvement suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      
      // Parse the structured response
      const parsedResponse = this.parseStructuredAnalysis(response);
      
      return {
        analysis: parsedResponse.analysis,
        confidence: parsedResponse.confidence,
        suggestions: parsedResponse.suggestions,
        scores: parsedResponse.scores,
        keywords: this.extractKeywords(transcription),
        responseMetrics: this.calculateResponseMetrics(transcription, questionType)
      };

    } catch (error) {
      console.error('Response analysis error:', error);
      throw new Error(`Failed to analyze response: ${error.message}`);
    }
  }

  buildEnhancedResponseAnalysisPrompt(transcription, question, questionType) {
    return `Question Type: ${questionType}
Original Question: "${question}"
Candidate Response: "${transcription}"

Please provide a comprehensive analysis in the following JSON format:
{
  "analysis": "Detailed analysis of the response quality, structure, and content",
  "confidence": <number 0-1>,
  "scores": {
  "clarity": <number 0-100>,
    "relevance": <number 0-100>,
    "depth": <number 0-100>,
    "structure": <number 0-100>
  },
  "suggestions": ["Specific improvement suggestion 1", "Specific improvement suggestion 2", "Specific improvement suggestion 3"]
}

Focus on:
- Response clarity and articulation
- Relevance to the question
- Depth of technical knowledge (for technical questions)
- Use of specific examples and STAR method (for behavioral questions)
- Structure and organization of the response
- Actionable improvement suggestions`;
  }

  parseStructuredAnalysis(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          analysis: parsed.analysis || response,
          confidence: parsed.confidence || 0.8,
          suggestions: parsed.suggestions || this.extractSuggestions(response),
          scores: parsed.scores || { clarity: 0, relevance: 0, depth: 0, structure: 0 }
        };
      }
    } catch (error) {
      console.error('Failed to parse structured analysis:', error);
    }
    
    // No fallback - throw error if parsing fails
    throw new Error('Failed to parse AI response. Please ensure OpenAI is properly configured.');
  }

  extractKeywords(transcription) {
    const commonKeywords = {
      technical: ['api', 'database', 'algorithm', 'optimization', 'scalability', 'performance', 'testing', 'deployment'],
      behavioral: ['team', 'leadership', 'communication', 'problem', 'solution', 'result', 'impact', 'collaboration']
    };
    
    const words = transcription.toLowerCase().split(' ');
    const keywords = [];
    
    // Extract technical keywords
    commonKeywords.technical.forEach(keyword => {
      if (words.some(word => word.includes(keyword))) {
        keywords.push(keyword);
      }
    });
    
    // Extract behavioral keywords
    commonKeywords.behavioral.forEach(keyword => {
      if (words.some(word => word.includes(keyword))) {
        keywords.push(keyword);
      }
    });
    
    return keywords;
  }

  calculateResponseMetrics(transcription, questionType) {
    const wordCount = transcription.split(' ').length;
    const sentenceCount = transcription.split(/[.!?]+/).length - 1;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const hasNumbers = /\d+/.test(transcription);
    const hasTechnicalTerms = /api|database|algorithm|optimization|scalability|performance|testing|deployment/i.test(transcription);
    const hasBehavioralTerms = /team|leadership|communication|problem|solution|result|impact|collaboration/i.test(transcription);
    
    return {
      wordCount,
      sentenceCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      hasNumbers,
      hasTechnicalTerms,
      hasBehavioralTerms,
      complexity: this.calculateComplexity(transcription),
      relevance: this.calculateRelevance(transcription, questionType)
    };
  }

  calculateComplexity(transcription) {
    const words = transcription.split(' ');
    const longWords = words.filter(word => word.length > 6).length;
    return Math.round((longWords / words.length) * 100);
  }

  calculateRelevance(transcription, questionType) {
    const technicalTerms = ['api', 'database', 'algorithm', 'optimization', 'scalability', 'performance', 'testing', 'deployment'];
    const behavioralTerms = ['team', 'leadership', 'communication', 'problem', 'solution', 'result', 'impact', 'collaboration'];
    
    const words = transcription.toLowerCase().split(' ');
    let relevantTerms = 0;
    
    if (questionType === 'technical') {
      relevantTerms = technicalTerms.filter(term => words.some(word => word.includes(term))).length;
    } else {
      relevantTerms = behavioralTerms.filter(term => words.some(word => word.includes(term))).length;
    }
    
    return Math.min(100, (relevantTerms / 3) * 100);
  }

  extractSuggestions(analysis) {
    // Enhanced extraction of suggestions from analysis text
    const suggestions = [];
    const lines = analysis.split('.');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.toLowerCase().includes('consider') || 
          trimmedLine.toLowerCase().includes('add') || 
          trimmedLine.toLowerCase().includes('include') ||
          trimmedLine.toLowerCase().includes('provide') ||
          trimmedLine.toLowerCase().includes('use') ||
          trimmedLine.toLowerCase().includes('practice')) {
        suggestions.push(trimmedLine);
      }
    }
    
    return suggestions.length > 0 ? suggestions : ["Continue practicing and refining your responses"];
  }

  // ==================== AI ASSESSMENT (OpenAI GPT-4) ====================

  async generateInterviewAssessment(interviewData) {
    try {
      // Check if OpenAI is configured
      if (!openai) {
        throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.');
      }
      
      const prompt = this.buildAssessmentPrompt(interviewData);
      
      const completion = await openai.chat.completions.create({
        model: process.env.GPT_MODEL || 'gpt-3.5-turbo', // Use available model
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview assessor. Analyze the complete interview and provide detailed feedback with scores out of 100.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      
      // Parse the structured response
      const assessment = this.parseAssessmentResponse(response);
      
      return assessment;

    } catch (error) {
      console.error('Assessment generation error:', error);
      throw new Error(`Failed to generate interview assessment: ${error.message}`);
    }
  }

  buildAssessmentPrompt(interviewData) {
    const { questions, responses, type, duration } = interviewData;
    
    let responseText = '';
    let individualAnalysisText = '';
    
    questions.forEach((question, index) => {
      const response = responses[index] || {};
      const questionData = question;
      
      responseText += `Q${index + 1}: ${questionData.question}\n`;
      responseText += `Type: ${questionData.type}\n`;
      responseText += `A${index + 1}: ${response.transcription || 'No response provided'}\n`;
      
      // Include individual AI assessment if available
      if (response.individualScores) {
        individualAnalysisText += `\nQuestion ${index + 1} AI Analysis:\n`;
        individualAnalysisText += `- Communication: ${response.individualScores.communication || 0}/100\n`;
        individualAnalysisText += `- Technical: ${response.individualScores.technical || 0}/100\n`;
        individualAnalysisText += `- Problem Solving: ${response.individualScores.problemSolving || 0}/100\n`;
        individualAnalysisText += `- Confidence: ${response.individualScores.confidence || 0}/100\n`;
      }
      
      responseText += '\n';
    });

    return `Interview Type: ${type}
Duration: ${duration} seconds
Total Questions: ${questions.length}

Questions and Responses:
${responseText}

${individualAnalysisText ? `Individual Question AI Assessments:${individualAnalysisText}\n` : ''}

Please provide a comprehensive final assessment that considers:

1. **Response Quality Analysis:**
   - Clarity and articulation of responses
   - Depth of technical knowledge demonstrated
   - Use of specific examples and STAR method
   - Consistency across all questions

2. **Question Type Performance:**
   - Behavioral question responses (leadership, teamwork, problem-solving)
   - Technical question responses (knowledge depth, problem-solving approach)
   - Communication effectiveness across different question types

3. **Overall Interview Performance:**
   - Response consistency and coherence
   - Time management and response completeness
   - Confidence and presentation skills
   - Adaptability to different question types

4. **Improvement Areas:**
   - Specific weaknesses identified
   - Areas for skill development
   - Communication enhancement opportunities

Please provide the assessment in the following JSON format:
{
  "overallScore": <number 0-100>,
  "breakdown": {
    "communication": <number 0-100>,
    "technical": <number 0-100>,
    "problemSolving": <number 0-100>,
    "confidence": <number 0-100>
  },
  "strengths": [<array of 3-5 specific strength points with examples>],
  "improvements": [<array of 3-5 specific improvement areas with actionable suggestions>],
  "recommendations": [<array of 3-5 specific recommendations for future interviews>],
  "feedback": "<detailed paragraph feedback covering overall performance, specific examples from responses, and next steps>",
  "questionTypeAnalysis": {
    "behavioral": "<analysis of behavioral question performance>",
    "technical": "<analysis of technical question performance>"
  }
}

IMPORTANT: 
- Provide realistic scores based on actual response quality, not length
- Consider individual question AI assessments if available
- Give specific examples from the candidate's responses
- Focus on actionable feedback and improvement suggestions
- Consider the interview type and question difficulty in scoring`;
  }

  parseAssessmentResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse assessment JSON:', error);
    }
    
    // No fallback - throw error if parsing fails
    throw new Error('Failed to parse assessment response. Please ensure OpenAI is properly configured.');
  }

  // Fallback assessment functions removed - OpenAI required

  // ==================== FACE DETECTION (Google Vision API) ====================

  async detectFacesInImage(imagePath) {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error('Image file not found');
      }

      // Check if Google Vision is configured
      if (!visionClient) {
        console.log('⚠️ Google Vision not configured, using fallback face detection');
      return {
        faceCount: 1,
          faces: [{
            confidence: 0.95,
            boundingBox: null,
            landmarks: [],
            emotions: { joy: 'POSSIBLE', sorrow: 'UNLIKELY', anger: 'UNLIKELY', surprise: 'UNLIKELY' },
            headwear: 'UNLIKELY',
            blurred: 'UNLIKELY',
            underExposed: 'UNLIKELY'
          }],
        violations: [],
          timestamp: new Date().toISOString(),
          fallback: true
        };
      }

      // Read the image file
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Perform face detection
      const [result] = await visionClient.faceDetection({
        image: { content: imageBuffer }
      });
      
      const faces = result.faceAnnotations || [];
      
      // Analyze the results
      const analysis = {
        faceCount: faces.length,
        faces: faces.map(face => ({
          confidence: face.detectionConfidence,
          boundingBox: face.boundingPoly,
          landmarks: face.landmarks,
          emotions: {
            joy: face.joyLikelihood,
            sorrow: face.sorrowLikelihood,
            anger: face.angerLikelihood,
            surprise: face.surpriseLikelihood
          },
          headwear: face.headwearLikelihood,
          blurred: face.blurredLikelihood,
          underExposed: face.underExposedLikelihood
        })),
        violations: this.detectFaceViolations(faces),
        timestamp: new Date().toISOString()
      };

      return analysis;

    } catch (error) {
      console.error('Face detection error:', error);
      
      if (error.code === 7 && error.details.includes('quota')) {
        throw new Error('Google Vision API quota exceeded. Please check your billing.');
      }
      
      // Fallback to mock detection
      return {
        faceCount: 1,
        faces: [{
          confidence: 0.95,
          boundingBox: null,
          landmarks: [],
          emotions: { joy: 'POSSIBLE', sorrow: 'UNLIKELY', anger: 'UNLIKELY', surprise: 'UNLIKELY' },
          headwear: 'UNLIKELY',
          blurred: 'UNLIKELY',
          underExposed: 'UNLIKELY'
        }],
        violations: [],
        timestamp: new Date().toISOString(),
        fallback: true
      };
    }
  }

  detectFaceViolations(faces) {
    const violations = [];
    
    // Check for multiple faces
    if (faces.length > 1) {
      violations.push({
        type: 'multiple_faces',
        severity: 'high',
        description: `${faces.length} faces detected - only one person allowed`,
        confidence: 0.95,
        action: 'pause_interview'
      });
    }
    
    // Check for no faces
    if (faces.length === 0) {
      violations.push({
        type: 'no_face_detected',
        severity: 'medium',
        description: 'No face detected in the frame',
        confidence: 0.90,
        action: 'warning'
      });
    }
    
    // Check each face for issues
    faces.forEach((face, index) => {
      // Low confidence detection
      if (face.detectionConfidence < 0.7) {
        violations.push({
          type: 'low_face_confidence',
          severity: 'low',
          description: 'Face detection confidence is low - improve lighting',
          confidence: face.detectionConfidence,
          action: 'warning'
        });
      }
      
      // Blurred face
      if (face.blurredLikelihood === 'LIKELY' || face.blurredLikelihood === 'VERY_LIKELY') {
        violations.push({
          type: 'blurred_face',
          severity: 'medium',
          description: 'Face appears blurred - check camera focus',
          confidence: 0.8,
          action: 'warning'
        });
      }
      
      // Under-exposed
      if (face.underExposedLikelihood === 'LIKELY' || face.underExposedLikelihood === 'VERY_LIKELY') {
        violations.push({
          type: 'poor_lighting',
          severity: 'low',
          description: 'Poor lighting detected - improve illumination',
          confidence: 0.8,
          action: 'warning'
        });
      }
      
      // Headwear detection
      if (face.headwearLikelihood === 'LIKELY' || face.headwearLikelihood === 'VERY_LIKELY') {
        violations.push({
          type: 'headwear_detected',
          severity: 'medium',
          description: 'Headwear detected - please remove hats/caps',
          confidence: 0.85,
          action: 'warning'
        });
      }
    });
    
    return violations;
  }

  // ==================== OBJECT DETECTION (Google Vision API) ====================

  async detectObjectsInImage(imagePath) {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error('Image file not found');
      }

      // Check if Google Vision is configured
      if (!visionClient) {
        console.log('⚠️ Google Vision not configured, using fallback object detection');
      return {
          objects: [],
          textDetected: false,
          textContent: null,
          violations: [],
          timestamp: new Date().toISOString(),
          fallback: true
        };
      }

      const imageBuffer = fs.readFileSync(imagePath);
      
      // Perform object detection
      const [result] = await visionClient.objectLocalization({
        image: { content: imageBuffer }
      });
      
      const objects = result.localizedObjectAnnotations || [];
      
      // Also detect text (for screenshots, books, etc.)
      const [textResult] = await visionClient.textDetection({
        image: { content: imageBuffer }
      });
      
      const textDetections = textResult.textAnnotations || [];
      
      const analysis = {
        objects: objects.map(obj => ({
          name: obj.name,
          confidence: obj.score,
          boundingBox: obj.boundingPoly
        })),
        textDetected: textDetections.length > 0,
        textContent: textDetections.length > 0 ? textDetections[0].description : null,
        violations: this.detectObjectViolations(objects, textDetections),
        timestamp: new Date().toISOString()
      };
      
      return analysis;

    } catch (error) {
      console.error('Object detection error:', error);
      
      // Fallback to mock detection
      return {
        objects: [],
        textDetected: false,
        textContent: null,
        violations: [],
        timestamp: new Date().toISOString(),
        fallback: true
      };
    }
  }

  detectObjectViolations(objects, textDetections) {
    const violations = [];
    
    // Prohibited objects
    const prohibitedObjects = [
      'mobile phone', 'laptop', 'computer', 'tablet', 'book', 
      'paper', 'notebook', 'document', 'screen', 'monitor'
    ];
    
    objects.forEach(obj => {
      const objName = obj.name.toLowerCase();
      if (prohibitedObjects.some(prohibited => objName.includes(prohibited))) {
      violations.push({
          type: 'prohibited_object',
          severity: 'high',
          description: `${obj.name} detected - remove unauthorized items`,
          confidence: obj.score,
          action: 'pause_interview',
          object: obj.name
        });
      }
    });
    
    // Text detection (potential cheating material)
    if (textDetections.length > 0) {
      const textLength = textDetections[0].description.length;
      if (textLength > 50) { // Substantial text content
      violations.push({
          type: 'text_material_detected',
          severity: 'high',
          description: 'Text material detected - remove notes/books',
        confidence: 0.9,
          action: 'pause_interview',
          textLength: textLength
      });
      }
    }
    
    return violations;
  }

  // ==================== CAMERA VALIDATION ====================

  async validateCameraSetup(videoDevices) {
    const violations = [];
    
    // Check for virtual cameras
    const virtualCameraIndicators = [
      'obs', 'virtual', 'manycam', 'xsplit', 'snap camera', 
      'nvidia broadcast', 'zoom'
    ];
    
    videoDevices.forEach(device => {
      const deviceName = device.label.toLowerCase();
      if (virtualCameraIndicators.some(indicator => deviceName.includes(indicator))) {
        violations.push({
          type: 'virtual_camera_detected',
          severity: 'high',
          description: `Virtual camera detected: ${device.label}`,
          confidence: 0.95,
          action: 'block_interview',
          deviceId: device.deviceId
        });
      }
    });
    
    // Check for multiple cameras
    if (videoDevices.length > 2) {
      violations.push({
        type: 'multiple_cameras',
        severity: 'medium',
        description: `${videoDevices.length} cameras detected - use built-in camera only`,
        confidence: 0.9,
        action: 'warning'
      });
    }
    
    return {
      isValid: violations.filter(v => v.severity === 'high').length === 0,
      violations: violations,
      recommendedDevice: this.getRecommendedCamera(videoDevices),
      timestamp: new Date().toISOString()
    };
  }

  getRecommendedCamera(devices) {
    // Prefer built-in cameras
    const builtInIndicators = ['integrated', 'built-in', 'facetime', 'internal'];
    
    for (const device of devices) {
      const deviceName = device.label.toLowerCase();
      if (builtInIndicators.some(indicator => deviceName.includes(indicator))) {
        return device;
      }
    }
    
    // Fallback to first device
    return devices[0] || null;
  }

  // ==================== UTILITY METHODS ====================

  async processInterviewResponse(audioPath, imagePath = null) {
    const results = {};
    
    try {
      // Process audio
      if (audioPath && fs.existsSync(audioPath)) {
        console.log('Processing audio transcription...');
        results.transcription = await this.transcribeAudio(audioPath);
      }
      
      // Process image for face detection
      if (imagePath && fs.existsSync(imagePath)) {
        console.log('Processing face detection...');
        results.faceDetection = await this.detectFacesInImage(imagePath);
        results.objectDetection = await this.detectObjectsInImage(imagePath);
      }
      
      return results;
      
    } catch (error) {
      console.error('Error processing interview response:', error);
      throw error;
    }
  }

  // Clean up temporary files
  cleanupTempFiles(filePaths) {
    filePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up temp file: ${filePath}`);
        } catch (error) {
          console.error(`Failed to cleanup file ${filePath}:`, error);
        }
      }
    });
  }

  // ==================== TEXT-TO-SPEECH ====================

  async generateSpeech(text, voice = 'nova') {
    try {
      // Check if OpenAI is configured
      if (!openai) {
        console.log('⚠️ OpenAI not configured, using fallback TTS');
        return this.generateFallbackSpeech(text);
      }

      console.log('🔊 Generating speech with OpenAI TTS:', { text: text.substring(0, 50) + '...', voice });

      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
        response_format: 'mp3'
      });

      if (!response.body) {
        throw new Error('No audio data received from OpenAI');
      }

      // Convert response to buffer
      const buffer = Buffer.from(await response.arrayBuffer());
      
      console.log('✅ Speech generated successfully, size:', buffer.length);
      
      return {
        audioBuffer: buffer,
        contentType: 'audio/mpeg',
        size: buffer.length
      };

    } catch (error) {
      console.error('TTS generation error:', error);
      return this.generateFallbackSpeech(text);
    }
  }

  generateFallbackSpeech(text) {
    // Generate a simple fallback audio (silent MP3)
    console.log('🔄 Generating fallback speech for:', text.substring(0, 50) + '...');
    
    // Create a minimal MP3 buffer (silent audio)
    const silentMp3Buffer = Buffer.from([
      0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    return {
      audioBuffer: silentMp3Buffer,
      contentType: 'audio/mpeg',
      size: silentMp3Buffer.length,
      fallback: true
    };
  }
}

// Export singleton instance
module.exports = new AIServices(); 