import { AuthRequest } from '../middlewares/auth';
import { generateAIFeedback } from '../services/AIFeedbackGenerator';
import { Request ,Response } from 'express';
import Resume, {IResume} from '../models/Resume';
import s3 from '../helpers/awsConfig';
import { uploadToS3, deleteFromS3 } from '../services/s3Service';
import { ListObjectVersionsCommand } from '@aws-sdk/client-s3';
import { format } from 'date-fns';
import logger from '../helpers/logger';
import pdfParse from 'pdf-parse';

interface RequestWithParams extends Request {
  params: {
    id: string;
  };
}

export const uploadResume = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const fileUrl = await uploadToS3(req.file);

    let extractedText = "";
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text;
    }

    const resume: IResume = await Resume.create({
      posterId,
      format,
      url: fileUrl,
      description,
      aiFeedback: "", // Will update after generating AI feedback
    });
    
    generateAIFeedback((resume._id as string).toString(), extractedText)
      .then(async (feedback) => {
        resume.aiFeedback = feedback;
        await resume.save();
    })
    .catch((error) => logger.error("AI Feedback generation failed:", error));

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

export const listResumeVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const { userId } = req.user;

  try {
    const resume = await Resume.findById(id);

    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    if (resume.posterId.toString() !== userId) {
      res.status(403).json({ message: 'Not authorized to view this resume' });
      return;
    }

    const params = {
      Bucket: 'feedback-fs',
      Prefix: resume.url.replace('https://d1ldjxzzmwekb0.cloudfront.net/', ''),
    };

    const command = new ListObjectVersionsCommand(params);
    const data = await s3.send(command);

    const versions = data.Versions?.map(version => {
      const lastModified = version.LastModified ? new Date(version.LastModified) : new Date();
      return {
        versionId: version.VersionId,
        lastModified: version.LastModified,
        size: version.Size,
        isLatest: version.IsLatest,
        name: `Version from ${format(lastModified, 'yyyy-MM-dd')}`
      };
    });

    res.status(200).json({ versions });
  } catch (error) {
    logger.error('Error listing resume versions:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateResumeDescription = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { description } = req.body;
  const userId = req.user?.userId;

  if (!description) {
    res.status(400).json({ message: 'Description is required' });
    return;
  }

  try {
    const resume = await Resume.findById(id);
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
    await resume.save();

    res.status(200).json({ message: 'Resume description updated successfully', resume });
  } catch (error) {
    logger.error('Error updating resume description:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteResumeById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const { userId, isAdmin } = req.user;

  try {
    const resume = await Resume.findById(id);

    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    // Check authorization
    if (resume.posterId.toString() !== userId && !isAdmin) {
      res.status(403).json({ message: 'Not authorized to delete this resume' });
      return;
    }

    await deleteFromS3(resume.url);
    await Resume.findByIdAndDelete(id);

    res.status(200).json({ message: 'Resume deleted successfully' });
  } catch (error) {
    logger.error('Error deleting resume:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
