# Resume Feedback API

A **Node.js / Express + MongoDB** backend for uploading resumes, storing them in **AWS S3**, and generating **AI-powered feedback using Gemini**.  
AI feedback generation is handled **asynchronously via AWS SQS**, processed by a dedicated background worker.

---

## 🚀 Features

- JWT authentication with user & admin roles
- Resume upload & storage
  - AWS S3 with versioning enabled 
  - CloudFront public URLs
- Asynchronous AI-powered resume feedback
  - Google Gemini API
  - SQS-driven background worker
  - Retry-friendly architecture
- Resume comments
  - CRUD operations
  - Simple in-memory caching
- Security & reliability
  - Rate limiting
  - CORS allowlist
  - Centralized error handling
  - Request & error logging (Winston)

---

## 🧱 Architecture Overview
### High-Level Flow
1. User uploads a resume
2. Resume is stored in S3 and registered in MongoDB
3. A message { resumeId, extractedText } is sent to SQS
4. A background worker consumes the message
5. AI feedback is generated using Gemini
6. Resume document is updated with AI feedback
7. Other users can comment on the resume

### 📐 Sequence Diagram — Upload & AI Feedback (Async)
![Sequence Diagram](https://mbeuaportfolio-media.s3.us-east-2.amazonaws.com/SequenceDiagram-SQSWorkerArchitecture.jpg)

### Entry Points
- `src/index.ts`  
  Loads environment variables, connects to MongoDB, and starts the HTTP server.
- `src/server.ts`  
  Express application setup (middleware, CORS, routes).

### Routes
| Prefix | Description |
|------|-------------|
| `/api/auth/*` | Authentication & user management |
| `/api/resumes/*` | Resume upload, listing & details |
| `/api/comments/*` | Resume comments |
| `/api/admin/*` | Admin-only endpoints |

### Feature Structure
- **Auth**: `src/features/auth`
- **Resumes**: `src/features/resume`
  - Upload: `src/controllers/uploadController.ts`
  - Versioning: `src/controllers/versionController.ts`
- **Comments**: `src/features/comment`
- **Admin**: `src/features/admin`
- **AI Feedback**
  - Generator: `src/features/feedback/services/AIFeedbackGenerator.ts`
  - Worker: `src/features/feedback/workers/sqsWorker.ts`

### 🗄️Persistence
- MongoDB via Mongoose
- Core models:
  - `User`
  - `Resume`
  - `Comment`
  - `AIFeedback`
 
### Resume AI Fields   
- aiFeedback: string
- aiStatus: "pending" | "done" | "failed"
- aiError?: string
  
### Storage
- AWS S3 for resume files
- CloudFront for public file access
- S3 object version listing & restore support

### Logging & Errors
- Winston logger (`src/helpers/logger.ts`)
- `express-winston` middleware
- Centralized error helpers

---

## ⚙️ Getting Started

### Install Dependencies
```bash
npm install
```

Environment Variables

Create a .env file in the project root:
PORT=3000
MONGO_URI=your_mongo_connection_string
FEEDBACK_JWT_PRIVATE_KEY=your_jwt_secret

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_SQS_QUEUE_URL=your_sqs_queue_url

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL_ID=your_model_id

# Optional
CLOUDFRONT_URL=https://your-distribution.cloudfront.net


▶️ Running the Project
Start the API Server
```bash
npm run dev
# or
ts-node src/index.ts
```

Start the SQS Worker (separate process)
```bash
ts-node src/features/feedback/workers/sqsWorker.ts
```
Important: The worker must be running for AI feedback to be generated.

🧪 Tests
```bash
npm test
```

🔄 How It Works
Resume Upload Flow

* POST /api/resumes/upload
* User authentication via JWT
* File validation (type & size)
* Upload to S3
* Resume document saved in MongoDB
* PDF text extraction
* { resumeId, extractedText } enqueued to SQS

## AI Feedback Worker
* Long-polls AWS SQS
* Generates feedback via Gemini
* Updates:
  * Resume.aiFeedback
  * Resume.aiStatus    
* Deletes SQS message on success
* Marks resume as failed on error (retry/DLQ ready)

## Versioning
* GET /api/resumes/:id/versions
Lists S3 object versions
* POST /api/resumes/:id/restore/:versionId
Restores a previous version and updates the CloudFront URL

## Comments
* CRUD operations via /api/comments/*
* In-memory caching via cacheService.ts

## 📌 API Endpoints
### Auth
* POST /api/auth/register
* POST /api/auth/login
* GET /api/auth/user/:userId
* PUT /api/auth/user/update
* POST /api/auth/user/change-password
* DELETE /api/auth/user/delete

### Resumes
* POST /api/resumes/upload
* GET /api/resumes
* GET /api/resumes/all
* GET /api/resumes/:id
* PUT /api/resumes
* PUT /api/resumes/update-description
* DELETE /api/resumes

### Versions
* GET /api/resumes/:id/versions
* POST /api/resumes/:id/restore/:versionId

### Comments
* POST /api/comments/add
* GET /api/comments/:resumeId
* PUT /api/comments/:commentId
* DELETE /api/comments/:commentId

### Admin
* GET /api/admin/users

## ⚠️ Notes & Constraints
* Allowed upload types: pdf, jpeg, png
* Max file size: 10 MB
* Resume description length: ≤ 500 characters
* Rate limit: 100 requests / 15 minutes
* S3 bucket must have versioning enabled
* CloudFront URL must match your distribution
* If the worker is not running, aiFeedback will remain empty
