var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getCache, clearCache } from '../services/cacheService';
import Comment from '../models/Comment';
import Resume from '../models/Resume';
import logger from '../helpers/logger';
export const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { resumeId, content } = req.body;
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const commenterId = req.user.userId;
    try {
        const resume = yield Resume.findById(resumeId);
        if (!resume) {
            res.status(404).json({ message: 'Resume not found' });
            return;
        }
        const comment = yield Comment.create({ resumeId, commenterId, content });
        clearCache(resumeId);
        res.status(201).json(comment);
    }
    catch (error) {
        logger.error('Error adding comment:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
export const getCommentsByResume = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { resumeId } = req.params;
    const cachedComments = getCache(resumeId);
    if (cachedComments) {
        res.status(200).json(cachedComments);
        return;
    }
    try {
        const comments = yield Comment.find({ resumeId, isDeleted: false })
            .sort({ createdAt: -1 })
            .populate({ path: 'commenterId', select: 'username' })
            .exec();
        //logger.info(`Fetched comments: ${JSON.stringify(comments)}`);
        if (!comments || comments.length === 0) {
            res.status(404).json({ message: 'No comments found for this resume' });
            return;
        }
        const validComments = comments.filter(comment => {
            if (!comment.commenterId || typeof comment.commenterId !== 'object') {
                logger.warn(`Comment: ${comment._id} han an undefined or unpopulated commenterId`);
                return false;
            }
            return true;
        });
        //setCache(resumeId, validComments);
        res.status(200).json(validComments);
    }
    catch (error) {
        if (error instanceof TypeError && error.message.includes('populated')) {
            logger.error('Population Error:', error);
        }
        else {
            logger.error('Error getting comments for the given resume ID:', error);
        }
        res.status(500).json({ message: 'Server error', error });
    }
});
export const updateComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const commenterId = req.user.userId;
    try {
        const comment = yield Comment.findOne({ _id: commentId, commenterId });
        if (!comment || comment.isDeleted) {
            res.status(404).json({ message: 'Comment not found or has been deleted' });
            return;
        }
        comment.content = content;
        yield comment.save();
        clearCache(comment.resumeId.toString());
        res.status(200).json({ message: 'Comment updated successfully', comment });
    }
    catch (error) {
        logger.error('Error updating comment:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
export const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const commenterId = req.user.userId;
    try {
        const comment = yield Comment.findOne({ _id: commentId, commenterId });
        if (!comment) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }
        comment.isDeleted = true;
        yield comment.save();
        clearCache(comment.resumeId.toString());
        res.status(200).json({ message: 'Comment deleted' });
    }
    catch (error) {
        logger.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
