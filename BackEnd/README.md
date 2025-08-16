# AI-Powered Interview System - Backend

A comprehensive Node.js backend for an AI-powered interview platform with speech-to-text, face detection, and automated assessment capabilities.

## Features

### 🤖 AI-Powered Capabilities
- **Speech-to-Text**: OpenAI Whisper integration for accurate transcription
- **Follow-up Questions**: GPT-3.5 generates intelligent follow-up questions
- **Face Detection**: Google Vision API for interview security
- **Object Detection**: Prevents cheating by detecting unauthorized items
- **Comprehensive Assessment**: AI-generated feedback and scoring

### 🔒 Security Features
- Real-time face monitoring
- Multiple face detection prevention
- Virtual camera blocking
- Object detection for unauthorized materials
- Screenshot and recording prevention alerts

### 📊 Assessment & Analytics
- Automated scoring based on multiple criteria
- Speech analysis (WPM, clarity, confidence)
- Behavioral analysis
- Technical knowledge assessment
- Detailed reporting with AI insights

## Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **MongoDB** (v5.0 or higher)
- **FFmpeg** (for audio processing)

### API Keys Required

1. **OpenAI API Key**
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Generate API key from dashboard
   - Ensure you have credits/billing set up

2. **Google Cloud Vision API**
   - Create project at [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Vision API
   - Create service account and download JSON key
   - Place the JSON file in the BackEnd directory

## Installation

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd ascend-skills/BackEnd
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the BackEnd directory:

```env
# Environment Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/ascend_skills

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRES_IN=24h

# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=./certain-armor-450719-d3-62dd25c90552.json
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id

# Interview Configuration
MAX_INTERVIEW_DURATION=3600
MAX_FILE_SIZE=50MB
ALLOWED_AUDIO_FORMATS=mp3,wav,webm,m4a
ALLOWED_VIDEO_FORMATS=mp4,webm,mov
ALLOWED_IMAGE_FORMATS=jpg,jpeg,png,webp

# Security Configuration
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000

# File Storage Configuration
UPLOAD_PATH=uploads
TEMP_PATH=temp
MAX_UPLOAD_SIZE=52428800

# AI Processing Configuration
WHISPER_MODEL=whisper-1
GPT_MODEL=gpt-3.5-turbo
VISION_API_ENDPOINT=https://vision.googleapis.com/v1/images:annotate

# Monitoring Configuration
ENABLE_FACE_DETECTION=true
ENABLE_OBJECT_DETECTION=true
ENABLE_EMOTION_ANALYSIS=true
ENABLE_SPEECH_ANALYSIS=true
VIOLATION_THRESHOLD=3
MONITORING_INTERVAL=5000
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:

**macOS (with Homebrew):**
```bash
brew services start mongodb-community
```

**Windows:**
```bash
net start MongoDB
```

**Linux (Ubuntu/Debian):**
```bash
sudo systemctl start mongod
```

### 5. Populate Database
Run the script to add default interview questions:
```bash
node scripts/populateQuestions.js
```

### 6. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### AI-Powered Interview Endpoints

#### Start AI Interview
```http
POST /api/interview/ai/start
Authorization: Bearer <token>

{
  "type": "behavioral",          # behavioral, technical, mixed
  "difficulty": "medium",        # easy, medium, hard, mixed  
  "questionCount": 5
}
```

#### Submit Response with AI Processing
```http
POST /api/interview/ai/:interviewId/submit/:questionIndex
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "audio": <audio-file>,         # MP3, WAV, WebM
  "image": <image-file>,         # JPG, PNG for face detection
  "textResponse": "Optional text response"
}
```

#### Generate AI Assessment
```http
POST /api/interview/ai/:interviewId/assessment
Authorization: Bearer <token>
```

#### Real-time Face Monitoring
```http
POST /api/interview/ai/:interviewId/monitor
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "image": <image-file>
}
```

#### Validate Camera Setup
```http
POST /api/interview/ai/validate-camera
Authorization: Bearer <token>

{
  "videoDevices": [
    {
      "deviceId": "default",
      "label": "Built-in Camera"
    }
  ]
}
```

#### Get AI Interview Questions
```http
GET /api/interview/ai/questions?type=behavioral&difficulty=medium&count=5
Authorization: Bearer <token>
```

#### Get AI Interview Report
```http
GET /api/interview/ai/:interviewId/report
Authorization: Bearer <token>
```

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login
```http
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

## Testing

### Manual Testing
1. Start the server: `npm run dev`
2. Use Postman or curl to test endpoints
3. Check MongoDB for data persistence

### Run Test Suite
```bash
npm test
```

### Test AI Integration
```bash
# Test OpenAI integration
curl -X POST http://localhost:5000/api/interview/ai/questions \
  -H "Authorization: Bearer <your-token>"

# Test face detection (requires image file)
curl -X POST http://localhost:5000/api/interview/ai/validate-camera \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"videoDevices": [{"deviceId": "default", "label": "Built-in Camera"}]}'
```

## File Structure

```
BackEnd/
├── controllers/
│   ├── interviewController.js    # AI interview logic
│   ├── authController.js         # Authentication
│   └── ...
├── models/
│   ├── Interview.js              # Interview schema
│   ├── Question.js               # Question schema
│   ├── User.js                   # User schema
│   └── ...
├── routes/
│   ├── interview.js              # Interview routes
│   ├── auth.js                   # Auth routes
│   └── ...
├── services/
│   └── aiServices.js             # AI integration services
├── middleware/
│   ├── auth.js                   # Authentication middleware
│   └── errorHandler.js           # Error handling
├── scripts/
│   └── populateQuestions.js      # Database seeding
├── uploads/                      # File uploads directory
├── .env                          # Environment variables
├── package.json                  # Dependencies
└── index.js                      # Server entry point
```

## Security Considerations

### API Security
- JWT authentication required for all protected routes
- Rate limiting implemented
- File upload validation
- CORS protection

### Interview Security
- Real-time face detection
- Multiple person detection
- Virtual camera blocking
- Object detection for cheating prevention
- Audio analysis for voice verification

### Data Privacy
- Temporary file cleanup
- Secure file storage
- Data encryption in transit
- Compliance with privacy regulations

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:27017
   ```
   **Solution**: Start MongoDB service

2. **OpenAI API Error**
   ```
   Error: insufficient_quota
   ```
   **Solution**: Check OpenAI billing and credits

3. **Google Vision API Error**
   ```
   Error: quota exceeded
   ```
   **Solution**: Check Google Cloud billing and quotas

4. **File Upload Error**
   ```
   Error: Invalid file type
   ```
   **Solution**: Ensure file types match allowed formats

### Debug Mode
Set environment variable for detailed logging:
```bash
DEBUG=interview:* npm run dev
```

### Health Check
```http
GET /api/health
```

## Performance Optimization

### File Handling
- Automatic temporary file cleanup
- Optimized audio processing
- Image compression for face detection

### Database
- Indexed queries for better performance
- Connection pooling
- Aggregation pipelines for analytics

### AI Processing
- Concurrent processing where possible
- Fallback mechanisms for API failures
- Caching for repeated requests

## Production Deployment

### Environment Variables
Ensure all production environment variables are set, especially:
- `NODE_ENV=production`
- Secure `JWT_SECRET`
- Valid API keys
- Production database URI

### Scaling Considerations
- Load balancing for multiple instances
- Redis for session management
- CDN for file serving
- Message queues for AI processing

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review API documentation

## Changelog

### v1.0.0
- Initial release with AI-powered interview functionality
- OpenAI Whisper integration
- Google Vision API integration
- Comprehensive assessment system
- Security monitoring features 