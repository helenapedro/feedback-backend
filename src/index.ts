import dotenv from 'dotenv';
import connectDB from './helpers/mongoconn';
import app from './server';
import logger from './helpers/logger';

dotenv.config();
connectDB(); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));