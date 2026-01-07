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
  'https://resumefeedback.hmpedro.com',
  'https://master.d1cehne8ow0dq0.amplifyapp.com',
  'https://id-preview--5badb028-09f1-4253-99b9-1eda3b03112d.lovable.app'
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true, 
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 

app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(limiter);

app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/comments', commentRoutes);

app.get('/', (req, res) => {
  res.send('Resume Feedback API');
});

app.use(errorLogger);
app.use(errorHandler);

export default app;
