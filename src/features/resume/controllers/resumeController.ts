import { AuthRequest } from '../../../middlewares/auth';
import { Request, Response } from 'express';
import * as validation from '../../../helpers/validation';
import * as resumeService from '../services/resumeService';
import * as errorHandler from '../../../middlewares/errorHandler';

export const getResume = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.userId) {
    errorHandler.handleAuthError(res);
    return;
  }

  const { userId } = req.user;

  try {
    const resume = await resumeService.findResumesByUser(userId);

    if (!resume || resume.length === 0) {
      errorHandler.handleNotFound(res, 'Resume not found');
      return;
    }

    res.status(200).json(resume[0]); 
  } catch (error) {
    errorHandler.handleServerError(res, error, 'Error fetching resume');
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

    const resumes = await resumeService.findResumesWithFilters(filters, Number(page), effectiveLimit);
    const totalResumes = await resumeService.countResumesWithFilters(filters);

    res.status(200).json({
      totalResumes,
      currentPage: Number(page),
      totalPages: Math.ceil(totalResumes / effectiveLimit),
      resumes,
    });
  } catch (error) {
    errorHandler.handleServerError(res, error, 'Error fetching resumes with filters');
  }
};

export const getResumeDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.user || !req.user.userId) {
    errorHandler.handleAuthError(res);
    return;
  }

  try {
    const resume = await resumeService.findResumeById(id);

    if (!resume) {
      errorHandler.handleNotFound(res, 'Resume not found');
      return;
    }

    res.status(200).json(resume);
  } catch (error) {
    errorHandler.handleServerError(res, error, 'Error fetching resume details');
  }
};

export const updateResume = async (req: AuthRequest, res: Response): Promise<void> => {
  const { format, description } = req.body;

  if (!req.user || !req.user.userId) {
    errorHandler.handleAuthError(res);
    return;
  }

  const { userId } = req.user;

  try {
    let resume = await resumeService.findResumesByUser(userId);

    if (!resume || resume.length === 0) {
      const newResume = await resumeService.createResume(userId, format, description, req.file);
      if (!newResume) {
        res.status(500).json({ message: 'Failed to create resume' });
        return;
      }
      res.status(201).json({ message: 'Resume created successfully', resume: newResume });
      return;
    }

    if (description && !validation.validateDescriptionLength(description)) {
      errorHandler.handleInvalidInputError(res, 'Description exceeds maximum length of 500 characters');
      return;
    }

    const updatedResume = await resumeService.updateResumeData(
      resume[0]._id as string,
      format,
      description,
      req.file,
    );
    if (!updatedResume) {
      res.status(500).json({ message: 'Failed to update resume' });
      return;
    }

    res.status(200).json({ message: 'Resume updated successfully', resume: updatedResume });
  } catch (error) {
    errorHandler.handleServerError(res, error, 'Error updating resume');
  }
};

export const updateResumeDescription = async (req: AuthRequest, res: Response): Promise<void> => {
  const { description } = req.body;

  if (!req.user || !req.user.userId) {
    errorHandler.handleAuthError(res);
    return;
  }

  const { userId } = req.user;

  if (!description) {
    errorHandler.handleInvalidInputError(res, 'Description is required');
    return;
  }

  try {
    const resume = await resumeService.findResumesByUser(userId);
    if (!resume || resume.length === 0) {
      errorHandler.handleNotFound(res, 'Resume not found');
      return;
    }

    resume[0].description = description;
    await resume[0].save();
    res.status(200).json({ message: 'Resume description updated successfully', resume: resume[0] });
  } catch (error) {
    errorHandler.handleServerError(res, error, 'Error updating resume description');
  }
};

export const deleteResume = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.userId) {
    errorHandler.handleAuthError(res);
    return;
  }

  const { userId } = req.user;

  try {
    const resume = await resumeService.findResumesByUser(userId);
    if (!resume || resume.length === 0) {
      errorHandler.handleNotFound(res, 'Resume not found');
      return;
    }

    await resumeService.deleteResumeData(resume[0]._id as string);
    res.status(200).json({ message: 'Resume deleted successfully' });
  } catch (error) {
    errorHandler.handleServerError(res, error, 'Error deleting resume');
  }
};