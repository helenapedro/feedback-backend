import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import { addComment, getCommentsByResume } from '../controllers/commentController'; 

const router = express.Router();

router.post('/add', authMiddleware, addComment);

router.get('/:resumeId', getCommentsByResume);

export default router;
