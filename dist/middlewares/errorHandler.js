import logger from '../helpers/logger';
import { error } from 'console';
export const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
        message: err.message || 'Internal Server Error',
        error
    });
};
