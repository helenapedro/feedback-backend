import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from './config';

const app = express();
const limiter = rateLimit(rateLimitConfig);

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());

app.use(limiter);

app.get('/', (req, res) => {
     res.send('Resume Feedback API');
});

export default app;