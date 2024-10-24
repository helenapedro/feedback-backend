import { AuthRequest } from '../middlewares/auth';
import { Response } from 'express';
import Resume from '../models/Resume';
import { uploadToS3 } from '../services/s3Service';

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
    console.error("Error uploading resume:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};
