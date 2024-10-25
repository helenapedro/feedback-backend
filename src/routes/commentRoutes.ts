import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import { addComment, getCommentsByResume, deleteComment } from '../controllers/commentController'; 

const router = express.Router();

router.post('/add', authMiddleware, addComment);

router.get('/:resumeId', getCommentsByResume);

router.delete('/:commentId', authMiddleware, deleteComment);

export default router;
