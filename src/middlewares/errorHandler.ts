import { Request, Response, NextFunction } from 'express';
import logger from '../helpers/logger';
import { error } from 'console';

export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  logger.error(err.stack); 

  res.status(500).json({
    message: err.message || 'Internal Server Error',
    error
  });
};
