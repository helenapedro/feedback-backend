import { AuthRequest } from '../middlewares/auth';
import { checkAuthorization } from './../helpers/validation';
import { Response } from 'express';
import Resume from '../models/Resume';
import { ListObjectVersionsCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { format } from 'date-fns';
import s3 from '../config/awsConfig';
import logger from '../helpers/logger';

const CLOUDFRONT_URL = "https://d1ldjxzzmwekb0.cloudfront.net";

export const listResumeVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const { userId, isAdmin } = req.user;

  try {
    const resume = await Resume.findById(id) as { posterId: string, s3Key: string, url?: string } | null;

    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    if (!checkAuthorization(resume.posterId.toString(), userId, isAdmin)) {
      logger.info('Not authorized to view this resume');
      res.status(403).json({ message: 'Not authorized to view this resume' });
      return;
    }

    const params = {
      Bucket: 'feedback-fs',
      Prefix: resume.s3Key,
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
        name: `Resume version from ${format(lastModified, 'yyyy-MM-dd')}`
      };
    });

    res.status(200).json({ versions: versions });
  } catch (error) {
    logger.error('Error listing resume versions:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const restoreResumeVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id, versionId } = req.params;

  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const { userId, isAdmin } = req.user;

  try {
    const resume = await Resume.findById(id) as { posterId: string, s3Key: string, url?: string } | null;

    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    if (!checkAuthorization(resume.posterId.toString(), userId, isAdmin)) {
      res.status(403).json({ message: 'Not authorized to restore this resume' });
      return;
    }

    const params = {
      Bucket: 'feedback-fs',
      CopySource: `feedback-fs/${resume.s3Key}?versionId=${versionId}`, 
      Key: resume.s3Key, 
    };

    const command = new CopyObjectCommand(params);
    await s3.send(command);

    const updatedResume = await Resume.findByIdAndUpdate(
      id,
      { url: `${CLOUDFRONT_URL}/${resume.s3Key}?t=${Date.now()}` },
      { new: true }
    );

    res.status(200).json({ message: 'Resume restored successfully', resume: updatedResume });
  } catch (error) {
    logger.error('Error restoring resume version:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};