import express from 'express';
import { uploadResume } from '../../../controllers/uploadController';
import * as resumeController from '../controllers/resumeController';
import { listResumeVersions, restoreResumeVersion } from '../../../controllers/versionController';
import { authMiddleware, AuthRequest } from '../../../middlewares/auth';
import { upload } from '../../../services/s3Service';
import logger from '../../../helpers/logger';

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

router.get('/', authMiddleware, resumeController.getResume);

router.get('/all', authMiddleware, resumeController.getAllResumes);

router.get('/:id', authMiddleware, resumeController.getResumeDetails);

router.get('/:id/versions', authMiddleware, 
  async (req: AuthRequest, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    await listResumeVersions(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/', authMiddleware, upload.single('resume'), 
  async (req: AuthRequest, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    await resumeController.updateResume(req, res);
  } catch (error) {
    next(error);
  }
});

router.put(
  '/update-description',
  authMiddleware,
  async (req: AuthRequest, res: express.Response, next: express.NextFunction): Promise<void> => {
    try {
      await resumeController.updateResumeDescription(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/restore/:versionId', authMiddleware, 
  async (req: AuthRequest, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    await restoreResumeVersion(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/', authMiddleware, resumeController.deleteResume);

export default router;
