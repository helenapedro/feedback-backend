import { AuthRequest } from '../middlewares/auth';
import { Response } from 'express';
import { uploadToS3 } from '../services/s3Service';
import Resume, { IResume } from '../models/Resume';
import pdfParse from 'pdf-parse';
import logger from '../helpers/logger';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const queueUrl = process.env.AWS_SQS_QUEUE_URL;

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

  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    res.status(400).json({ message: 'Invalid file type' });
    return;
  }

  try {
    const ext = path.extname(req.file.originalname || '').toLowerCase()
      || (req.file.mimetype === 'application/pdf' ? '.pdf'
        : req.file.mimetype === 'image/png' ? '.png'
        : '.jpg');

    const s3Key = `resumes/${posterId}/resume${ext}`;

    const uploadResult = await uploadToS3(req.file, s3Key);

    let extractedText = "";

    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text || "";
    }

    const resume: IResume = await Resume.findOneAndUpdate(
      { posterId },
      {
        posterId,
        format,
        url: uploadResult.url,
        s3Key: uploadResult.key,
        currentVersionId: uploadResult.versionId ?? null,
        description,
        aiFeedback: "", // reset feedback so worker regenerates
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ) as unknown as IResume;

    if (queueUrl) {
      const messageParams = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          resumeId: resume._id.toString(),
          extractedText: extractedText,
        }),
      };

      await sqsClient.send(new SendMessageCommand(messageParams));
      logger.info(`Message sent to SQS for resumeId: ${resume._id.toString()}`);
    } else {
      logger.error('AWS_SQS_QUEUE_URL is not defined');
    }

    res.status(201).json(resume);

  } catch (error) {
    logger.error("Error uploading resume:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};
