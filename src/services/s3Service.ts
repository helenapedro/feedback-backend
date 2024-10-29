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
  const ext = path.extname(file.originalname);
  const formattedDate = formatDate(new Date());
  const uniqueId = uuidv4();

  const folderName = ['.pdf', '.docx'].includes(ext) ? 'pdf' : 'image';
  const fileName = `${folderName}/resume_${formattedDate}_${uniqueId}${ext}`; 

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    /* ContentDisposition: 'inline',  */
  };

  try {
    const upload = new Upload({
      client: s3,
      params: uploadParams,
    });

    const result = await upload.done();

    return `https://${CLOUDFRONT_URL}/${result.Key}`;

  } catch (error) {
    logger.error("Error uploading file to S3:", error);
    throw new Error('Upload to S3 failed');
  }
};

export { upload, uploadToS3 };