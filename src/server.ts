import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
//import rateLimit from 'express-rate-limit';

const app = express();


// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());

app.get('/', (req, res) => {
     res.send('Resume Feedback API');
});

export default app;