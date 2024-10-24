import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  console.error(err.stack); 

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    message: 'Internal Server Error',
    ...(isProduction ? {} : { error: err.message }),
  });
};
