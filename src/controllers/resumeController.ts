import { AuthRequest } from '../middlewares/auth';
import { Request ,Response } from 'express';
import Resume from '../models/Resume';
import { uploadToS3 } from '../services/s3Service';
import logger from '../helpers/logger';

interface RequestWithParams extends Request {
  params: {
    id: string;
  };
}

export const uploadResume = async (req: AuthRequest, res: Response): Promise<void> => {
  const { format } = req.body;

  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  } 

  const posterId = req.userId;
  
  try {
    const fileUrl = await uploadToS3(req.file);
    
    const resume = await Resume.create({
      posterId,
      format,
      url: fileUrl,
    });

    res.status(201).json(resume);
  } catch (error) {
    logger.error("Error uploading resume:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getResumeById = async (req: RequestWithParams, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const resume = await Resume.findById(id).populate('posterId', '-password');

    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    res.status(200).json(resume);
  } catch (error) {
    logger.error("Error fetching resume by ID:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllResumes = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, format, createdAt } = req.query;
  const maxLimit = 100; 

  const effectiveLimit = Math.min(Number(limit) || 10, maxLimit); 

  try {
    const filters: any = {};

    if (format) filters.format = { $regex: format, $options: 'i' };

    if (createdAt) {
      const date = new Date(createdAt as string);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      filters.createdAt = { $gte: date, $lt: nextDay };
    } 

    const resumes = await Resume.find(filters)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * effectiveLimit)
      .limit(effectiveLimit)
      .populate('posterId', '-password');

    const totalResumes = await Resume.countDocuments(filters);

    res.status(200).json({
      totalResumes,
      currentPage: Number(page),
      totalPages: Math.ceil(totalResumes / effectiveLimit),
      resumes,
    });
  } catch (error) {
    logger.error("Error fetching resumes:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteResumeById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const resume = await Resume.findByIdAndDelete(id);

    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    res.status(200).json({ message: 'Resume deleted successfully' });
  } catch (error) {
    logger.error("Error deleting resume:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};