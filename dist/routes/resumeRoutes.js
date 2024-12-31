var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import { uploadResume, getResumeById, getAllResumes, deleteResumeById, updateResumeDescription } from '../controllers/resumeController';
import { authMiddleware } from '../middlewares/auth';
import { upload } from '../services/s3Service';
import logger from '../helpers/logger';
const router = express.Router();
router.post('/upload', authMiddleware, upload.single('resume'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            logger.error('File upload failed: No file received');
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        yield uploadResume(req, res);
    }
    catch (error) {
        next(error);
    }
}));
router.get('/:id', authMiddleware, getResumeById);
router.get('/', authMiddleware, getAllResumes);
router.delete('/:id', authMiddleware, deleteResumeById);
router.put('/:id/update-description', authMiddleware, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield updateResumeDescription(req, res);
    }
    catch (error) {
        next(error);
    }
}));
export default router;
