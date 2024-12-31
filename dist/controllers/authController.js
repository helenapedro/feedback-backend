var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import logger from '../helpers/logger';
export const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, isAdmin } = req.body;
    try {
        const existingEmail = yield User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const existingUsername = yield User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'This username is not available.' });
        }
        const hashedPassword = yield bcrypt.hash(password, 10);
        const user = yield User.create({ username, email, password: hashedPassword, isAdmin });
        return res.status(201).json({ id: user._id, username: user.username, email: user.email });
    }
    catch (error) {
        logger.error('Registration error:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
});
export const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield User.findOne({ email, isActive: true });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials or account is deactivated.' });
        }
        const isMatch = yield bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.FEEDBACK_JWT_PRIVATE_KEY, {
            expiresIn: '1h',
        });
        return res.status(200).json({ token, user: { id: user._id, username: user.username, email: user.email } });
    }
    catch (error) {
        logger.error('Login error:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
});
export const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user.userId;
    try {
        const user = yield User.findOne({ _id: userId, isActive: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        logger.error('Get User error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
export const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user.userId;
    const { username, email } = req.body;
    try {
        const existingEmail = yield User.findOne({ email, _id: { $ne: userId } });
        if (existingEmail) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }
        const existingUsername = yield User.findOne({ username, _id: { $ne: userId } });
        if (existingUsername) {
            return res.status(400).json({ message: 'This username is already taken.' });
        }
        const user = yield User.findOneAndUpdate({ _id: userId, isActive: true }, { username, email }, { new: true, runValidators: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        logger.error('Update User error:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
});
export const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;
    try {
        const user = yield User.findOne({ _id: userId, isActive: true });
        if (!user || !(yield bcrypt.compare(oldPassword, user.password))) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }
        user.password = yield bcrypt.hash(newPassword, 10);
        yield user.save();
        return res.status(200).json({ message: 'Password updated successfully' });
    }
    catch (error) {
        logger.error('Change Password error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
export const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user.userId;
    try {
        const user = yield User.findOneAndUpdate({ _id: userId, isActive: true }, { isActive: false });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ message: 'Account deactivated' });
    }
    catch (error) {
        logger.error('Delete User error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
