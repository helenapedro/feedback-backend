import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from './auth';

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  User.findById(req.userId)
    .then((user) => {
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }
      next();
    })
    .catch((error) => res.status(500).json({ message: 'Server error' }));
};
