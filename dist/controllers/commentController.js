"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.getCommentsByResume = exports.addComment = void 0;
const cacheService_1 = require("../services/cacheService");
const Comment_1 = __importDefault(require("../models/Comment"));
const Resume_1 = __importDefault(require("../models/Resume"));
const logger_1 = __importDefault(require("../helpers/logger"));
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { resumeId, content } = req.body;
    const commenterId = req.userId;
    if (!commenterId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        const resume = yield Resume_1.default.findById(resumeId);
        if (!resume) {
            res.status(404).json({ message: 'Resume not found' });
            return;
        }
        const comment = yield Comment_1.default.create({
            resumeId,
            commenterId,
            content,
        });
        (0, cacheService_1.clearCache)(resumeId);
        res.status(201).json(comment);
    }
    catch (error) {
        logger_1.default.error('Error adding comment:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.addComment = addComment;
const getCommentsByResume = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { resumeId } = req.params;
    const cachedComments = (0, cacheService_1.getCache)(resumeId);
    if (cachedComments) {
        res.status(200).json(cachedComments);
        return;
    }
    try {
        const comments = yield Comment_1.default.find({ resumeId, isDeleted: false }).populate('commenterId', 'username');
        if (!comments || comments.length === 0) {
            res.status(404).json({ message: 'No comments found for this resume' });
            return;
        }
        (0, cacheService_1.setCache)(resumeId, comments);
        res.status(200).json(comments);
    }
    catch (error) {
        logger_1.default.error('Error getting comment with the given ID:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getCommentsByResume = getCommentsByResume;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const commenterId = req.userId;
    try {
        const comment = yield Comment_1.default.findOne({ _id: commentId, commenterId });
        if (!comment) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }
        comment.isDeleted = true;
        yield comment.save();
        (0, cacheService_1.clearCache)(comment.resumeId.toString());
        res.status(200).json({ message: 'Comment deleted' });
    }
    catch (error) {
        logger_1.default.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.deleteComment = deleteComment;
