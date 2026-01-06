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

## Asynchronous Resume Processing Architecture

![Asynchronous Resume Processing Architecture](https://github.com/helenapedro/feedback-backend/blob/main/diagramas/AsynchronousResumeProcessingArchitecture.jpeg)

This system is designed to decouple user-facing operations from AI-intensive processing to ensure responsiveness, scalability, and reliability. When a user uploads a resume, the Backend API stores the file in Amazon S3 and persists metadata in MongoDB, then publishes a message to Amazon SQS containing the resume identifier and extracted text. A dedicated background worker asynchronously consumes messages from the queue, invokes the Gemini AI API to generate structured feedback, and updates the resume record in MongoDB once processing is complete. Resume files are served to clients via Amazon CloudFront for efficient global delivery, while AI feedback and user comments are retrieved from the database through the API. This event-driven design prevents long-running AI tasks from blocking user requests and allows each component to scale independently.

## 🧱 Architecture Overview

### High-Level Flow

![Archtecture Overview](https://github.com/helenapedro/feedback-backend/blob/main/diagramas/ArchtectureOverview.jpeg)

### 📐 Sequence Diagram — Upload & AI Feedback (Async)

![Sequence Diagram](https://mbeuaportfolio-media.s3.us-east-2.amazonaws.com/SequenceDiagram-SQSWorkerArchitecture.jpg)

### Entry Points

- `src/index.ts`  
  Loads environment variables, connects to MongoDB, and starts the HTTP server.
- `src/server.ts`  
  Express application setup (middleware, CORS, routes).

### Routes

| Prefix            | Description                      |
| ----------------- | -------------------------------- |
| `/api/auth/*`     | Authentication & user management |
| `/api/resumes/*`  | Resume upload, listing & details |
| `/api/comments/*` | Resume comments                  |
| `/api/admin/*`    | Admin-only endpoints             |

### 🧩 Feature Structure

- **Auth**

  - User registration & authentication
  - JWT-based authorization
  - Role-based access control (user / admin)
  - Located in: `src/features/auth`

- **Resumes**

  - Resume upload and validation
  - File storage in AWS S3 with CloudFront URLs
  - PDF text extraction
  - Resume versioning (list & restore)
  - Asynchronous AI feedback trigger (SQS)
  - Located in: `src/features/resume`
    - Upload controller: `uploadController.ts`
    - Versioning controller: `versionController.ts`

- **AI Feedback**

  - Resume analysis and feedback generation
  - Integration with Google Gemini API
  - Asynchronous processing via AWS SQS
  - Background worker for message consumption
  - Failure handling with retry/DLQ readiness
  - Located in: `src/features/feedback`
    - Generator service: `AIFeedbackGenerator.ts`
    - Worker: `sqsWorker.ts`

- **Comments**

  - User comments on resumes
  - CRUD operations
  - Simple in-memory caching
  - Located in: `src/features/comment`

- **Admin**

  - Admin-only endpoints
  - User management
  - System-level controls
  - Located in: `src/features/admin`

- **Shared & Infrastructure**

  - Request validation and middlewares
  - Centralized logging (Winston)
  - Error handling helpers
  - Caching utilities
  - Located in: `src/middlewares`, `src/helpers`, `src/shared`

- **Persistence**
  - MongoDB via Mongoose
  - Domain models:
    - `User`
    - `Resume`
    - `Comment`
    - `AIFeedback`
  - Located in: `src/models`

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

- PORT=3000
- MONGO_URI=your_mongo_connection_string
- FEEDBACK_JWT_PRIVATE_KEY=your_jwt_secret

- AWS_REGION=us-east-1
- AWS_ACCESS_KEY_ID=your_key
- AWS_SECRET_ACCESS_KEY=your_secret
- AWS_SQS_QUEUE_URL=your_sqs_queue_url

- GEMINI_API_KEY=your_gemini_api_key
- GEMINI_MODEL_ID=your_model_id

# Optional

- CLOUDFRONT_URL=https://your-distribution.cloudfront.net

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

- POST /api/resumes/upload
- User authentication via JWT
- File validation (type & size)
- Upload to S3
- Resume document saved in MongoDB
- PDF text extraction
- { resumeId, extractedText } enqueued to SQS

## AI Feedback Worker

- Long-polls AWS SQS
- Generates feedback via Gemini
- Updates:
  - Resume.aiFeedback
  - Resume.aiStatus
- Deletes SQS message on success
- Marks resume as failed on error (retry/DLQ ready)

## Versioning

- GET /api/resumes/:id/versions
  Lists S3 object versions
- POST /api/resumes/:id/restore/:versionId
  Restores a previous version and updates the CloudFront URL

## Comments

- CRUD operations via /api/comments/\*
- In-memory caching via cacheService.ts

## 📌 API Endpoints

### Auth

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/user/:userId
- PUT /api/auth/user/update
- POST /api/auth/user/change-password
- DELETE /api/auth/user/delete

### Resumes

- POST /api/resumes/upload
- GET /api/resumes
- GET /api/resumes/all
- GET /api/resumes/:id
- PUT /api/resumes
- PUT /api/resumes/update-description
- DELETE /api/resumes

### Versions

- GET /api/resumes/:id/versions
- POST /api/resumes/:id/restore/:versionId

### Comments

- POST /api/comments/add
- GET /api/comments/:resumeId
- PUT /api/comments/:commentId
- DELETE /api/comments/:commentId

### Admin

- GET /api/admin/users

## ⚠️ Notes & Constraints

- Allowed upload types: pdf, jpeg, png
- Max file size: 10 MB
- Resume description length: ≤ 500 characters
- Rate limit: 100 requests / 15 minutes
- S3 bucket must have versioning enabled
- CloudFront URL must match your distribution
- If the worker is not running, aiFeedback will remain empty
