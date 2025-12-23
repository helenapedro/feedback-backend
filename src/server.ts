import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from './config';
import authRoutes from './features/auth/routes/authRoutes';
import resumeRoutes from './features/resume/routes/resumeRoutes';
import commentRoutes from './features/comment/routes/commentRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger, errorLogger } from './middlewares/logging';

const app = express();

app.set('trust proxy', 1);

const limiter = rateLimit(rateLimitConfig);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://resumefeedback.mtcambrosio.com',
  'https://master.d1cehne8ow0dq0.amplifyapp.com',
  'https://master.d1cehne8ow0dq0.amplifyapp.com/',
  'https://preview--feedbackfrontend.lovable.app',
  'https://id-preview--8ff70115-1b8a-4b17-ab88-281e96dcb538.lovable.app',
  'https://8ff70115-1b8a-4b17-ab88-281e96dcb538.lovableproject.com'
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Authorization', 'Content-Type'],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(requestLogger);
app.use(errorLogger);
app.use(errorHandler);
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/comments', commentRoutes);

app.get('/', (req, res) => {
  res.send('Resume Feedback API');
});


export default app;
