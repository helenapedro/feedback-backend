import express from 'express';
import * as middlewares from './middlewares/index';
import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from './config';
import authRoutes from './routes/authRoutes';
import resumeRoutes from './routes/resumeRoutes';
import commentRoutes from './routes/commentRoutes';

const app = express();

app.set('trust proxy', 1);

const limiter = rateLimit(rateLimitConfig);

const allowedOrigins = [
  'http://localhost:3000',
  'https://resumefeedback.mtcambrosio.com'
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Authorization', 'Content-Type'],
};

app.use(middlewares.cors(corsOptions));
app.use(express.json());
app.use(middlewares.morgan('dev'));
app.use(middlewares.helmet());
app.use(middlewares.cors());
app.use(middlewares.requestLogger);
app.use(middlewares.errorLogger);
app.use(middlewares.errorHandler);
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/comments', commentRoutes);

app.get('/', (req, res) => {
  res.send('Resume Feedback API');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
