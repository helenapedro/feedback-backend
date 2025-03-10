import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import logger from '../helpers/logger';

export const register = async (req: Request, res: Response): Promise<Response> => {
  const { username, email, password, isAdmin } = req.body;

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'This username is not available.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, password: hashedPassword, isAdmin });

    return res.status(201).json({ id: user._id, username: user.username, email: user.email });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};


export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials or account is deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.FEEDBACK_JWT_PRIVATE_KEY as string, {
      expiresIn: '1h',
    });    

    return res.status(200).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

export const getUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = req.user.userId;

  try {
    const user = await User.findOne({ _id: userId, isActive: true }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    logger.error('Get User error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = req.user.userId;
  const { username, email } = req.body;

  try {
    const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existingEmail) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUsername) {
      return res.status(400).json({ message: 'This username is already taken.' });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, isActive: true },
      { username, email },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    logger.error('Update User error:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<Response> => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = req.user.userId;
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ _id: userId, isActive: true });

    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Change Password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


export const deleteUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = req.user.userId;

  try {
    const user = await User.findOneAndUpdate(
      { _id: userId, isActive: true },
      { isActive: false }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'Account deactivated' });
  } catch (error) {
    logger.error('Delete User error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};