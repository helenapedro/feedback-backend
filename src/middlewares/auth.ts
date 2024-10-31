import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const jwtSecret = process.env.FEEDBACK_JWT_PRIVATE_KEY;

  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  if (!jwtSecret) {
    throw new Error("FEEDBACK_JWT_PRIVATE_KEY is not defined");
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
    next(error);
  }
};
