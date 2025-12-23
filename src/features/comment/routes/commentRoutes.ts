import express from 'express';
import { authMiddleware } from '../../../middlewares/auth';
import { addComment, getCommentsByResume, updateComment, deleteComment } from '../controllers/commentController'; 

const router = express.Router();

router.post('/add', authMiddleware, addComment);

router.get('/:resumeId', getCommentsByResume);

router.put('/:commentId', authMiddleware, updateComment)

router.delete('/:commentId', authMiddleware, deleteComment);

export default router;
