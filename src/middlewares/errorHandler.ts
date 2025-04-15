import { Request, Response, NextFunction } from 'express';
import logger from '../helpers/logger';
import { error } from 'console';

// Middleware to handle errors in Express applications
// This middleware should be added after all routes and other middlewares
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

// Helper function to handle common error responses
export const handleServerError = (res: Response, error: any, message: string) => {
  logger.error(message, error);
  res.status(500).json({ message: 'Server error', error });
};

// Helper function to handle resource not found responses
export const handleNotFound = (res: Response, message: string) => {
  logger.info(message);
  res.status(404).json({ message });
};

// Helper function to handle authentication errors
export const handleAuthError = (res: Response) => {
  logger.info('Not authenticated');
  res.status(401).json({ message: 'Not authenticated' });
};

// Helper function to handle authorization errors
export const handleAuthorizationError = (res: Response) => {
  logger.info('Not authorized');
  res.status(403).json({ message: 'Not authorized' });
};

// Helper function to handle invalid input errors
export const handleInvalidInputError = (res: Response, message: string) => {
  logger.info(message);
  res.status(400).json({ message });
};

