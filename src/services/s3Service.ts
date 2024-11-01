import s3 from '../helpers/awsConfig';
import { Upload } from '@aws-sdk/lib-storage';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import logger from '../helpers/logger';

const BUCKET_NAME = "feedback-fs";
const CLOUDFRONT_URL = "https://d1ldjxzzmwekb0.cloudfront.net";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
  const day = date.getDate().toString().padStart(2, '0'); 
  return `${year}-${month}-${day}`;
};

const uploadToS3 = async (file: Express.Multer.File) => {
  const maxFileSize = 10 * 1024 * 1024; // 10 MB limit
  const retryLimit = 3;
  const ext = path.extname(file.originalname);
  const formattedDate = formatDate(new Date());
  const uniqueId = uuidv4();

  if (file.size > maxFileSize) {
    throw new Error('File size exceeds the 10 MB limit');
  }

  const folderName = ['.pdf', '.docx'].includes(ext) ? 'pdf' : 'image';
  const fileName = `${folderName}/resume_${formattedDate}_${uniqueId}${ext}`; 

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    /* ContentDisposition: 'inline',  */
  };

  for (let attempt = 1; attempt <= retryLimit; attempt++) {
    try {
      const upload = new Upload({
        client: s3,
        params: uploadParams,
      });
      const result = await upload.done();
      return `${CLOUDFRONT_URL}/${result.Key}`;
    } catch (error) {
      logger.error(`Error uploading file to S3, attempt ${attempt}:`, error);
      if (attempt === retryLimit) {
        throw new Error('Upload to S3 failed after multiple attempts');
      }
    }
  }
};

export { upload, uploadToS3 };