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

  //const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    message: 'Internal Server Error',
    error
    /* ...(isProduction ? {} : { error: err.message }), */
  });
};
