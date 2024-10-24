import express from 'express';
import { uploadResume } from '../controllers/resumeController';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { upload } from '../services/s3Service';

const router = express.Router();

router.post(
  '/upload',
  authMiddleware,
  upload.single('resume'),
  async (req: AuthRequest, res: express.Response, next: express.NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return; 
      }

      await uploadResume(req, res); 
    } catch (error) {
      next(error); 
    }
  }
);

export default router;
