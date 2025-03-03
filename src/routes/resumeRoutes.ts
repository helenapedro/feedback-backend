import express from 'express';
import { 
  uploadResume, 
  getResumeById, 
  getAllResumes, 
  deleteResumeById, 
  updateResumeDescription, 
  listResumeVersions, 
  restoreResumeVersion, 
  updateResume 
} from '../controllers/resumeController';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { upload } from '../services/s3Service';
import logger from '../helpers/logger';

const router = express.Router();

router.post(
  '/upload',
  authMiddleware,
  upload.single('resume'),
  async (req: AuthRequest, res: express.Response, next: express.NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        logger.error('File upload failed: No file received');
        res.status(400).json({ message: 'No file uploaded' });
        return; 
      }

      await uploadResume(req, res); 
    } catch (error) {
      next(error); 
    }
  }
);

router.post('/:id/restore/:versionId', authMiddleware, async (req: AuthRequest, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    await restoreResumeVersion(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/', authMiddleware, getAllResumes);

router.get('/:id', authMiddleware, getResumeById);

router.get('/:id/versions', authMiddleware, async (req: AuthRequest, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    await listResumeVersions(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, upload.single('resume'), async (req: AuthRequest, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    await updateResume(req, res);
  } catch (error) {
    next(error);
  }
});

router.put(
  '/:id/update-description',
  authMiddleware,
  async (req: AuthRequest, res: express.Response, next: express.NextFunction): Promise<void> => {
    try {
      await updateResumeDescription(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', authMiddleware, deleteResumeById);

export default router;
