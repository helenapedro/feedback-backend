import expressWinston from 'express-winston';
import logger from '../helpers/logger';

export const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  msg: "{{req.method}} {{req.url}} {{res.statusCode}} - {{res.responseTime}}ms",
  meta: true,
});

export const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
});
