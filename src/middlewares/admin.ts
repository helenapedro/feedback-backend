import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from './auth';

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
