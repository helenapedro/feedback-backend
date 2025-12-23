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

export const handleServerError = (res: Response, error: any, message: string) => {
  logger.error(message, error);
  res.status(500).json({ message: 'Server error', error });
};

export const handleNotFound = (res: Response, message: string) => {
  logger.info(message);
  res.status(404).json({ message });
};

export const handleAuthError = (res: Response) => {
  logger.info('Not authenticated');
  res.status(401).json({ message: 'Not authenticated' });
};

export const handleAuthorizationError = (res: Response) => {
  logger.info('Not authorized');
  res.status(403).json({ message: 'Not authorized' });
};

export const handleInvalidInputError = (res: Response, message: string) => {
  logger.info(message);
  res.status(400).json({ message });
};

