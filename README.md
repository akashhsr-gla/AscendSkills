# Ascend Skills - AI-Powered Placement Platform

A comprehensive AI-powered interview simulator and skill assessment platform designed to help students prepare for their dream jobs with confidence.

## 🚀 Features Implemented

### ✅ AI-Powered Interview System
- **Speech-to-Text Transcription**: Real-time audio transcription using OpenAI Whisper
- **AI Follow-up Questions**: Dynamic question generation based on responses using GPT-3.5
- **Comprehensive AI Assessment**: Detailed feedback and scoring using advanced AI models
- **Real-time Face Detection**: Security monitoring using Google Cloud Vision API
- **Audio/Video Response Storage**: Complete interview session recording and storage

### ✅ Advanced Security Features
- **Screenshot Prevention**: Blocks all common screenshot shortcuts and methods
- **Developer Tools Blocking**: Prevents access to browser developer tools
- **Tab Switch Detection**: Monitors and logs tab switching and window focus changes
- **Keyboard Shortcut Blocking**: Prevents copy/paste and other potentially harmful shortcuts
- **Camera Validation**: Ensures only legitimate cameras are used (blocks virtual cameras)
- **Real-time Monitoring**: Continuous face detection and object detection during interviews
- **Right-click Prevention**: Blocks context menus and text selection

### ✅ Backend Implementation
- **RESTful API Endpoints**: Complete set of interview-related endpoints
- **MongoDB Integration**: Secure data storage with proper schemas
- **JWT Authentication**: Secure user authentication system
- **File Upload Handling**: Audio and image processing with validation
- **AI Service Integration**: OpenAI and Google Cloud APIs properly integrated
- **Error Handling**: Comprehensive error handling and logging

### ✅ Frontend Implementation
- **Modern UI/UX**: Beautiful, responsive design with animations
- **Real-time Recording**: Audio and video recording with visual feedback
- **AI Processing Indicators**: Clear feedback during AI processing
- **Security Status Display**: Real-time security monitoring display
- **Interview Flow Management**: Smooth question navigation and response handling
- **Mobile Responsive**: Works across all device types

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **OpenAI API** (Whisper & GPT-3.5)
- **Google Cloud Vision API**
- **JWT** for authentication
- **Multer** for file uploads
- **FFmpeg** for audio processing

### Frontend
- **Next.js 14** with TypeScript
- **React** with modern hooks
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide Icons** for UI elements
- **MediaRecorder API** for recording

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- OpenAI API Key
- Google Cloud Vision API credentials

### Backend Setup
1. Navigate to the BackEnd directory:
   ```bash
   cd BackEnd
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with required variables:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/ascend_skills
   JWT_SECRET=your_secure_jwt_secret_here
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_APPLICATION_CREDENTIALS=./path-to-service-account.json
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   ```

4. Populate the database with default questions:
   ```bash
   node scripts/populateQuestions.js
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the project root and install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 API Endpoints

### Interview Endpoints
- `POST /api/interview/ai/start` - Start a new AI interview session
- `POST /api/interview/ai/:interviewId/submit/:questionIndex` - Submit response with audio/image
- `POST /api/interview/ai/:interviewId/assessment` - Generate final AI assessment
- `POST /api/interview/ai/:interviewId/monitor` - Real-time face monitoring
- `POST /api/interview/ai/validate-camera` - Validate camera setup
- `GET /api/interview/ai/questions` - Get available interview questions
- `GET /api/interview/ai/:interviewId/report` - Get comprehensive interview report

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

## 🔒 Security Features

### Client-Side Security
- **Screenshot Prevention**: Blocks PrintScreen, Cmd+Shift+S, and other screenshot shortcuts
- **Developer Tools Blocking**: Prevents F12, Ctrl+Shift+I, and inspector access
- **Context Menu Disabled**: Right-click functionality blocked
- **Text Selection Prevention**: Prevents text selection and copying
- **Tab Switch Detection**: Monitors and logs when users switch tabs or windows
- **Console Protection**: Clears console and shows warnings

### Server-Side Security
- **Face Detection**: Real-time monitoring for multiple faces or unauthorized persons
- **Object Detection**: Identifies prohibited items (phones, notes, additional screens)
- **Camera Validation**: Ensures only legitimate hardware cameras are used
- **File Validation**: Secure audio/image upload with type and size validation
- **Rate Limiting**: Prevents API abuse and ensures fair usage

## 🧪 Testing

### Backend Testing
Test all endpoints:
```bash
cd BackEnd
node test_endpoints.js
```

### Frontend Testing
Navigate to the interview page and test:
1. Camera and microphone permissions
2. Security features (try screenshots, developer tools)
3. Recording functionality
4. AI transcription and follow-up questions
5. Final assessment generation

## 🎯 Key Features Completed

### ✅ Speech-to-Text Implementation
- OpenAI Whisper integration for high-accuracy transcription
- Support for multiple audio formats (WebM, MP3, WAV)
- Real-time processing with confidence scoring

### ✅ AI Follow-up Questions
- Dynamic question generation based on user responses
- Context-aware questions using GPT-3.5
- Personalized interview flow

### ✅ AI Assessment & Feedback
- Comprehensive evaluation of responses
- Detailed scoring across multiple criteria
- Actionable feedback for improvement

### ✅ Security & Proctoring
- Real-time face detection and counting
- Object detection for prohibited items
- Screenshot and screen recording prevention
- Tab switching and window focus monitoring

### ✅ Camera Validation
- Hardware camera validation
- Virtual camera detection and blocking
- Camera permissions and accessibility checks

### ✅ Audio/Video Storage
- Secure file upload and storage
- MongoDB integration for response metadata
- Efficient file processing and cleanup

## 🚀 Future Enhancements

- **Video Analysis**: Enhanced video-based behavioral analysis
- **Multi-language Support**: Support for multiple interview languages
- **Advanced Analytics**: Detailed performance analytics and trends
- **Integration APIs**: Third-party recruitment platform integrations
- **Mobile App**: Native mobile application for interviews

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ by the Ascend Skills Team**
