import { AuthRequest } from '../middlewares/auth';
import { Request, Response } from 'express';
import { getCache, setCache, clearCache } from '../services/cacheService';
import Comment from '../models/Comment';
import Resume from '../models/Resume';
import logger from '../helpers/logger';

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { resumeId, content } = req.body;
  const commenterId = req.userId;

  if (!commenterId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    const comment = await Comment.create({ resumeId, commenterId, content });

    clearCache(resumeId);

    res.status(201).json(comment);
  } catch (error) {
    logger.error('Error adding comment:', error);
    
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getCommentsByResume = async (req: Request, res: Response): Promise<void> => {
  const { resumeId } = req.params;
  const cachedComments = getCache(resumeId);

  if (cachedComments) {
    res.status(200).json(cachedComments);
    return;
  }

  try {
    const comments = await Comment.find({ resumeId, isDeleted: false })
      .populate({ path: 'commenterId', select: 'username' })
      .exec();

    logger.info(`Fetched comments: ${JSON.stringify(comments)}`);

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
  } catch (error) { 
    if (error instanceof TypeError && error.message.includes('populated')) { 
      logger.error('Population Error:', error); 
    } else { 
      logger.error('Error getting comments for the given resume ID:', error); 
    } 
    res.status(500).json({ message: 'Server error', error }); 
  } 
};

export const updateComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { commentId } = req.params;
  const { content } = req.body;
  const commenterId = req.userId;

  if (!commenterId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const comment = await Comment.findOne({ _id: commentId, commenterId });
    if (!comment || comment.isDeleted) {
      res.status(404).json({ message: 'Comment not found or has been deleted' });
      return;
    }

    comment.content = content;
    await comment.save();

    clearCache(comment.resumeId.toString());

    res.status(200).json({ message: 'Comment updated successfully', comment });
  } catch (error) {
    logger.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error', error});
  }
};


export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { commentId } = req.params;
  const commenterId = req.userId;

  try {
    const comment = await Comment.findOne({ _id: commentId, commenterId });
    
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    comment.isDeleted = true;
    
    await comment.save();

    clearCache(comment.resumeId.toString());

    res.status(200).json({ message: 'Comment deleted' });
  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


