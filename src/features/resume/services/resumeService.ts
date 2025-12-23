import Resume, { IResume } from '../../../models/Resume';
import { uploadToS3, deleteFromS3 } from '../../../services/s3Service';
import path from 'path';
import logger from '../../../helpers/logger';

export const findResumeById = async (id: string) => {
  return Resume.findById(id).populate('posterId', '-password');
};

export const findResumesByUser = async (userId: string) => {
  return Resume.find({ posterId: userId }).populate('posterId', '-password');
};

export const findResumesWithFilters = async (filters: any, page: number, limit: number) => {
  return Resume.find(filters)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('posterId', '-password');
};

export const countResumesWithFilters = async (filters: any) => {
  return Resume.countDocuments(filters);
};

export const createResume = async (userId: string, format?: string, description?: string, file?: Express.Multer.File) => {
  try {
    let s3Key: string | null = null;
    let fileUrl: string | null = null;
    if (file) {
      const ext = path.extname(file.originalname);
      const baseKey = `resume_${Date.now()}_${userId}${ext}`; 
      const uploadedUrl = await uploadToS3(file, baseKey);
      fileUrl = uploadedUrl || null;
      s3Key = fileUrl ? new URL(fileUrl).pathname.substring(1) : null; 
      if (!fileUrl || !s3Key) {
        logger.error('File upload failed: No URL or S3 key received');
        throw new Error('File upload failed');
      }
    }

    const resume = await Resume.create({
      posterId: userId,
      format: format,
      url: fileUrl || undefined,
      s3Key: s3Key || undefined, 
      description: description,
    });
    return resume;
  } catch (error) {
    logger.error('Error creating resume: ', error);
    throw error;
  }
};

export const updateResumeData = async (id: string, format?: string, description?: string, file?: Express.Multer.File) => {
  try {
    const resume = await Resume.findById(id);
    if (!resume) {
      return null;
    }

    let newS3Key: string | null = null;
    let newFileUrl: string | null = null;

    if (file) {
      const ext = path.extname(file.originalname);
      const baseKey = resume.s3Key || `resume_${Date.now()}_${resume.posterId}${ext}`;
      const uploadedUrl = await uploadToS3(file, baseKey);
      newFileUrl = uploadedUrl || null;
      newS3Key = newFileUrl ? new URL(newFileUrl).pathname.substring(1) : null;

      if (newFileUrl) {
        resume.url = `${newFileUrl}?t=${Date.now()}`; 
        resume.s3Key = newS3Key;
      } else {
        throw new Error('File upload failed');
      }
    }

    if (format) resume.format = format;
    if (description) resume.description = description;

    return resume.save();
  } catch (error) {
    logger.error('Error updating resume data: ', error);
    throw error;
  }
};

export const deleteResumeData = async (id: string) => {
  const resume = await Resume.findById(id);
  if (!resume) {
    return null;
  }

  if (resume.url) {
    await deleteFromS3(resume.url.split('?')[0]); 
  }
  return Resume.findByIdAndDelete(id);
};