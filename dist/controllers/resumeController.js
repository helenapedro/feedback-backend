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
exports.deleteResumeById = exports.getAllResumes = exports.getResumeById = exports.uploadResume = void 0;
const Resume_1 = __importDefault(require("../models/Resume"));
const s3Service_1 = require("../services/s3Service");
const logger_1 = __importDefault(require("../helpers/logger"));
const uploadResume = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { format } = req.body;
    if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }
    const posterId = req.userId;
    try {
        const fileUrl = yield (0, s3Service_1.uploadToS3)(req.file);
        const resume = yield Resume_1.default.create({
            posterId,
            format,
            url: fileUrl,
        });
        res.status(201).json(resume);
    }
    catch (error) {
        logger_1.default.error("Error uploading resume:", error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.uploadResume = uploadResume;
const getResumeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const resume = yield Resume_1.default.findById(id).populate('posterId', '-password');
        if (!resume) {
            res.status(404).json({ message: 'Resume not found' });
            return;
        }
        res.status(200).json(resume);
    }
    catch (error) {
        logger_1.default.error("Error fetching resume by ID:", error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getResumeById = getResumeById;
const getAllResumes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10 } = req.query;
    try {
        const resumes = yield Resume_1.default.find()
            .sort({ createdAt: -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit)
            .populate('posterId', '-password');
        const totalResumes = yield Resume_1.default.countDocuments();
        res.status(200).json({
            totalResumes,
            currentPage: +page,
            totalPages: Math.ceil(totalResumes / +limit),
            resumes,
        });
    }
    catch (error) {
        logger_1.default.error("Error fetching resumes:", error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAllResumes = getAllResumes;
const deleteResumeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const resume = yield Resume_1.default.findByIdAndDelete(id);
        if (!resume) {
            res.status(404).json({ message: 'Resume not found' });
            return;
        }
        res.status(200).json({ message: 'Resume deleted successfully' });
    }
    catch (error) {
        logger_1.default.error("Error deleting resume:", error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.deleteResumeById = deleteResumeById;
