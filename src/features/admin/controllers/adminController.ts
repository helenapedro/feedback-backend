import { Request, Response } from 'express';
import User from '../../../models/User';
import logger from '../../../helpers/logger';

export const getAllUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const users = await User.find().select('-password');
    return res.status(200).json(users);
  } catch (error) {
    logger.error('Get All Users error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deactivateUser = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'User deactivated successfully' });
  } catch (error) {
    logger.error('Deactivate User error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
