var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Resume from '../models/Resume';
import { uploadToS3, deleteFromS3 } from '../services/s3Service';
import logger from '../helpers/logger';
export const uploadResume = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { format, description } = req.body;
    if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const posterId = req.user.userId;
    if (description && description.length > 500) {
        logger.info('Description is too long. Maximum length is 500 characters.');
        res.status(400).json({ message: 'Description is too long. Maximum length is 500 characters.' });
        return;
    }
    try {
        const fileUrl = yield uploadToS3(req.file);
        const resume = yield Resume.create({
            posterId,
            format,
            url: fileUrl,
            description,
        });
        res.status(201).json(resume);
    }
    catch (error) {
        logger.error("Error uploading resume:", error);
        res.status(500).json({ message: 'Server error', error });
    }
});
export const getResumeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const resume = yield Resume.findById(id).populate('posterId', '-password');
        if (!resume) {
            res.status(404).json({ message: 'Resume not found' });
            return;
        }
        res.status(200).json(resume);
    }
    catch (error) {
        logger.error("Error fetching resume by ID:", error);
        res.status(500).json({ message: 'Server error', error });
    }
});
export const updateResumeDescription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { description } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!description) {
        res.status(400).json({ message: 'Description is required' });
        return;
    }
    try {
        const resume = yield Resume.findById(id);
        if (!resume) {
            logger.info('Resume not found');
            res.status(404).json({ message: 'Resume not found' });
            return;
        }
        if (resume.posterId.toString() !== userId) {
            logger.info('Not authorized to update the resume');
            res.status(403).json({ message: 'Not authorized to update this resume' });
            return;
        }
        // Update the description
        resume.description = description;
        yield resume.save();
        res.status(200).json({ message: 'Resume description updated successfully', resume });
    }
    catch (error) {
        logger.error('Error updating resume description:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
export const getAllResumes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, format, createdAt } = req.query;
    const maxLimit = 100;
    const effectiveLimit = Math.min(Number(limit) || 10, maxLimit);
    try {
        const filters = {};
        if (format)
            filters.format = { $regex: format, $options: 'i' };
        if (createdAt) {
            const date = new Date(createdAt);
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);
            filters.createdAt = { $gte: date, $lt: nextDay };
        }
        const resumes = yield Resume.find(filters)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * effectiveLimit)
            .limit(effectiveLimit)
            .populate('posterId', '-password');
        const totalResumes = yield Resume.countDocuments(filters);
        res.status(200).json({
            totalResumes,
            currentPage: Number(page),
            totalPages: Math.ceil(totalResumes / effectiveLimit),
            resumes,
        });
    }
    catch (error) {
        logger.error("Error fetching resumes:", error);
        res.status(500).json({ message: 'Server error', error });
    }
});
export const deleteResumeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const { userId, isAdmin } = req.user;
    try {
        const resume = yield Resume.findById(id);
        if (!resume) {
            res.status(404).json({ message: 'Resume not found' });
            return;
        }
        // Check authorization
        if (resume.posterId.toString() !== userId && !isAdmin) {
            res.status(403).json({ message: 'Not authorized to delete this resume' });
            return;
        }
        yield deleteFromS3(resume.url);
        yield Resume.findByIdAndDelete(id);
        res.status(200).json({ message: 'Resume deleted successfully' });
    }
    catch (error) {
        logger.error('Error deleting resume:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
