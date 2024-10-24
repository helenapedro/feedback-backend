import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from './config';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger, errorLogger } from './middlewares/logging';

const app = express();
const limiter = rateLimit(rateLimitConfig);

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(requestLogger);
app.use(errorLogger);

app.use(limiter);


// Error Handling
app.use(errorHandler);

app.get('/', (req, res) => {
     res.send('Resume Feedback API');
});

export default app;