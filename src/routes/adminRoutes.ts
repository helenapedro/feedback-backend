import { Request, Response } from 'express';
import User from '../models/User';
import logger from '../helpers/logger';

export const getAllUsers = (req: Request, res: Response): void => {
  User.find()
    .select('-password')
    .then((users) => res.status(200).json(users))
    .catch((error) => {
      logger.error('Get All Users error:', error);
      res.status(500).json({ message: 'Server error' });
    });
};

export const getUser = (req: Request, res: Response): void => {
  const { userId } = req.params;

  User.findById(userId)
    .select('-password')
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
    })
    .catch((error) => {
      logger.error('Get User error:', error);
      res.status(500).json({ message: 'Server error' });
    });
};

export const deactivateUser = (req: Request, res: Response): void => {
  const { userId } = req.params;

  User.findByIdAndUpdate(userId, { isActive: false }, { new: true })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User deactivated successfully' });
    })
    .catch((error) => {
      logger.error('Deactivate User error:', error);
      res.status(500).json({ message: 'Server error' });
    });
};
